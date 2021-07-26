import { Room, Player } from "../util/room";
import { Game, GameFactory } from "./game";

interface Ball {
  x: number;
  y: number;
  vx: number;
  vy: number;
}

export class Pong extends Game {
  ball: Ball;
  p1: Player | null = null;
  p2: Player | null = null;
  possession: Player | null = null;
  s1: number;
  s2: number;
  ticking: boolean = false;
  cooldown: boolean = false;

  constructor(public room: Room) {
    super(room);
    this.ball = {
      x: 0,
      y: 0,
      vx: 0,
      vy: 0,
    };
    this.s1 = 0;
    this.s2 = 0;
  }

  start() {
    // Check that the room is full
    if (this.room.size !== this.room.numPlayers()) {
      console.log("Error: Game was attempted to start before room was full.");
      return null;
    }

    this.p1 = this.room.players[0];
    this.p2 = this.room.players[1];
    this.possession = this.p1;

    this.p1?.socket.emit("start");
    this.p2?.socket.emit("start");
    this.reset();
  }

  stop() {
    this.p1?.socket.emit("stop");
    this.p2?.socket.emit("stop");
  }
  /**
   * Debug function : prints which player is in possession.
   */
  printPossession() {
    if (this.possession === this.p1) {
      console.log("P1 in possession");
    } else if (this.possession === this.p2) {
      console.log("P2 in possession");
    } else {
      console.log("uh oh");
    }
  }
  /**
   * Handles an update from a client
   * @param  {Player} player
   * @param  {string} message
   * @param  {any} data
   */
  update(player: Player, message: string, data: any) {
    // Paddle move is directly sent to other player
    if (message === "paddle-move") {
      let p: Player | null = null;

      if (this.p1 === player) {
        p = this.p2;
      } else if (this.p2 === player) {
        p = this.p1;
      }

      p?.socket.emit("enemy-move", data);
      return;
    }

    // For ball updates, only care about the person the ball is heading towards
    if (player === this.possession && this.cooldown === false) {
      this.cooldown = true;
      switch (message) {
        case "bounce":
          // Switch the possession and broadcast new bullet props to other player
          this.possession = this.possession === this.p1 ? this.p2 : this.p1;
          this.printPossession();
          this.ball = data;
          this.possession?.socket.emit("bullet-update", this.ball);
          break;
        case "miss":
          // Switch the possession and increment the score
          this.possession = this.possession === this.p1 ? this.p2 : this.p1;
          this.printPossession();
          this.reset();
          if (this.possession === this.p1) {
            this.s1++;
          } else {
            this.s2++;
          }
          this.p1?.socket.emit("score-update", { s1: this.s1, s2: this.s2 });
          this.p2?.socket.emit("score-update", { s1: this.s1, s2: this.s2 });

          break;
      }

      // Reset cooldown after a short delay.
      setTimeout(() => {
        this.cooldown = false;
      }, 200);
    }
  }

  /**
   * Called when the bullet needs to be reset to the middle of the screen.
   */
  reset() {
    let vx = this.possession === this.p1 ? -1 : 1;

    this.p1?.socket.emit("reset", vx);
    this.p2?.socket.emit("reset", vx);
  }

  /**
   * Called when a new client joins.
   * @param  {Player|null} player
   */
  onClientJoin(player: Player | null) {
    player?.socket.emit("assign-side", player?.num + 1);

    // If the room is full, start the game
    if (this.room.size === this.room.numPlayers()) {
      this.start();
      // Emit player connect to generate enemy player
      player?.socket.emit("player-connect");
    }
  }
  /**
   * Called when a client leaves. Reset the score.
   * @param  {Player|null} player
   */
  onClientLeave(player: Player | null) {
    this.stop();
    this.s1 = 0;
    this.s2 = 0;
  }
}

export class PongFactory extends GameFactory {
  create(room: Room): Game {
    return new Pong(room);
  }
}
