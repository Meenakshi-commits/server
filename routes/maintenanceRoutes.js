const express = require('express');
const router = express.Router();
const Maintenance = require('../models/Maintenance');
const Room = require('../models/Room');
const { auth } = require('../middleware/auth');
const { sendNotification } = require('../utils/notifications');

router.post('/', auth, async (req, res) => {
  const { roomId, description, priority } = req.body;
  try {
    const maintenance = new Maintenance({ room: roomId, description, priority });
    await maintenance.save();

    const admins = await User.find({ role: 'admin' });
    await sendNotification(req.user.userId, `Maintenance request submitted: ${description}`, 'maintenance');
    for (const admin of admins) {
      await sendNotification(admin._id, `New maintenance request: ${description} (Priority: ${priority})`, 'maintenance');
    }

    res.status(201).json(maintenance);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.get('/', auth, async (req, res) => {
  try {
    let requests;
    if (req.user.role === 'resident') {
      const residentRooms = await Room.find({ resident: req.user.resident });
      requests = await Maintenance.find({ room: { $in: residentRooms.map(r => r._id) } }).populate('room', 'roomNumber');
    } else {
      requests = await Maintenance.find().populate('room', 'roomNumber');
    }
    res.json(requests);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;