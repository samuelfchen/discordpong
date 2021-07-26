import config from "./config";
import keyboard from "./keyboard";
import * as PIXI from "pixi.js";
import { Socket } from "socket.io-client";

declare var roomID: any; // Declared in ejs template

class GameState {
  bullet: Bullet;
  player: Player;
  enemy: Enemy;
  p1: Paddle;
  p2: Paddle;
  p1Display: PIXI.Text;
  p2Display: PIXI.Text;
  p1Score: number;
  p2Score: number;
  scoreStyle: PIXI.TextStyle;

  constructor(
    public app: PIXI.Application,
    playerNum: number,
    public socket: Socket
  ) {
    // Declare entities
    this.bullet = new Bullet(app, app.loader.resources.bullet.texture!);
    this.player = new Player(
      app,
      app.loader.resources.player.texture!,
      playerNum,
      keyboard(config.p2Input[0]),
      keyboard(config.p2Input[1])
    );
    this.enemy = new Enemy(
      app,
      app.loader.resources.enemy.texture!,
      playerNum === 1 ? 2 : 1
    );

    // allocate p1 and p2
    this.p1 = this.player;
    this.p2 = this.enemy;

    if (this.player.side == 1) {
      this.p1 = this.player;
      this.p2 = this.enemy;
    } else {
      this.p1 = this.enemy;
      this.p2 = this.player;
    }

    // Only display player for now, until enemy spawns and game starts
    app.stage.addChild(this.player);

    // Score display
    this.scoreStyle = new PIXI.TextStyle({
      fontSize: 36,
      fill: "white",
    });

    this.p1Score = 0;
    this.p2Score = 0;

    this.p1Display = new PIXI.Text(
      this.p1Score.toLocaleString(),
      this.scoreStyle
    );
    this.p1Display.anchor.x = 1;
    this.p1Display.position.set(370, 10);
    this.p2Display = new PIXI.Text(
      this.p2Score.toLocaleString(),
      this.scoreStyle
    );
    this.p2Display.position.set(430, 10);
    app.stage.addChild(this.p1Display);
    app.stage.addChild(this.p2Display);
  }
  /**
   * Checks if a bullet-paddle collision has happened.
   * Calculates new bullet velocities and updates the server.
   * @param  {Bullet} b
   * @param  {Paddle} p
   */
  paddleCollision(b: Bullet, p: Paddle) {
    if (
      b.y + b.height / 2 > p.y - p.height / 2 &&
      b.y - b.height / 2 < p.y + p.height / 2 &&
      b.x - b.width / 2 < p.x + p.width / 2 &&
      b.x + b.width / 2 > p.x - p.width / 2
    ) {
      // Calculate new velocities
      let dist = (p.y - b.y) / (p.height / 1.5);
      let bounceAngle = dist * config.maxAngle;

      let mult = p.side === 1 ? 1 : -1;

      b.vx = config.ballSpeed * mult * Math.cos(bounceAngle);
      b.vy = config.ballSpeed * -Math.sin(bounceAngle);

      b.x += b.vx * config.ballSpeed; // Help out direction change

      console.log("boing");
      // Update server
      this.socket.emit("game-update", "bounce", {
        x: this.bullet.x,
        y: this.bullet.y,
        vx: this.bullet.vx,
        vy: this.bullet.vy,
      });
    }
  }
  /**
   * Checks if ball is out of bounds (signalling a score increment)
   */
  checkWin() {
    if (
      this.bullet.x - this.bullet.width / 2 < 0 ||
      this.bullet.x + this.bullet.width / 2 > this.app.renderer.width
    ) {
      // Send to server (only the miss update from the side
      // 'in possession' will be considered)
      this.socket.emit("game-update", "miss", {});
    }
  }
  /**
   * Updates the score
   */
  updateScore() {
    this.p1Display.text = this.p1Score.toLocaleString();
    this.p2Display.text = this.p2Score.toLocaleString();
  }
  /**
   * Tick
   */
  tick() {
    this.bullet.tick();
    this.player.tick();
    this.enemy.tick();

    // Only check for paddle collision on the side in which
    // the bullet is heading.
    if (this.bullet.x < this.app.renderer.width / 2) {
      this.paddleCollision(this.bullet, this.p1);
    } else {
      this.paddleCollision(this.bullet, this.p2);
    }

    this.checkWin();
  }
}

class Bullet extends PIXI.Sprite {
  vy: number = 0;
  vx: number = 0;

  constructor(public app: PIXI.Application, texture: PIXI.Texture) {
    super(texture);

    this.anchor.x = 0.5;
    this.anchor.y = 0.5;

    this.x = app.renderer.width / 2;
    this.y = app.renderer.height / 2;
  }

  tick() {
    // Bounce off ceiling and floor
    if (
      this.y - this.height / 2 < 0 ||
      this.y + this.height / 2 > this.app.renderer.height
    ) {
      this.vy *= -1;
      if (this.y < 0) {
        this.y = 0 + this.height;
      }

      if (this.y > this.app.renderer.height) {
        this.y = this.app.renderer.height - this.height;
      }
    }

    this.x += this.vx;
    this.y += this.vy;
  }
}

class Paddle extends PIXI.Sprite {
  vx: number = 0;
  vy: number = 0;
  score: number = 0;

  constructor(
    public app: PIXI.Application,
    texture: PIXI.Texture,
    public side: number
  ) {
    super(texture);

    this.anchor.x = 0.5;
    this.anchor.y = 0.5;

    this.vy = 0;
    this.vx = 0;

    // Set x coord
    if (side === 1) {
      this.x = config.playerX;
    } else {
      this.x = app.renderer.width - config.playerX;
    }

    this.y = app.renderer.height / 2;
  }

  tick() {
    let nextY = this.y + this.vy;

    // Bound y movement.
    if (
      nextY - this.height / 2 > 0 &&
      nextY + this.height / 2 < this.app.renderer.height
    ) {
      this.y += this.vy;
    }
  }
}

class Player extends Paddle {
  constructor(
    app: PIXI.Application,
    texture: PIXI.Texture,
    side: number,
    upKey: any,
    downKey: any
  ) {
    super(app, texture, side);

    // Declare movement
    upKey.press = downKey.release = () => {
      this.vy -= config.playerVel;
    };
    upKey.release = downKey.press = () => {
      this.vy += config.playerVel;
    };
  }
}

class Enemy extends Paddle {
  constructor(app: PIXI.Application, texture: PIXI.Texture, side: number) {
    super(app, texture, side);
  }
}

export { GameState, Player, Enemy, Bullet };
