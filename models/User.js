const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  phone: { type: String, required: true },
  role: { type: String, enum: ['admin', 'user', 'resident'], default: 'user' }, // Add 'user' role
  resetPasswordToken: String,
  resetPasswordExpiry: Date,
});

module.exports = mongoose.model('User', userSchema);