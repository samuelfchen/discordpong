const canvas = document.getElementById('mycanvas');

const app = new PIXI.Application({
    view: canvas,
    // width: window.innerHeight * 2/3, 
    // height: window.innerHeight / 2,
    width: 800,
    height: 600
});

// Configs
const BALLSPEED = 4;            // Max speed of ball (movement of paddles changes accordingly)
const MAXBOUNCEANGLE = 1.309;   // Max bounce angle (in radians)
const P1COMPUTER = true;        // Whether P1 is a computer
const P2COMPUTER = true;        // Whether P2 is a computer

// Classes
class Bullet extends PIXI.Sprite {
    constructor(texture) {
        super(texture)

        this.anchor.x = 0.5;
        this.anchor.y = 0.5;        
    }

    reset() {
        // reset
        let coinflip = Math.random() > 0.5;
        let direction = 1;
        if (coinflip) {
            direction = -1;
        }

        let angle = (Math.random() - 0.5) * 0.5;
        this.x = app.renderer.width / 2;
        this.y = app.renderer.height / 2;
        this.vx = BALLSPEED * direction * Math.cos(angle); 
        this.vy = BALLSPEED * -Math.sin(angle);
    }

    tick() {
        
        if (this.x - this.width / 2 < 0) {
            p2Score += 1;
            this.reset();
        }

        if (this.x + this.width / 2 > app.renderer.width) {
            p1Score += 1;
            this.reset();
        }

        // Bounce off ceiling and floor
        if (this.y - this.height / 2 < 0 || this.y + this.height / 2 > app.renderer.height) {
            this.vy *= -1
            if (this.y < 0) {
                this.y = 0 + this.height;
            }

            if (this.y > app.renderer.height) {
                this.y = app.renderer.height - this.height;
            }
        }

        let p;
        if (this.x < 400) {
            p = p1;
        } else {
            p = p2;
        }

        if (
            // b.hit(player, this)
            ((this.y + (this.height / 2)) > (p.y - (p.height / 2))) &&
            ((this.y - (this.height / 2)) < (p.y + (p.height / 2))) &&
            (this.x - (this.width / 2)) < (p.x + (p.width / 2)) &&
            (this.x + (this.width / 2)) > (p.x - (p.width / 2))  
        ) {                
            // Calculate new velocities
            let dist = (p.y - this.y) / (p.height / 1.5);
            let bounceAngle = dist * MAXBOUNCEANGLE;

            let mult = -1;
            if (this.x < 100) {
                mult = 1;
            }

            this.vx = BALLSPEED*mult*Math.cos(bounceAngle);
            this.vy = BALLSPEED*-Math.sin(bounceAngle);

            this.x += this.vx * BALLSPEED;
        }


        this.x += this.vx;
        this.y += this.vy;
    }
}

class Player extends PIXI.Sprite {
    constructor(texture, playerNum, upKey, downKey, ai) {
        super(texture)

        this.anchor.x = 0.5;
        this.anchor.y = 0.5;
        
        this.vy = 0;

        this.num = playerNum;
        
        this.ai = ai;
        
        const xPad = 20;
        if (playerNum === 1) {
            this.x = xPad;
        } else {
            this.x = 800 - xPad;
        }
        this.y = 300;

        if (!ai) {
            const vel = BALLSPEED * 2/3;
            upKey.press = () => { this.vy -= vel; }
            upKey.release = () => { this.vy += vel; }
            downKey.press = () => { this.vy += vel; }
            downKey.release = () => { this.vy -= vel; }
        }

    }

    tick() {
        if (this.ai) {
            let detected = false;

            if (this.num === 1) {
                detected = bullet.x < (350 + BALLSPEED * 25) && bullet.vx < 0;
            } else {
                detected = bullet.x > (450 - BALLSPEED * 25) && bullet.vx > 0;
            }

            if (detected) {
                if (bullet.y - bullet.height / 2 >= this.y) {
                    this.vy = BALLSPEED * 2/3;
                } else if (bullet.y + bullet.height / 2 <= this.y) {
                    this.vy = -(BALLSPEED * 2/3);
                } else {
                    this.vy = 0;
                }
            } else {
                this.vy = 0;
            }            
        }

        let nexty = this.y + this.vy;

        if (nexty - this.height / 2 > 0 && nexty + this.height / 2 < app.renderer.height) {
            this.y += this.vy;
        }
    }
}


// Add textures
app.loader.baseUrl = 'img';
app.loader
    .add('bullet', 'bullet.png')
    .add('player', 'player.png');
app.loader.onComplete.add(doneLoading)
app.loader.load();

// Keyboard
let up = keyboard('ArrowUp'),
    down = keyboard('ArrowDown');

let bullet, players, p1, p2;
let p1Score = 0, p2Score = -1, p1Display, p2Display;


function doneLoading() {
    createSprites();

    app.ticker.add(tick);
}

function createSprites() {
    players = new PIXI.Container();
    bullet = new Bullet(app.loader.resources.bullet.texture);
    p1 = new Player(app.loader.resources.player.texture, 1, keyboard('w'), keyboard('s'), P1COMPUTER);
    p2 = new Player(app.loader.resources.player.texture, 2, keyboard('ArrowUp'), keyboard('ArrowDown'), P2COMPUTER);

    players.addChild(p1);
    players.addChild(p2);

    app.stage.addChild(bullet);
    app.stage.addChild(players);

    // Draw divider
    var divider = new PIXI.Graphics();
    divider.beginFill(0xFFFFFF);
    divider.drawRect(398, 0, 4, 600);
    app.stage.addChild(divider);

    // Score display
    let scoreStyle = new PIXI.TextStyle({
        fontSize: 36,
        fill: "white",
    })

    p1Display = new PIXI.Text(p1Score, scoreStyle);
    p1Display.anchor.x = 1;
    p1Display.position.set(370, 10);
    p2Display = new PIXI.Text(p2Score, scoreStyle);
    p2Display.position.set(430, 10);
    app.stage.addChild(p1Display);
    app.stage.addChild(p2Display);
}

function tick() {
    bullet.tick(players);
    p1.tick();
    p2.tick();

    p1Display.text = p1Score;
    p2Display.text = p2Score;
}

