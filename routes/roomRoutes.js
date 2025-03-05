const express = require('express');
const router = express.Router();
const Room = require('../models/Room');
const { auth, restrictTo } = require('../middleware/auth');
const { sendNotification } = require('../utils/notifications');

router.get('/', auth, async (req, res) => {
  try {
    const rooms = await Room.find().populate('resident', 'name');
    res.json(rooms);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.post('/', auth, restrictTo('admin'), async (req, res) => {
  const { roomNumber, type, price } = req.body;
  try {
    const room = new Room({ roomNumber, type, price, status: 'available' });
    await room.save();
    res.status(201).json(room);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.put('/allocate/:id', auth, restrictTo('admin'), async (req, res) => {
  const { residentId } = req.body;
  try {
    const room = await Room.findById(req.params.id);
    if (!room || room.status !== 'available') return res.status(400).json({ message: 'Room not available' });
    room.resident = residentId;
    room.status = 'occupied';
    await room.save();

    await sendNotification(residentId, `You have been allocated Room ${room.roomNumber}`, 'room');
    const admins = await User.find({ role: 'admin' });
    for (const admin of admins) {
      await sendNotification(admin._id, `Room ${room.roomNumber} allocated to resident`, 'room');
    }

    res.json(room);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;