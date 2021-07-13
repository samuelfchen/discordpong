import config from './config.js'
import { GameState } from './gameState.js';

const canvas = document.getElementById('mycanvas');

const app = new PIXI.Application({
    view: canvas,
    // width: window.innerHeight * 2/3, 
    // height: window.innerHeight / 2,
    width: 800,
    height: 600
});



// Add textures
app.loader.baseUrl = 'img';
app.loader
    .add('bullet', 'bullet.png')
    .add('player', 'player.png')
    .add('enemy', 'enemy.png');
app.loader.onComplete.add(doneLoading)
app.loader.load();

var state, socket;

function doneLoading() {
    // createSprites();
    connect();

    transmit();
    app.ticker.add(tick);
}

function connect() {
    // Sockets
    socket = io();
    socket.on('p1', 
        function() {
            state = new GameState(app, 1, socket);
        }
    );
    socket.on('p2', 
        function() {
            state = new GameState(app, 2, socket);
        }
    );

    socket.on('moveEnemy', function (y) {
        if (state != null) {
            state.enemy.y = y;
        }
    });

    socket.on('bullet', function(data) {
        if (state) {
            state.bullet.x = data.x;
            state.bullet.y = data.y;
            state.bullet.vx = data.vx;
            state.bullet.vy = data.vy;
        }
    });

    socket.on('start', function(data) {
        state.bullet.x = app.renderer.width / 2;
        state.bullet.y = app.renderer.height / 2;
        state.bullet.vx = data.vx * config.ballSpeed;
        state.bullet.vy = data.vy * config.ballSpeed;
    })
}


function transmit() {
    // send position of local paddle
    if (state != null) {
        socket.emit('paddleMove', state.player.y);
    }
    setTimeout(transmit, 50);
}

function tick() {
    if (state != null) { state.tick(); }
}

