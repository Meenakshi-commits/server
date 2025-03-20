const express = require('express');
const router = express.Router();
const Maintenance = require('../models/Maintenance');
const { auth, restrictTo } = require('../middleware/auth');
const { sendNotification } = require('../utils/notifications');

// Create a new maintenance request (admin only)
router.post('/', auth, restrictTo('admin'), async (req, res) => {
  const { description } = req.body;

  try {
    const maintenance = new Maintenance({ description });
    await maintenance.save();

    // Notify all residents about the new maintenance request
    const residents = await User.find({ role: 'resident' });
    for (const resident of residents) {
      await sendNotification(resident._id, `New maintenance request: ${description}`, 'maintenance');
    }

    res.status(201).json(maintenance);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Update maintenance status (admin only)
router.put('/:id', auth, restrictTo('admin'), async (req, res) => {
  const { status } = req.body;

  try {
    const maintenance = await Maintenance.findById(req.params.id);
    if (!maintenance) return res.status(404).json({ message: 'Maintenance request not found' });

    maintenance.status = status || maintenance.status;
    maintenance.updatedAt = Date.now();
    await maintenance.save();

    res.json(maintenance);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Get all maintenance requests (admin and residents)
router.get('/', auth, async (req, res) => {
  try {
    const maintenanceRequests = await Maintenance.find();
    res.json(maintenanceRequests);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;