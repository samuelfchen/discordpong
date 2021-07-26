const path = require("path");
const http = require("http");
const express = require("express");
const socket = require("./util/socketManager.js");

const port = process.env.PORT || 3000;

const app = express();
const server = http.createServer(app);

// Socket Manager
let { io, rooms, users } = socket();
socket().listen(server);

// Public folder
app.use(express.static(path.join(__dirname, "../public")));

// View Engine
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "../views"));

// Paths
app.get("/", (req: any, res: any) => {
  res.render("404");
});

app.get("/:room", (req: any, res: any) => {
  const roomID = req.params.room;
  if (roomID in rooms) {
    console.log(rooms[roomID].p1 === null);
    console.log(rooms[roomID].p2 === null);
    if (rooms[roomID].p1 === null || rooms[roomID].p2 === null) {
      res.render("index", { roomID: req.params.room });
    } else {
      res.render("error", { errorMessage: "This room is full." });
    }
  } else {
    res.render("index", { roomID: req.params.room });
  }
});

server.listen(port, () => {
  console.log(`Server is up on port ${port}!`);
});
