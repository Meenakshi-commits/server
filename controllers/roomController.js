const Room = require('../models/Room');
const Resident = require('../models/Resident');

exports.getRoomDetails = async (req, res) => {
  const { id } = req.params;

  try {
    const room = await Room.findById(id).populate('user');
    if (!room) {
      return res.status(404).json({ message: 'Room not found' });
    }

    // Fetch the resident details if the room is occupied
    let residentDetails = null;
    if (room.status === 'occupied' && room.user) {
      residentDetails = await Resident.findOne({ room: room._id });
    }

    res.json({ room, resident: residentDetails });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
