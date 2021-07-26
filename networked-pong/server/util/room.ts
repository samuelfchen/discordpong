import { Socket } from "socket.io";
import { Game, GameFactory } from "../game/game";

export class Player {
  constructor(public socket: Socket, public num: number) {}
}

export class Room {
  players: (Player | null)[];
  game: Game;

  constructor(
    public id: string,
    public size: number,
    public gameFactory: GameFactory
  ) {
    this.players = [];
    this.game = gameFactory.create(this);
  }

  /**
   * @returns the number of players in the room.
   */
  numPlayers(): number {
    let num = 0;
    for (let i in this.players) {
      if (this.players[i]) {
        num++;
      }
    }
    return num;
  }

  /**
   * Adds a player to room.
   * @returns the player that was added, null if room full
   * @param  {Socket} socket
   */
  addPlayer(socket: Socket): Player | null {
    for (var i = 0; i < this.size; i++) {
      if (!this.players[i]) {
        this.players[i] = new Player(socket, i);

        // Notify client of join
        socket.join(this.id);
        socket.to(this.id).emit("player-connect");
        this.game.onClientJoin(this.players[i]);

        return this.players[i];
      }
    }
    return null;
  }

  /**
   * Removes a player from the room.
   * @param  {Socket} socket
   * @returns Player the player that was removed, null if not found
   */
  removePlayer(socket: Socket): Player | null {
    for (var i = 0; i < this.size; i++) {
      if (this.players[i]?.socket === socket) {
        // Notify other clients of disconnect
        socket.to(this.id).emit("player-disconnect");
        this.game.onClientLeave(this.players[i]);

        let ret = this.players[i];
        this.players[i] = null;

        return ret;
      }
    }
    return null;
  }

  /**
   * @param  {string} message The type of update
   * @param  {any} data The data associated with the update
   */
  update(socket: Socket, message: string, data: any) {
    // Find player
    let p: Player | null = null;
    for (var i = 0; i < this.size; i++) {
      if (this.players[i]?.socket === socket) {
        p = this.players[i];
      }
    }

    this.game.update(p, message, data);
  }
}

// module.exports = Room;
// export default { Room: Room, Player: Player };
