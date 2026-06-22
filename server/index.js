const express = require('express');
const cors = require('cors');
const http = require('http');
const socketIo = require('socket.io');
require('dotenv').config();

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static('uploads'));

// Root route to verify API is running
app.get('/', (req, res) => {
  res.send('Hilton Quiz App API is running on Vercel!');
});

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/users', require('./routes/users'));
app.use('/api/categories', require('./routes/categories'));
app.use('/api/questions', require('./routes/questions'));
app.use('/api/quiz', require('./routes/quiz'));
app.use('/api/analytics', require('./routes/analytics'));
app.use('/api/pins', require('./routes/pins'));

// Socket.io for real-time multiplayer
io.on('connection', (socket) => {
  console.log('User connected:', socket.id);
  
  socket.on('join-room', (roomId) => {
    socket.join(roomId);
    console.log(`User ${socket.id} joined room ${roomId}`);
  });
  
  socket.on('leave-room', (roomId) => {
    socket.leave(roomId);
    console.log(`User ${socket.id} left room ${roomId}`);
  });
  
  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);
  });
});

// Make io accessible to routes
app.set('io', io);

// Connect to DB via Prisma
const prisma = require('./db');
prisma.$connect()
  .then(() => console.log('Connected to PostgreSQL via Prisma'))
  .catch(err => console.error('Database connection error:', err));

const PORT = process.env.PORT || 5000;

// Only start the server if this file is run directly (not imported by Vercel)
if (require.main === module) {
  server.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
}

// Export the app for Vercel Serverless Functions
module.exports = app;
