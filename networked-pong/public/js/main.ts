import config from "./util/config";
import { GameState } from "./util/gameState";
import * as PIXI from "pixi.js";
import { Socket, io } from "socket.io-client";

// Declared in EJS file
declare var roomID: any;

const canvas: HTMLCanvasElement = document.getElementById(
  "mycanvas"
) as HTMLCanvasElement;

const app: PIXI.Application = new PIXI.Application({
  view: canvas,
  // width: window.innerHeight * 2/3,
  // height: window.innerHeight / 2,
  width: 800,
  height: 600,
});

// Add textures
app.loader.baseUrl = "img";
app.loader
  .add("bullet", "bullet.png")
  .add("player", "player.png")
  .add("enemy", "enemy.png");
app.loader.onComplete.add(doneLoading);
app.loader.load();

var state: GameState | null = null,
  socket: Socket;

function doneLoading() {
  // createSprites();
  connect();

  transmit();
  app.ticker.add(tick);
}

function connect() {
  // Sockets
  socket = io();
  socket.emit("join-room", roomID);

  socket.on("assign-side", function (side: number) {
    state = new GameState(app, side, socket);
  });

  socket.on("enemy-move", function (y) {
    if (state) {
      console.log("Move enemy received");
      state.enemy.y = y;
    }
  });

  socket.on("bullet-update", function (data) {
    if (state) {
      console.log("Bullet update");
      state.bullet.x = data.x;
      state.bullet.y = data.y;
      state.bullet.vx = data.vx;
      state.bullet.vy = data.vy;
    }
  });

  socket.on("score-update", function (data) {
    if (state) {
      state.p1Score = data.s1;
      state.p2Score = data.s2;
      state.updateScore();
    }
  });

  socket.on("start", function () {
    if (state) {
      app.stage.addChild(state.bullet);
    }
  });

  socket.on("reset", function (vx) {
    if (state) {
      state.bullet.x = app.renderer.width / 2;
      state.bullet.y = app.renderer.height / 2;
      state.bullet.vx = vx * config.ballSpeed;
      state.bullet.vy = 0;

      state.player.y = app.renderer.height / 2;
      state.enemy.y = app.renderer.height / 2;
    }
  });

  socket.on("stop", function () {
    console.log("Stop");
    if (state) {
      app.stage.removeChild(state.bullet);
    }
  });

  socket.on("player-connect", function () {
    console.log("Enemy connected");
    if (state) {
      app.stage.addChild(state.enemy);
    }
  });

  socket.on("player-disconnect", function () {
    console.log("Enemy disconnected");
    if (state) {
      app.stage.removeChild(state.enemy);
    }
  });
}

function transmit() {
  // send position of local paddle
  if (state !== null && state.player.vy !== 0) {
    // console.log('Paddle Move Sent!');
    socket.emit("game-update", "paddle-move", state.player.y);
  }
  setTimeout(transmit, 20);
}

function tick() {
  if (state !== null) {
    state.tick();
  }
}
