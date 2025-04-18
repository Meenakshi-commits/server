const Resident = require('../models/Resident');

exports.createResident = async (req, res) => {
  try {
    const { name, email, phone, roomId } = req.body;

    // Check if resident with email already exists
    const existingResident = await Resident.findOne({ email });
    if (existingResident) {
      return res.status(400).json({ message: 'Resident with this email already exists' });
    }

    if (!name || !phone) {
      return res.status(400).json({ message: 'Name and phone are required' });
    }

    const newResident = new Resident({
      name,
      email,
      phone,
      room: roomId,
    });

    await newResident.save();
    res.status(201).json({ message: 'Resident created successfully', resident: newResident });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getResidents = async (req, res) => {
  try {
    const residents = await Resident.find({ room: { $ne: null } }).populate('room', 'roomNumber');
    res.json(residents);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.getResidentById = async (req, res) => {
  try {
    const resident = await Resident.findById(req.params.id).populate('room', 'roomNumber');
    if (!resident) {
      return res.status(404).json({ message: 'Resident not found' });
    }

    // Check if the user is an admin or the resident themselves
    if (req.user.role !== 'admin' && req.user.resident.toString() !== req.params.id) {
      return res.status(403).json({ message: 'Access denied' });
    }

    res.json(resident);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.updateResident = async (req, res) => {
  const { name, email, phone } = req.body;

  try {
    const resident = await Resident.findById(req.params.id);

    if (!resident) {
      return res.status(404).json({ message: 'Resident not found' });
    }

    resident.name = name || resident.name;
    resident.email = email || resident.email;
    resident.phone = phone || resident.phone;

    const updatedResident = await resident.save();
    res.json(updatedResident);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.deleteResident = async (req, res) => {
  try {
    const resident = await Resident.findById(req.params.id);
    if (!resident) {
      return res.status(404).json({ message: 'Resident not found' });
    }

    await resident.deleteOne();
    res.json({ message: 'Resident deleted successfully' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
