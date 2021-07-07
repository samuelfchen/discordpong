
const express = require('express');

let app = express();

let server = app.listen(process.env.PORT || 3000, () => {
    console.log('listening on *:3000');
});

app.use(express.static('public'));

let io = require('socket.io')(server);

let p1 = null, p2 = null; 

function startBullet() {
    
}

io.sockets.on('connection', 
  function (socket) {
    console.log("We have a new client: " + socket.id);
    
    if (p1 === null) {
        p1 = socket;
        console.log('Player 1 has connected');
        socket.emit('p1');
    } else if (p2 === null) {
        p2 = socket;
        console.log('Player 2 has connected');
        socket.emit('p2');
    } else {
        console.log('Game is full!');
        socket.disconnect();
    } 

    if (p1 && p2) {
        // Game is full, start game
        let data = () => {
            // Generate starting conditions
            let direction = Math.random() > 0.5 ? -1 : 1;

            let angle = (Math.random() - 0.5) * 0.5;
            let vx = direction * Math.cos(angle); 
            let vy = -Math.sin(angle);

            return { 
                vx : vx,
                vy : vy
            }
        }
        io.sockets.emit('start', data());
    }

    socket.on('paddleMove', function(data) {
        socket.broadcast.emit('moveEnemy', data);
    });

    socket.on('bulletUpdate', function(data) {
        socket.broadcast.emit('bullet', data);
    });
    
    socket.on('disconnect', function() {
        if (p1 != null && this.id === p1.id) {
            p1 = null;
            console.log('Player 1 has disconnected');
        } else if (p2 != null && this.id === p2.id) {
            p2 = null;
            console.log('Player 2 has disconnected');
        } else {
            console.log('Client has disconnected');
        }
    });
  }
);