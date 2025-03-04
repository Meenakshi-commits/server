const mongoose = require('mongoose');

const residentSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true },
  phone: { type: String, required: true },
  checkInDate: { type: Date, default: Date.now },
});

module.exports = mongoose.model('Resident', residentSchema);