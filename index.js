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
    origin: ["http://localhost:5173", "https://wordle-shehas.netlify.app"]
  },
});

let roomsArr = []

socketIO.on('connection', (socket) => {
  console.log(`⚡: ${socket.id} user just connected!`);
  socket.on('disconnect', () => {
    roomsArr.forEach((room) => {
      if (room.members.some(member => member.id === socket.id)) {
        socket.to(room.roomName).emit('playerDisconnected', { message: 'Opponent disconnected' });
      }
    });
    roomsArr = roomsArr.filter((room) => !room.members.some(member => member.id === socket.id));
    console.log('🔥: user disconnected');
  });
  socket.on('createRoom',(data) => {
    socket.join(data.roomName)
    roomsArr.push({
      roomName: data.roomName,
      solution: data.solution,
      userId: socket.id,
      members: [{ id: socket.id, name: data.name }]
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
        roomsArr[roomIndex].members.push({ id: socket.id, name: data.name })
        console.log(`${data.name} Joined the room: ${data.roomName}`);
        const currentRoom = roomsArr[roomIndex];
        console.log(currentRoom.members)
        socket.to(data.roomName).emit('validRoom',{
          message: 'Room is valid',
          roomName: data.roomName,
          solution: currentRoom.solution,
          players: currentRoom.members
        })
        socket.emit('validRoom',{
          message: 'Room is valid',
          roomName: data.roomName,
          solution: currentRoom.solution,
          players: currentRoom.members
        })
        
      }
    }else{
      socket.emit('invalidRoom',{
        message: 'Room is invalid'
      })
    }
  })

  socket.on('playerWon', (data) => {
    socket.to(data.roomName).emit('opponentWon', {
      message: 'Opponent has won the game'
    });
  });

  socket.on('playerFailed', (data) => {
    socket.to(data.roomName).emit('opponentFailed', {
      message: 'Opponent has failed'
    });
    const roomIndex = roomsArr.findIndex((room) => room.roomName == data.roomName)
    if(roomIndex > -1){
      roomsArr[roomIndex].failedCount = (roomsArr[roomIndex].failedCount || 0) + 1;
      if (roomsArr[roomIndex].failedCount === 2) {
        socket.to(data.roomName).emit('matchTied');
        socket.emit('matchTied');
      }
    }
  });

});

app.get('/', (req, res) => {
  res.json({
    message: 'Hello world from wordle',
  });
});

http.listen(port, () => console.log(`Listening on port ${port}`));
