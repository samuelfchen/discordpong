const path = require('path');
const http = require('http');
const express = require('express');
const socket = require('./socketManager.js');

const app = express();
const server = http.createServer(app);

let { io, rooms, users } = socket(server);

const port = process.env.PORT || 3000;
const publicDirectoryPath = path.join(__dirname, '../public');

app.use(express.static(path.join(__dirname, '../public')));

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, '../views'));

app.get('/', (req: any, res: any) => {
    res.render('404');
});

app.get('/:room', (req: any, res: any) => {
    const roomID = req.params.room;
    if (roomID in rooms) {
        res.render('index', { roomID : req.params.room });
    } else {
        res.render('404');
    } 
});

server.listen(port, () => {
    console.log(`Server is up on port ${port}!`);
});

