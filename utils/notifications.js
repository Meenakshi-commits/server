const twilio = require('twilio');
const sgMail = require('@sendgrid/mail');
const Notification = require('../models/Notification');
const User = require('../models/User');

sgMail.setApiKey(process.env.SENDGRID_API_KEY);
const client = twilio(process.env.TWILIO_SID, process.env.TWILIO_AUTH_TOKEN);

const sendNotification = async (userId, message, type) => {
  const user = await User.findById(userId).populate('resident');

  // In-App Notification
  const notification = new Notification({ user: userId, message, type });
  await notification.save();

  // Email Notification
  if (user.email) {
    const msg = {
      to: user.email,
      from: 'no-reply@hostelmanagement.com',
      subject: `Hostel Update: ${type.charAt(0).toUpperCase() + type.slice(1)}`,
      text: message,
    };
    await sgMail.send(msg);
  }

  // SMS Notification
  if (user.resident?.phone) {
    await client.messages.create({
      body: message,
      from: process.env.TWILIO_PHONE,
      to: user.resident.phone,
    });
  }
};

module.exports = { sendNotification };