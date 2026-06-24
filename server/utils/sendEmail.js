const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  host: 'softsols.pk',
  port: 465,
  secure: true, // true for 465, false for other ports
  auth: {
    user: 'igenius@softsols.pk',
    pass: '???Aakay@12345'
  }
});

const sendEmail = async (to, subject, text, html) => {
  try {
    const info = await transporter.sendMail({
      from: '"Hilton Quiz App" <igenius@softsols.pk>',
      to,
      subject,
      text,
      html
    });
    console.log('Message sent: %s', info.messageId);
    return true;
  } catch (error) {
    console.error('Error sending email:', error);
    return false;
  }
};

module.exports = sendEmail;
