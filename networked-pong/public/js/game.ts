import config from './util/config';
import { GameState } from './util/gameState';
import * as PIXI from 'pixi.js';
import { Socket, io } from 'socket.io-client';

// var { Socket, io } = require('socket.io-client');
// var PIXI = require('pixi.js');

// Declared in EJS file
declare var roomID: any;

const canvas: HTMLCanvasElement = document.getElementById('mycanvas') as HTMLCanvasElement;

const app: PIXI.Application = new PIXI.Application({
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

var state: GameState | null = null, socket: Socket;

function doneLoading() {
    // createSprites();
    connect();

    transmit();
    app.ticker.add(tick);
}

function connect() {
    // Sockets
    socket = io();
    socket.emit('join-room', roomID);

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
        if (state !== null) {
            console.log('Move enemy received');
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
        if (state) {
            console.log('Received start');
            app.stage.addChild(state.bullet);
            state.bullet.x = app.renderer.width / 2;
            state.bullet.y = app.renderer.height / 2;
            state.bullet.vx = data.vx * config.ballSpeed;
            state.bullet.vy = data.vy * config.ballSpeed;
        }
    });

    socket.on('enemy-disconnect', function () {
        console.log('Enemy disconnected');
        if (state) {
            app.stage.removeChild(state.enemy);
            app.stage.removeChild(state.bullet);
        }
    });

    socket.on('enemy-connect', function () {
        console.log('Enemy connected');
        if (state) {
            app.stage.addChild(state.enemy);
        }
    });
}


function transmit() {
    // send position of local paddle
    if (state !== null && state.player.vy !== 0) {
        // console.log('Paddle Move Sent!');
        socket.emit('paddleMove', state.player.y, roomID);
    }
    setTimeout(transmit, 50);
}

function tick() {
    if (state !== null) { state.tick(); }
}

// export = state;