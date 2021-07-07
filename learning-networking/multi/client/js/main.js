// <reference path="~/client/js/jquery-2.1.3.min.js" />
// <reference path="~/client/js/TweenLite.min.js" />
// <reference path="~/client/js/pixi.js" />

// game parameters
var restURI = ""; // client may be pointed to remote service. ex."https://some.otherhost.com/"
var maxVelocity = 10; // max translate distance per frame.
var refresh = 150; // how often to get game state from the service in milliseconds.

// html5 web workers
var networker = null;
var playerData = null;
var seq = 0;
var lastSeq = 0;

// who am I. GUID is private.
var playerGuid = null;
var playerID = null;

// where am I?
var playerLocationX = 0; 
var playerLocationY = 0;

// where am I going?
var playerTargetX = 0;
var playerTargetY = 0;
var mouseIsDown = false;

// sprite tracking
var playerList = [];
var playerDirtyList = [];

// PIXI globals
var renderer = null;
var stage = null;
var centerX = 0;
var centerY = 0;

// PIXI assets
var playerTexture = null;

$(function () {

    // setup web worker
    if (window.Worker) {
        console.log('Web Workers!');
        networker = new Worker('js/com/liquidint/multiplayer/networker.js');
    }
    
    // PIXI scene setup
    stage = new PIXI.Stage(0x999999);
    renderer = PIXI.autoDetectRenderer($(window).width(), $(window).height());
    $("body").append(renderer.view);

    // use center of stage as 0,0 point for coordinates
    centerX = renderer.width / 2;
    centerY = renderer.height / 2;
    
    // start animation
    requestAnimFrame(animate);

    // load assets    
    playerTexture = PIXI.Texture.fromImage("assets/red-glossy-ball.png"); // ball texture
    
    // enter the game and setup worker
    requestEnterGame();
    networker.addEventListener('message', netWorkerListener, false);

    // PIXI interaction setup for click and touch
    // Touch drag for touch devices
    stage.touchstart = stage.touchmove = function (data) {
        setTarget(data);
    };
    // Click drag for mouse
    stage.mousemove = function (data) {
        if (mouseIsDown) {
            setTarget(data);
        }
    };
    stage.mousedown = function (data) {
        mouseIsDown = true;
        setTarget(data);
    };
    stage.mouseup = function (data) {
        mouseIsDown = false;
    };

});


function requestEnterGame() {
    /*
     * This call should only happen one time when player joins the game.
     * 
     * GUID is private to local player and used to post player changes.
     * 
     * ID is used for sprite tracking in the PIXI scene graph.
     */

    if (playerGuid == null) {
        $.post("/api/Players/initgame", {}).done(function (data) {
            // if successful remember GUID and id
            if (data.GUID != null && data.GUID != "") {
                playerGuid = data.GUID;
                playerID = data.id;
                console.log("Player GUID: " + playerGuid);
                console.log("Player ID: " + playerID);

                // start service interaction                
                doGameState();

            }
        });
    }
}

function netWorkerListener(e) {

    /*
     * This method updates the player data only if the requests come back
     * in the order sent. Because we are using a worker, a post may take
     * longer than others and be returned out of order. In this case we
     * ignore the update to prevent old data from being used.
     * 
     * If there are many dropped updates, raise the refresh value.
     */

    if (e.data.seq > lastSeq) {
        playerData = e.data.players;
    } else {
        console.log('Dropped: ', e.data.seq, lastSeq);
    }
    lastSeq = e.data.seq;
}

function setTarget(pointData) {

    /*
     * Navigate the sprite to a new place by setting the target coordinates. 
     * The sprite will move to that position over time.
     */

    console.log("New Player Target Location: " + pointData.global.x + "," + pointData.global.y);
    playerTargetX = pointData.global.x - centerX;
    playerTargetY = pointData.global.y - centerY;
}

function doGameState() {

    /*
     * Send local player updates and get game state back.
     */
    
    if (playerGuid != null) {

        if (networker != null) {

            // let worker handle network on different thread
            networker.postMessage(['/api/Players/setlocation', 'guid=' + playerGuid + '&x=' + playerLocationX + '&y=' + playerLocationY, seq]);

            // increment to keep track of post order
            seq++;

            // call again after amount of time. not waiting for previous call to finish.
            setTimeout(function () {
                doGameState();
            }, refresh);

        } else {
            
            // fall back if browser doesn't support web workers

            $.post("/api/Players/setlocation", { guid: playerGuid, x: playerLocationX, y: playerLocationY }).done(function (data) {
                playerData = data.players;

                // call again after this call is complete.
                setTimeout(function () {
                    doGameState();
                }, refresh);
            });

        }
        
    }
}

function updateLocalPlayer() {

    // Update my sprite
    var deltaX = playerTargetX - playerLocationX;
    var deltaY = playerTargetY - playerLocationY;

    if (Math.abs(deltaX) > 0 || Math.abs(deltaY) > 0) {
        var normalizedLength = maxVelocity;
        var realLength = Math.sqrt((deltaX * deltaX) + (deltaY * deltaY));

        if (Math.abs(realLength) > maxVelocity) {
            deltaX = deltaX / realLength;
            deltaY = deltaY / realLength;


            deltaX = deltaX * normalizedLength;
            deltaY = deltaY * normalizedLength;

            playerLocationX = playerLocationX + deltaX;
            playerLocationY = playerLocationY + deltaY;          
        }
    }    
}

function updateRemotePlayers() {
    
    /*
     * Update all players with their new positions as received from 
     * the service. The local player is also updated in this process.
     */

    if (playerData) {

        // assume all players are invalid until proven otherwise
        $.each(playerDirtyList, function (key, val) {
            playerDirtyList[key] = 1;
        });

        $.each(playerData, function (index, item) {

            var pixiSprite = null;

            if (playerList[item.id] != null) {

                // get existing player sprite. using ID here because remote player GUID is not known.
                pixiSprite = playerList[item.id];

            } else {

                // player is new to the local player so create new sprite and add to stage.
                pixiSprite = new PIXI.Sprite(playerTexture);
                playerList[item.id] = pixiSprite;

                if (item.id != playerID) {
                    // if this payer is not the local player then tint the ball to differentiate.
                    pixiSprite.tint = 0x00FF00;
                }

                // center the sprites anchor point
                pixiSprite.anchor.x = 0.5;
                pixiSprite.anchor.y = 0.5;

                // add to the PIXI stage. PIXI uses a scene graph so we only need to do this one time.
                stage.addChild(pixiSprite);
            }

            // tween it for smooth motion
            TweenLite.to(pixiSprite.position, 1.5, { x: item.LocationX + centerX, y: item.LocationY + centerY, ease: Linear.easeNone });

            // or not to tween 
            //pixiSprite.position.x = item.LocationX + centerX;
            //pixiSprite.position.y = item.LocationY + centerY;

            // set clean
            playerDirtyList[item.id] = 0;
        });

        // remove all dirty sprites. players that have left the game should be removed.
        $.each(playerDirtyList, function (key, val) {
            if (val == 1) {
                stage.removeChild(playerList[key]);
            }
        });
    }
}

function animate() {

    // place this method in the queue for next frame
    requestAnimFrame(animate);    

    // update player positions
    updateLocalPlayer();
    updateRemotePlayers();

    // TODO: do other amazing visual effects that dont require tracking

    // render the stage   
    renderer.render(stage);
}




