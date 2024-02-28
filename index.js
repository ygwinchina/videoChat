const express = require('express');
const socket = require('socket.io');

let app = express();

let server = app.listen(4000, function () {
  console.log("4000 port is Running!");
})

app.use(express.static('public'));

let io = socket(server);

io.on("connection", function (socket) {

  socket.on("join", function (roomName) {
    let rooms = io.sockets.adapter.rooms;
    let room = rooms.get(roomName);

    if (room == undefined) {
      socket.join(roomName);
      socket.emit("create", roomName);
    } else if (room.size == 1) {
      socket.join(roomName);
      socket.emit("joined", roomName);
    } else {
      socket.emit("full", roomName);
    }

  })

  //服务器转发
  socket.on("ready", function (roomName) {
    socket.broadcast.to(roomName).emit("ready");
  })

  socket.on("candidate", function (candidate, roomName) {
    socket.broadcast.to(roomName).emit("candidate", candidate);
  })

  socket.on("offer", function (offer, roomName) {
    console.log(offer);
    socket.broadcast.to(roomName).emit("offer", offer);
  })

  socket.on("answer", function (answer, roomName) {
    socket.broadcast.to(roomName).emit("answer", answer);
  })

  socket.on("leave", function (roomName) {
    socket.leave(roomName);
    socket.broadcast.to(roomName).emit("leave");
  })
})







