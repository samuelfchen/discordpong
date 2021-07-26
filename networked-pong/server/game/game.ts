import { Socket } from "socket.io";
import { Room, Player } from "../util/room";

// Interface for future games.
export class Game {
  constructor(public room: Room) {}

  start() {}

  stop() {}

  update(player: Player | null, message: string, data: any) {}

  onClientJoin(player: Player | null) {}

  onClientLeave(player: Player | null) {}
}

export class GameFactory {
  create(room: Room): Game {
    return new Game(room);
  }
}
