const express = require('express');
const prisma = require('../db');
const auth = require('../middleware/auth');

const router = express.Router();

// @route   GET /api/chat/conversations
// @desc    Get all conversations for the logged in user
// @access  Private
router.get('/conversations', auth, async (req, res) => {
  try {
    const userId = req.user.id;

    const conversations = await prisma.conversation.findMany({
      where: {
        OR: [
          { user1Id: userId },
          { user2Id: userId }
        ]
      },
      include: {
        user1: {
          select: { id: true, doctorName: true, profilePicture: true, specialty: true }
        },
        user2: {
          select: { id: true, doctorName: true, profilePicture: true, specialty: true }
        },
        messages: {
          orderBy: { createdAt: 'desc' },
          take: 1
        }
      },
      orderBy: { updatedAt: 'desc' }
    });

    res.json(conversations);
  } catch (error) {
    console.error(error.message);
    res.status(500).send('Server error');
  }
});

// @route   GET /api/chat/:userId
// @desc    Get messages with a specific user
// @access  Private
router.get('/:userId', auth, async (req, res) => {
  try {
    const myId = req.user.id;
    const otherId = parseInt(req.params.userId);

    const conversation = await prisma.conversation.findFirst({
      where: {
        OR: [
          { user1Id: myId, user2Id: otherId },
          { user1Id: otherId, user2Id: myId }
        ]
      },
      include: {
        messages: {
          orderBy: { createdAt: 'asc' },
          include: {
            sender: {
              select: { doctorName: true, profilePicture: true }
            }
          }
        }
      }
    });

    if (!conversation) {
      return res.json([]);
    }

    // Mark messages as read
    await prisma.message.updateMany({
      where: {
        conversationId: conversation.id,
        senderId: otherId,
        isRead: false
      },
      data: { isRead: true }
    });

    res.json(conversation.messages);
  } catch (error) {
    console.error(error.message);
    res.status(500).send('Server error');
  }
});

// @route   GET /api/chat/users/search
// @desc    Search users to start a chat with
// @access  Private
router.get('/users/search', auth, async (req, res) => {
  try {
    const { q } = req.query;
    if (!q) return res.json([]);

    const users = await prisma.user.findMany({
      where: {
        id: { not: req.user.id },
        isActive: true,
        isApproved: true,
        OR: [
          { doctorName: { contains: q, mode: 'insensitive' } },
          { specialty: { contains: q, mode: 'insensitive' } }
        ]
      },
      select: {
        id: true,
        doctorName: true,
        specialty: true,
        profilePicture: true
      },
      take: 20
    });

    res.json(users);
  } catch (error) {
    console.error(error.message);
    res.status(500).send('Server error');
  }
});

module.exports = router;
