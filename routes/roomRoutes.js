const express = require('express');
const router = express.Router();
const Room = require('../models/Room');
const Resident = require('../models/Resident');
const User = require('../models/User'); // Corrected path
const { auth, restrictTo } = require('../middleware/auth');
const { sendNotification } = require('../utils/notifications');

// Allocate a room to a user (admin only)
router.post('/allocate', auth, restrictTo('admin'), async (req, res) => {
  const { userId, roomId } = req.body;
  try {
    const room = await Room.findById(roomId);
    if (!room) return res.status(404).json({ message: 'Room not found' });

    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ message: 'User not found' });

    const resident = await Resident.create({ name: user.name, email: user.email, phone: user.phone, room: roomId });
    room.user = userId;
    room.resident = resident._id;
    room.status = 'occupied';
    await room.save();

    user.role = 'resident'; // Update role to 'resident'
    await user.save();

    await sendNotification(userId, `You have been allocated Room ${room.roomNumber}`, 'room');
    const admins = await User.find({ role: 'admin' });
    for (const admin of admins) {
      await sendNotification(admin._id, `Room ${room.roomNumber} allocated to user`, 'room');
    }

    res.json({ message: 'Room allocated successfully', room });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Get all rooms (admin and users)
router.get('/', auth, async (req, res) => {
  try {
    const rooms = await Room.find().populate('user', 'name email phone');
    res.json(rooms);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Get a specific room by ID (admin and users)
router.get('/:id', auth, async (req, res) => {
  try {
    const room = await Room.findById(req.params.id).populate('user', 'name email phone');
    if (!room) {
      return res.status(404).json({ message: 'Room not found' });
    }
    res.json(room);
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

// Add route to update a specific room by ID
router.put('/:id', auth, restrictTo('admin'), async (req, res) => {
  const { roomNumber, type, price, status, user } = req.body;
  try {
    const room = await Room.findById(req.params.id);
    if (!room) {
      return res.status(404).json({ message: 'Room not found' });
    }

    room.roomNumber = roomNumber || room.roomNumber;
    room.type = type || room.type;
    room.price = price || room.price;
    room.status = status || room.status;
    room.user = user || room.user;

    const updatedRoom = await room.save();
    res.json(updatedRoom);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Add route to delete a specific room by ID
router.delete('/:id', auth, restrictTo('admin'), async (req, res) => {
  try {
    const room = await Room.findById(req.params.id);
    if (!room) {
      return res.status(404).json({ message: 'Room not found' });
    }

    await room.deleteOne();
    res.json({ message: 'Room deleted successfully' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;