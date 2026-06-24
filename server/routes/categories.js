const express = require('express');
const prisma = require('../db');
const auth = require('../middleware/auth');

const router = express.Router();

// Get all active categories
router.get('/', async (req, res) => {
  try {
    const categories = await prisma.category.findMany({
      where: { isActive: true },
      orderBy: { name: 'asc' },
      include: {
        _count: {
          select: { questions: true }
        }
      }
    });
    
    // Move Specialty category to the top if it exists
    const specialtyIndex = categories.findIndex(cat => cat.name === 'Specialty');
    if (specialtyIndex > 0) {
      const specialtyCategory = categories.splice(specialtyIndex, 1)[0];
      categories.unshift(specialtyCategory);
    }
    
    res.json(categories);
  } catch (error) {
    console.error(error.message);
    res.status(500).send('Server error');
  }
});

// Get all categories (admin only)
router.get('/admin', auth, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Access denied' });
    }

    const categories = await prisma.category.findMany({
      orderBy: { name: 'asc' }
    });
    res.json(categories);
  } catch (error) {
    console.error(error.message);
    res.status(500).send('Server error');
  }
});

// Create new category (admin only)
router.post('/', auth, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Access denied' });
    }

    const { name, description, isActive, imageUrl } = req.body;

    // Check if category exists
    const existingCategory = await prisma.category.findUnique({
      where: { name }
    });

    if (existingCategory) {
      return res.status(400).json({ message: 'Category already exists' });
    }

    const category = await prisma.category.create({
      data: {
        name,
        description,
        isActive: isActive !== undefined ? isActive : true,
        imageUrl
      }
    });

    res.json(category);
  } catch (error) {
    console.error(error.message);
    res.status(500).send('Server error');
  }
});

// Update category (admin only)
router.put('/:id', auth, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Access denied' });
    }

    const { name, description, isActive, imageUrl } = req.body;
    const id = parseInt(req.params.id);

    const category = await prisma.category.findUnique({ where: { id } });
    if (!category) {
      return res.status(404).json({ message: 'Category not found' });
    }

    const updatedCategory = await prisma.category.update({
      where: { id },
      data: {
        name: name || category.name,
        description: description !== undefined ? description : category.description,
        isActive: isActive !== undefined ? isActive : category.isActive,
        ...(imageUrl !== undefined && { imageUrl })
      }
    });

    res.json(updatedCategory);
  } catch (error) {
    console.error(error.message);
    res.status(500).send('Server error');
  }
});

// Delete category (admin only)
router.delete('/:id', auth, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Access denied' });
    }

    const id = parseInt(req.params.id);
    const category = await prisma.category.findUnique({ where: { id } });
    if (!category) {
      return res.status(404).json({ message: 'Category not found' });
    }

    // Check if category has questions
    const questionCount = await prisma.question.count({ where: { categoryId: id } });
    if (questionCount > 0) {
      return res.status(400).json({ message: 'Cannot delete category with existing questions' });
    }

    await prisma.category.delete({ where: { id } });
    res.json({ message: 'Category deleted successfully' });
  } catch (error) {
    console.error(error.message);
    res.status(500).send('Server error');
  }
});

// Get category statistics
router.get('/:id/stats', auth, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Access denied' });
    }

    const id = parseInt(req.params.id);
    const [totalQuestions, activeQuestions] = await Promise.all([
      prisma.question.count({ where: { categoryId: id } }),
      prisma.question.count({ where: { categoryId: id, isActive: true } })
    ]);

    res.json({
      totalQuestions,
      activeQuestions
    });
  } catch (error) {
    console.error(error.message);
    res.status(500).send('Server error');
  }
});

module.exports = router;
