import { Server, Socket } from "socket.io";

let socketManager = (server: any) => {
    
    let io = require('socket.io')(server);

    type Room = {
        p1: Socket | null,
        p2: Socket | null
    };
    

    let rooms: {[key: string]: Room} = {};
    let users: {[key: string]: string} = {};

    function addRoom(roomID: string) {
        rooms[roomID] = {
            p1: null,
            p2: null
        };
    }

    addRoom('test-room');

    io.sockets.on('connection', 
        function (socket: Socket) {
            console.log("New client: " + socket.id);
            
            socket.on('join-room', function (this: Socket, roomID: string) {
                console.log('join-room : ' + socket.id);
                // if (!(roomID in rooms)) {
                //     // Add empty room
                //     console.log('Room does not exist, creating new room!');
                //     rooms[roomID] = {
                //         p1: null,
                //         p2: null
                //     };   
                // }

                let room = rooms[roomID];
                
                if (room.p1 === null) {
                    room.p1 = this;
                    console.log('Player 1 has connected to room ' + roomID);
                    this.emit('p1');
                    this.join(roomID);
                    users[socket.id] = roomID;

                    if (room.p2 !== null) {
                        io.to(roomID).emit('enemy-connect');
                    }
                } else if (room.p2 === null) {
                    room.p2 = this;
                    console.log('Player 2 has connected to room ' + roomID);
                    this.emit('p2');
                    this.join(roomID);
                    users[socket.id] = roomID;

                    if (room.p1 !== null) {
                        io.to(roomID).emit('enemy-connect');
                    }
                } else {
                    console.log('Game is full!');
                    this.disconnect();
                }

                if (room.p1 !== null && room.p2 !== null) {
                    // Game is full, start game
                    console.log('Starting game in room ' + roomID);
                    io.to(roomID).emit('start', { vx: Math.random() > 0.5 ? -1 : 1, vy: 0 });
                }
            });            

            socket.on('paddleMove', function(y, roomID) {
                // console.log('Paddle move received');
                // console.log(roomID);
                socket.to(roomID).emit('moveEnemy', y);
            });

            socket.on('bulletUpdate', function(data, roomID) {
                socket.to(roomID).emit('bullet', data);
            });
            
            socket.on('disconnect', function(this: Socket) {
                let roomID = users[this.id];

                if (roomID in rooms) {
                    let room = rooms[roomID];

                    if (room.p1 != null && this.id === room.p1.id) {
                        room.p1 = null;
                        console.log('Player 1 has disconnected from ' + roomID);
                        io.to(roomID).emit('enemy-disconnect');
                    } else if (room.p2 != null && this.id === room.p2.id) {
                        room.p2 = null;
                        console.log('Player 2 has disconnected from ' + roomID);
                        io.to(roomID).emit('enemy-disconnect');
                    } else {
                        console.log('Client has disconnected');
                    }
                }
            });
        }
    );

    return { io, rooms, users };
}

module.exports = socketManager;