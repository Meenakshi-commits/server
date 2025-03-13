const mongoose = require('mongoose');
const Room = require('./Room');

const residentSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  phone: { type: String, required: true },
  room: { type: mongoose.Schema.Types.ObjectId, ref: 'Room' },
  checkInDate: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Resident', residentSchema);