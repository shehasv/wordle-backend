const express = require('express');
const { resolve } = require('path');

const app = express();
const port = 3010;

app.use(express.static('static'));
const cors = require('cors');
app.use(cors());
const http = require('http').Server(app);

const socketIO = require('socket.io')(http, {
  cors: {
    origin: 'http://localhost:5173',
  },
});

socketIO.on('connection', (socket) => {
  console.log(`⚡: ${socket.id} user just connected!`);
  socket.on('disconnect', () => {
    console.log('🔥: A user disconnected');
  });
});

app.get('/', (req, res) => {
  res.json({
    message: 'Hello world from wordle',
  });
});

app.listen(port, () => {
  console.log(`Example app listening at http://localhost:${port}`);
});
