const express = require('express');
const { resolve } = require('path');

const app = express();
const port = process.env.PORT || 3001;

app.use(express.static('static'));
const cors = require('cors');
app.use(cors());
const http = require('http').Server(app);

const socketIO = require('socket.io')(http, {
  cors: {
    origin: ["http://localhost:5173", "http://ec2-51-21-195-196.eu-north-1.compute.amazonaws.com:3001"]
  },
});

let roomsArr = []

socketIO.on('connection', (socket) => {
  console.log(`⚡: ${socket.id} user just connected!`);
  socket.on('disconnect', () => {
    roomsArr = roomsArr.filter((room) => {
      return room.userId != socket.id
    })
    console.log('🔥: user disconnected');
  });
  socket.on('createRoom',(data) => {
    socket.join(data.roomName)
    roomsArr.push({
      roomName: data.roomName,
      solution: data.solution,
      userId: socket.id,
      members: [socket.id]
    })
    console.log(`${data.name} Created the room: ${data.roomName}`);
  })

  socket.on('joinRoom',(data) => {
    const roomIndex = roomsArr.findIndex((room) => room.roomName == data.roomName)
    if(roomIndex > -1){
      if(roomsArr[roomIndex].members?.length >= 2){
        socket.emit('roomFull',{
          message: 'Room is full'
        })
      }else{
        socket.join(data.roomName)
        roomsArr[roomIndex].members.push(socket.id)
        console.log(`${data.name} Joined the room: ${data.roomName}`);
        const solution = roomsArr[roomsArr.findIndex((room) => room.roomName == data.roomName)]?.solution
        console.log(roomsArr[roomIndex].members)
        socket.to(data.roomName).emit('validRoom',{
          message: 'Room is valid',
          roomName: data.roomName,
          solution: solution
        })
        socket.emit('validRoom',{
          message: 'Room is valid',
          roomName: data.roomName,
          solution: solution
        })
        
      }
    }else{
      socket.emit('invalidRoom',{
        message: 'Room is invalid'
      })
    }
  })

});

app.get('/', (req, res) => {
  res.json({
    message: 'Hello world from wordle',
  });
});

http.listen(port, () => console.log(`Listening on port ${port}`));
