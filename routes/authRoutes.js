const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Room = require('../models/Room');
const { sendNotification } = require('../utils/notifications');
const crypto = require('crypto');
const nodemailer = require('nodemailer');
const { auth, restrictTo } = require('../middleware/auth'); // Import auth and restrictTo

let testAccount;

// Create Ethereal test account
(async () => {
  testAccount = await nodemailer.createTestAccount();
})();

router.post('/signup', async (req, res) => {
  const { name, email, password, phone } = req.body;
  console.log('Phone:', phone); // Log the phone number to verify it is being passed correctly
  try {
    let user = await User.findOne({ email });
    if (user) return res.status(400).json({ message: 'User already exists' });

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    user = new User({
      email,
      password: hashedPassword,
      phone, // Add phone number
      role: 'user', // Default role is 'user'
    });
    await user.save();

    const payload = { userId: user._id, role: user.role };
    const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '1h' });

    await sendNotification(user._id, `Welcome, ${name}! Your account has been created as a ${user.role}.`, 'signup');

    res.json({ token });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.post('/login', async (req, res) => {
  const { email, password } = req.body;
  try {
    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ message: 'Invalid credentials' });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(400).json({ message: 'Invalid credentials' });

    const payload = { userId: user._id, role: user.role };
    const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '1h' });
    res.json({ token, role: user.role });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Add logout route
router.get('/logout', (req, res) => {
  // Invalidate the token or clear the session here if applicable
  res.json({ message: 'Logged out successfully' });
});

// Add route to request a password reset
router.post('/forgot-password', async (req, res) => {
  const { email } = req.body;
  try {
    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ message: 'User not found' });

    const resetToken = crypto.randomBytes(32).toString('hex');
    const resetTokenExpiry = Date.now() + 3600000; // 1 hour

    user.resetPasswordToken = resetToken;
    user.resetPasswordExpiry = resetTokenExpiry;
    await user.save();

    const resetUrl = `${process.env.FRONTEND_URL}/reset-password/${resetToken}`;

    const transporter = nodemailer.createTransport({
      host: testAccount.smtp.host,
      port: testAccount.smtp.port,
      secure: testAccount.smtp.secure,
      auth: {
        user: testAccount.user,
        pass: testAccount.pass,
      },
    });

    const mailOptions = {
      to: email,
      from: 'no-reply@yourdomain.com',
      subject: 'Password Reset Request',
      text: `You are receiving this because you (or someone else) have requested the reset of the password for your account.\n\n
             Please click on the following link, or paste this into your browser to complete the process:\n\n
             ${resetUrl}\n\n
             If you did not request this, please ignore this email and your password will remain unchanged.\n`,
    };

    const info = await transporter.sendMail(mailOptions);

    // Log the preview URL
    console.log('Preview URL: %s', nodemailer.getTestMessageUrl(info));

    res.json({ message: 'Password reset link sent to email', previewUrl: nodemailer.getTestMessageUrl(info) });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Add route to reset the password using a token
router.post('/reset-password/:token', async (req, res) => {
  const { token } = req.params;
  const { password } = req.body;
  try {
    const user = await User.findOne({
      resetPasswordToken: token,
      resetPasswordExpiry: { $gt: Date.now() },
    });
    if (!user) return res.status(400).json({ message: 'Invalid or expired token' });

    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(password, salt);
    user.resetPasswordToken = undefined;
    user.resetPasswordExpiry = undefined;
    await user.save();

    res.json({ message: 'Password reset successful' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Get all users (admin only)
router.get('/', auth, restrictTo('admin'), async (req, res) => {
  try {
    const users = await User.find();
    res.json(users);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Add endpoint to retrieve list of users along with room numbers if room is allocated
router.get('/users-with-rooms', auth, restrictTo('admin'), async (req, res) => {
  try {
    const users = await User.find().populate({
      path: 'room',
      select: 'roomNumber',
    });

    const usersWithRooms = users.map(user => ({
      name: user.name,
      email: user.email,
      phone: user.phone,
      roomNumber: user.room ? user.room.roomNumber : 'No room allocated',
    }));

    res.json(usersWithRooms);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Get a specific user by ID (admin only)
router.get('/:id', auth, restrictTo('admin'), async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    res.json(user);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Update a user by ID (admin only)
router.put('/:id', auth, restrictTo('admin'), async (req, res) => {
  const { email, password, phone, room } = req.body;
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    user.email = email || user.email;
    user.phone = phone || user.phone;
    if (password) {
      const salt = await bcrypt.genSalt(10);
      user.password = await bcrypt.hash(password, salt);
    }

    if (room && user.role !== 'resident') {
      const roomData = await Room.findById(room);
      if (!roomData) return res.status(404).json({ message: 'Room not found' });

      const resident = await Resident.create({ name: user.name, email: user.email, phone: user.phone, room });
      roomData.user = user._id;
      roomData.resident = resident._id;
      roomData.status = 'occupied';
      await roomData.save();

      user.role = 'resident'; // Update role to 'resident'
    }

    const updatedUser = await user.save();
    res.json(updatedUser);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Delete a user by ID (admin only)
router.delete('/:id', auth, restrictTo('admin'), async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    await user.deleteOne();
    res.json({ message: 'User deleted successfully' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;