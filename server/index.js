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
app.use('/api/upload', require('./routes/upload'));
app.use('/api/support', require('./routes/support'));
app.use('/api/banners', require('./routes/banners'));
app.use('/api/notifications', require('./routes/notifications'));
app.use('/api/chat', require('./routes/chat'));
app.use('/api/winners', require('./routes/winners'));
app.use('/api/competitions', require('./routes/competitions'));
app.use('/api/study-guides', require('./routes/studyGuide'));
app.use('/api/rooms', require('./routes/rooms'));

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

  // Chat events
  socket.on('join-chat', (userId) => {
    socket.join(`user_${userId}`);
    console.log(`User ${userId} joined their personal chat room`);
  });

  socket.on('send-message', async (data) => {
    try {
      const { senderId, receiverId, content } = data;
      
      let conversation = await prisma.conversation.findFirst({
        where: {
          OR: [
            { user1Id: senderId, user2Id: receiverId },
            { user1Id: receiverId, user2Id: senderId }
          ]
        }
      });

      if (!conversation) {
        conversation = await prisma.conversation.create({
          data: {
            user1Id: senderId,
            user2Id: receiverId
          }
        });
      }

      const message = await prisma.message.create({
        data: {
          conversationId: conversation.id,
          senderId,
          content
        },
        include: {
          sender: {
            select: { doctorName: true, profilePicture: true }
          }
        }
      });

      io.to(`user_${receiverId}`).emit('receive-message', message);
      io.to(`user_${senderId}`).emit('message-sent', message);
    } catch (error) {
      console.error('Socket chat error:', error);
    }
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
