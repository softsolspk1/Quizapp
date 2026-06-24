const express = require('express');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { body, validationResult } = require('express-validator');
const prisma = require('../db');
const auth = require('../middleware/auth');

const router = express.Router();

// Register new user
router.post('/register', [
  body('doctorName').notEmpty().withMessage('Doctor name is required'),
  body('designation').notEmpty().withMessage('Designation is required'),
  body('specialty').notEmpty().withMessage('Specialty is required'),
  body('hospitalName').notEmpty().withMessage('Hospital name is required'),
  body('pmdcNumber').notEmpty().withMessage('PMDC number is required'),
  body('city').notEmpty().withMessage('City is required'),
  body('phoneNumber').notEmpty().withMessage('Phone number is required'),
  body('email').isEmail().withMessage('Valid email is required'),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { doctorName, designation, specialty, hospitalName, pmdcNumber, city, phoneNumber, email, password } = req.body;

    // Check if user already exists
    let existingUser = await prisma.user.findFirst({
      where: {
        OR: [
          { email },
          { pmdcNumber }
        ]
      }
    });

    if (existingUser) {
      return res.status(400).json({ message: 'User already exists with this email or PMDC number' });
    }

    // Hash password before saving
    const hashedPassword = await bcrypt.hash(password, 12);

    // Create new user
    const user = await prisma.user.create({
      data: {
        doctorName,
        designation,
        specialty,
        hospitalName,
        pmdcNumber,
        city,
        phoneNumber,
        email,
        password: hashedPassword,
        isApproved: false
      }
    });

    res.json({
      message: 'Registration successful. Your account is under admin approval.',
      user: {
        id: user.id,
        doctorName: user.doctorName,
        email: user.email,
        isApproved: user.isApproved,
        role: user.role
      }
    });
  } catch (error) {
    console.error(error.message);
    res.status(500).send('Server error');
  }
});

// Login user
router.post('/login', [
  body('email').isEmail().withMessage('Valid email is required'),
  body('password').exists().withMessage('Password is required')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { email, password } = req.body;

    // Check if user exists
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    // Check if user is active
    if (!user.isActive) {
      return res.status(400).json({ message: 'Account is deactivated' });
    }

    // Check if user is approved (Admins bypass this)
    if (!user.isApproved && user.role !== 'admin') {
      return res.status(400).json({ message: 'Account pending approval from admin' });
    }

    // Check password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    // Update last login
    await prisma.user.update({
      where: { id: user.id },
      data: { lastLogin: new Date() }
    });

    // Generate JWT token
    const payload = {
      user: {
        id: user.id,
        role: user.role,
        permissions: user.permissions
      }
    };

    jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '7d' }, (err, token) => {
      if (err) throw err;
      res.json({
        token,
        user: {
          id: user.id,
          doctorName: user.doctorName,
          email: user.email,
          isApproved: user.isApproved,
          role: user.role,
          permissions: user.permissions,
          totalPoints: user.totalPoints
        }
      });
    });
  } catch (error) {
    console.error(error.message);
    res.status(500).send('Server error');
  }
});

// Get current user
router.get('/me', auth, async (req, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      select: {
        id: true,
        doctorName: true,
        designation: true,
        specialty: true,
        hospitalName: true,
        pmdcNumber: true,
        city: true,
        phoneNumber: true,
        email: true,
        profilePicture: true,
        isApproved: true,
        isActive: true,
        role: true,
        permissions: true,
        totalPoints: true,
        gamesPlayed: true,
        correctAnswers: true,
        wrongAnswers: true,
        lastLogin: true,
        createdAt: true,
        updatedAt: true
      }
    });
    res.json(user);
  } catch (error) {
    console.error(error.message);
    res.status(500).send('Server error');
  }
});

module.exports = router;
