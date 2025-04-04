const User = require('../models/User');
const Room = require('../models/Room');
const Billing = require('../models/Billing');
const Maintenance = require('../models/Maintenance');

exports.getUserReport = async (req, res) => {
  try {
    const users = await User.find();
    res.json(users);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.getRoomReport = async (req, res) => {
  try {
    const rooms = await Room.find();
    res.json(rooms);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.getBillingReport = async (req, res) => {
  try {
    const bills = await Billing.find();
    res.json(bills);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.getMaintenanceReport = async (req, res) => {
  try {
    const maintenanceRequests = await Maintenance.find();
    res.json(maintenanceRequests);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
