const Maintenance = require('../models/Maintenance');
const User = require('../models/User');
const { sendNotification } = require('../utils/notifications');

exports.createMaintenanceRequest = async (req, res) => {
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
};

exports.updateMaintenanceStatus = async (req, res) => {
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
};

exports.getMaintenanceRequests = async (req, res) => {
  try {
    const maintenanceRequests = await Maintenance.find();
    res.json(maintenanceRequests);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
