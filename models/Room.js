const mongoose = require('mongoose');

const roomSchema = new mongoose.Schema({
  roomNumber: { type: String, required: true, unique: true },
  type: { type: String, enum: ['single', 'double', 'triple'], required: true },
  status: { type: String, enum: ['available', 'occupied', 'maintenance'], default: 'available' },
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }, // Reference to User model
  price: { type: Number, required: true },
});

module.exports = mongoose.model('Room', roomSchema);