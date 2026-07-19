const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const auth = require('../middleware/auth');

// Add a news item (Admin or sub-admin with news/users permission)
router.post('/', auth, async (req, res) => {
  try {
    if (req.user.role !== 'admin' && !(req.user.role === 'subadmin' && (req.user.permissions?.includes('news') || req.user.permissions?.includes('users')))) {
      return res.status(403).json({ message: 'Access denied' });
    }

    const { title, content } = req.body;
    if (!title || !content) {
      return res.status(400).json({ message: 'Title and content are required' });
    }

    const news = await prisma.news.create({
      data: {
        title: title.trim(),
        content: content.trim(),
        isActive: true
      }
    });

    res.json({ message: 'News added successfully', news });
  } catch (error) {
    console.error(error.message);
    res.status(500).send('Server error');
  }
});

// Get active news items for App (auth required)
router.get('/', auth, async (req, res) => {
  try {
    const newsList = await prisma.news.findMany({
      where: { isActive: true },
      orderBy: { createdAt: 'desc' }
    });
    res.json(newsList);
  } catch (error) {
    console.error(error.message);
    res.status(500).send('Server error');
  }
});

// Admin/Subadmin: Get all news (recent first)
router.get('/admin', auth, async (req, res) => {
  try {
    if (req.user.role !== 'admin' && !(req.user.role === 'subadmin' && (req.user.permissions?.includes('news') || req.user.permissions?.includes('users')))) {
      return res.status(403).json({ message: 'Access denied' });
    }

    const newsList = await prisma.news.findMany({
      orderBy: { createdAt: 'desc' }
    });

    res.json(newsList);
  } catch (error) {
    console.error(error.message);
    res.status(500).send('Server error');
  }
});

// Admin/Subadmin: Update news (e.g. toggle active/inactive or edit title/content)
router.put('/:id', auth, async (req, res) => {
  try {
    if (req.user.role !== 'admin' && !(req.user.role === 'subadmin' && (req.user.permissions?.includes('news') || req.user.permissions?.includes('users')))) {
      return res.status(403).json({ message: 'Access denied' });
    }

    const id = parseInt(req.params.id);
    const { title, content, isActive } = req.body;

    const newsItem = await prisma.news.findUnique({ where: { id } });
    if (!newsItem) {
      return res.status(404).json({ message: 'News item not found' });
    }

    const updatedNews = await prisma.news.update({
      where: { id },
      data: {
        title: title !== undefined ? title.trim() : newsItem.title,
        content: content !== undefined ? content.trim() : newsItem.content,
        isActive: isActive !== undefined ? isActive : newsItem.isActive
      }
    });

    res.json({ message: 'News updated successfully', news: updatedNews });
  } catch (error) {
    console.error(error.message);
    res.status(500).send('Server error');
  }
});

// Admin/Subadmin: Delete news item
router.delete('/:id', auth, async (req, res) => {
  try {
    if (req.user.role !== 'admin' && !(req.user.role === 'subadmin' && (req.user.permissions?.includes('news') || req.user.permissions?.includes('users')))) {
      return res.status(403).json({ message: 'Access denied' });
    }

    const id = parseInt(req.params.id);

    const newsItem = await prisma.news.findUnique({ where: { id } });
    if (!newsItem) {
      return res.status(404).json({ message: 'News item not found' });
    }

    await prisma.news.delete({ where: { id } });

    res.json({ message: 'News item deleted successfully' });
  } catch (error) {
    console.error(error.message);
    res.status(500).send('Server error');
  }
});

module.exports = router;
