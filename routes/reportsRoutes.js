const express = require('express');
const router = express.Router();
const Room = require('../models/Room');
const Billing = require('../models/Billing');
const Maintenance = require('../models/Maintenance');
const { auth, restrictTo } = require('../middleware/auth');

router.get('/', auth, restrictTo('admin'), async (req, res) => {
  try {
    const rooms = await Room.find();
    const bills = await Billing.find().populate('resident', 'name');
    const maintenance = await Maintenance.find();

    const allocationStats = {
      totalRooms: rooms.length,
      occupied: rooms.filter(r => r.status === 'occupied').length,
      available: rooms.filter(r => r.status === 'available').length,
      maintenance: rooms.filter(r => r.status === 'maintenance').length,
    };

    const paymentStats = {
      totalRevenue: bills.reduce((sum, bill) => sum + (bill.status === 'paid' ? bill.amount : 0), 0),
      unpaidAmount: bills.reduce((sum, bill) => sum + (bill.status === 'unpaid' ? bill.amount : 0), 0),
      paidBills: bills.filter(b => b.status === 'paid').length,
      unpaidBills: bills.filter(b => b.status === 'unpaid').length,
    };

    const maintenanceStats = {
      totalRequests: maintenance.length,
      pending: maintenance.filter(m => m.status === 'pending').length,
      inProgress: maintenance.filter(m => m.status === 'in-progress').length,
      completed: maintenance.filter(m => m.status === 'completed').length,
    };

    res.json({ allocationStats, paymentStats, maintenanceStats });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;