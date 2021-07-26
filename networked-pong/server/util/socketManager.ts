import { Socket } from "socket.io";
import { PongFactory } from "../game/pong";
import { Room } from "./room";

module.exports = () => {
  var rooms: { [key: string]: Room } = {};
  var users: { [key: string]: string } = {};
  var clients = [];
  var io;

  /**
   * Starts socket communication.
   * @param {Socket} server The express http server.
   */
  function listen(server: Socket) {
    io = require("socket.io")(server);

    io.sockets.on("connection", (socket: Socket) => {
      // Add a new client
      addClient(socket);

      socket.on("join-room", join);
      socket.on("disconnect", disconnect);
      socket.on("game-update", gameUpdate);
    });
  }

  /**
   * Gets the room of a given user.
   * @returns null if the room is not found, the room otherwise.
   * @param  {Socket} user
   */
  function getUserRoom(user: Socket) {
    let roomID = users[user.id];
    if (!roomID || !(roomID in rooms)) {
      console.log("Error: Room not found for user " + user.id);
      return null;
    }
    return rooms[roomID];
  }

  /**
   * Sends a game update to the appropriate room.
   * @param  {Socket} this
   * @param  {string} message
   * @param  {any} data
   */
  function gameUpdate(this: Socket, message: string, data: any) {
    // Send game update to the client's room
    getUserRoom(this)?.update(this, message, data);
  }

  /**
   * Called when a client disconnects
   * @param  {Socket} this the socket that has disconnected.
   */
  function disconnect(this: Socket) {
    let player = getUserRoom(this)?.removePlayer(this);

    if (!player) {
      console.log("Anonymous disconnect.");
    }
  }

  /**
   * Called when a client joins a room.
   * @param  {Socket} socket
   * @param  {string} roomID
   */
  function join(this: Socket, roomID: string) {
    console.log("join-room: " + this.id);
    createIfNotExists(roomID); // Comment out if you don't want to create a new room by default

    if (!(roomID in rooms)) {
      console.log("Error: room does not exist");
      return;
    }

    let room = rooms[roomID];
    let player = room.addPlayer(socket);
    console.log(player);

    if (player !== null) {
      users[socket.id] = roomID;
    }
    return;
  }

  /**
   * Create new room if roomID does not exist.
   * @param  {string} roomID
   */
  function createIfNotExists(roomID: string) {
    if (!(roomID in rooms)) {
      console.log("Room ID does not exist, creating new room.");
      createRoom(roomID);
    }
  }

  /**
   * Create a new room.
   * @param  {string} roomID
   */
  function createRoom(roomID: string) {
    rooms[roomID] = new Room(roomID, 2, new PongFactory());
  }

  /**
   * Adds a client.
   * @param  {Socket} socket
   */
  function addClient(socket: Socket) {
    clients.push(socket);
  }

  return {
    listen: listen,
    createRoom: createRoom,
    rooms: rooms,
    users: users,
    io: io,
  };
};
