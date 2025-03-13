const twilio = require('twilio');
const sgMail = require('@sendgrid/mail');
const Notification = require('../models/Notification');
const User = require('../models/User');
require('dotenv').config(); // Ensure .env is loaded

// Ensure API Keys are loaded
const missingEnvVars = [];
if (!process.env.SENDGRID_API_KEY) missingEnvVars.push('SENDGRID_API_KEY');
if (!process.env.TWILIO_ACCOUNT_SID) missingEnvVars.push('TWILIO_ACCOUNT_SID');
if (!process.env.TWILIO_AUTH_TOKEN) missingEnvVars.push('TWILIO_AUTH_TOKEN');

if (missingEnvVars.length > 0) {
  console.error(`❌ Missing environment variables: ${missingEnvVars.join(', ')}. Check your .env file.`);
}

sgMail.setApiKey(process.env.SENDGRID_API_KEY);
const client = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);

const sendNotification = async (userId, message, type) => {
  try {
    const user = await User.findById(userId).populate('resident');

    if (!user) {
      console.error(`❌ User with ID ${userId} not found.`);
      return;
    }

    // Save In-App Notification
    const notification = new Notification({ user: userId, message, type });
    await notification.save();

    // Send Email Notification
    if (user.email) {
      const msg = {
        to: user.email,
        from: 'no-reply@yourdomain.com',
        subject: `Hostel Update: ${type.charAt(0).toUpperCase() + type.slice(1)}`,
        text: message,
      };
      try {
        await sgMail.send(msg);
        console.log(`✅ Email sent to ${user.email}`);
      } catch (emailError) {
        console.error(`❌ Failed to send email: ${emailError.message}`);
      }
    }

    // Send SMS Notification
    if (process.env.TWILIO_PHONE_NUMBER && user.resident?.phone) {
      try {
        await client.messages.create({
          body: message,
          from: process.env.TWILIO_PHONE_NUMBER, // Ensure this line is included
          to: user.resident.phone,
        });
        console.log(`✅ SMS sent to ${user.resident.phone}`);
      } catch (smsError) {
        console.error(`❌ Failed to send SMS: ${smsError.message}`);
      }
    } else {
      console.log('❌ Twilio phone number is missing or user phone number is not available.');
    }

  } catch (err) {
    console.error(`❌ Error in sendNotification: ${err.message}`);
  }
};

module.exports = { sendNotification };
