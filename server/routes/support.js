const express = require('express');
const auth = require('../middleware/auth');
const sendEmail = require('../utils/sendEmail');
const { body, validationResult } = require('express-validator');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();
const router = express.Router();

// @route   POST /api/support
// @desc    Send support request email
// @access  Private
router.post('/', [
  auth,
  body('subject').notEmpty().withMessage('Subject is required'),
  body('message').notEmpty().withMessage('Message is required')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { subject, message } = req.body;
    const { doctorName, email, phoneNumber, hospitalName, specialty } = req.user;

    const toAddresses = [
      'shoaib.khan@hiltonpharma.com',
      'muhammad.asad@hiltonpharma.com',
      'kashiffareed2023@gmail.com'
    ].join(', ');

    const emailSubject = `Support Request: ${subject}`;
    const emailText = `Support Request from Dr. ${doctorName}\n\nUser Details:\nName: Dr. ${doctorName}\nEmail: ${email}\nPhone: ${phoneNumber}\nHospital: ${hospitalName}\nSpecialty: ${specialty}\n\nMessage:\n${message}`;
    const emailHtml = `
      <div style="font-family: Arial, sans-serif; padding: 20px; color: #333;">
        <h2 style="color: #ef4444;">New Support Request</h2>
        <div style="background-color: #f3f4f6; padding: 15px; border-radius: 8px; margin-bottom: 20px;">
          <h3>User Details</h3>
          <p><strong>Name:</strong> Dr. ${doctorName}</p>
          <p><strong>Email:</strong> ${email}</p>
          <p><strong>Phone:</strong> ${phoneNumber}</p>
          <p><strong>Hospital:</strong> ${hospitalName}</p>
          <p><strong>Specialty:</strong> ${specialty}</p>
        </div>
        <div style="background-color: #f8fafc; padding: 15px; border-radius: 8px; border-left: 4px solid #ef4444;">
          <h3>Message</h3>
          <p style="white-space: pre-wrap;">${message}</p>
        </div>
      </div>
    `;

    const success = await sendEmail(toAddresses, emailSubject, emailText, emailHtml);

    if (success) {
      res.json({ message: 'Support request sent successfully' });
    } else {
      res.status(500).json({ message: 'Failed to send support request' });
    }
  } catch (error) {
    console.error('Support route error:', error.message);
    res.status(500).send('Server error');
  }
});

// @route   POST /api/support/complaint
// @desc    Send complaint from signup screen
// @access  Public
router.post('/complaint', [
  body('doctorName').notEmpty().withMessage('Doctor name is required'),
  body('city').notEmpty().withMessage('City is required'),
  body('email').isEmail().withMessage('Valid email is required'),
  body('phoneNumber').notEmpty().withMessage('Phone number is required'),
  body('complaint').notEmpty().withMessage('Complaint text is required')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { doctorName, specialty = 'N/A', hospitalName = 'N/A', city, email, phoneNumber, complaint } = req.body;

    // Save to database
    await prisma.complaint.create({
      data: {
        doctorName,
        specialty,
        hospitalName,
        city,
        email,
        phoneNumber,
        complaint
      }
    });

    const toAddresses = [
      'salman.zaffar@hiltonpharma.com',
      'muhammad.asad@hiltonpharma.com'
    ].join(', ');

    const emailSubject = `New Registration Complaint: Dr. ${doctorName}`;
    const emailText = `Complaint from Signup Form\n\nDetails:\nName: Dr. ${doctorName}\nSpecialty: ${specialty}\nHospital: ${hospitalName}\nCity: ${city}\nEmail: ${email}\nPhone: ${phoneNumber}\n\nComplaint:\n${complaint}`;
    const emailHtml = `
      <div style="font-family: Arial, sans-serif; padding: 20px; color: #333;">
        <h2 style="color: #ef4444;">New Signup Complaint</h2>
        <div style="background-color: #f3f4f6; padding: 15px; border-radius: 8px; margin-bottom: 20px;">
          <h3>Submitter Details</h3>
          <p><strong>Name:</strong> Dr. ${doctorName}</p>
          <p><strong>Specialty:</strong> ${specialty}</p>
          <p><strong>Hospital:</strong> ${hospitalName}</p>
          <p><strong>City:</strong> ${city}</p>
          <p><strong>Email:</strong> ${email}</p>
          <p><strong>Phone:</strong> ${phoneNumber}</p>
        </div>
        <div style="background-color: #f8fafc; padding: 15px; border-radius: 8px; border-left: 4px solid #ef4444;">
          <h3>Complaint Details</h3>
          <p style="white-space: pre-wrap;">${complaint}</p>
        </div>
      </div>
    `;

    const success = await sendEmail(toAddresses, emailSubject, emailText, emailHtml);

    if (success) {
      res.json({ message: 'Complaint submitted successfully' });
    } else {
      res.status(500).json({ message: 'Failed to submit complaint' });
    }
  } catch (error) {
    console.error('Complaint route error:', error.message);
    res.status(500).send('Server error');
  }
});

// @route   GET /api/support/complaints
// @desc    Get all complaints
// @access  Private (Admin only)
router.get('/complaints', auth, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Not authorized' });
    }
    
    const complaints = await prisma.complaint.findMany({
      orderBy: {
        createdAt: 'desc'
      }
    });
    res.json(complaints);
  } catch (error) {
    console.error('Get complaints error:', error.message);
    res.status(500).send('Server error');
  }
});

module.exports = router;
