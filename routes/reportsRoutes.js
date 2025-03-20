const express = require('express');
const router = express.Router();
const { auth, restrictTo } = require('../middleware/auth');
const User = require('../models/User');
const Room = require('../models/Room');
const Billing = require('../models/Billing');
const Maintenance = require('../models/Maintenance');

// Get user report (admin only)
router.get('/users', auth, restrictTo('admin'), async (req, res) => {
  try {
    const users = await User.find();
    res.json(users);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Get room report (admin only)
router.get('/rooms', auth, restrictTo('admin'), async (req, res) => {
  try {
    const rooms = await Room.find();
    res.json(rooms);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Get billing report (admin only)
router.get('/billing', auth, restrictTo('admin'), async (req, res) => {
  try {
    const bills = await Billing.find();
    res.json(bills);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Get maintenance report (admin only)
router.get('/maintenance', auth, restrictTo('admin'), async (req, res) => {
  try {
    const maintenanceRequests = await Maintenance.find();
    res.json(maintenanceRequests);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;