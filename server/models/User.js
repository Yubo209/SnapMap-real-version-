const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  username : { type: String, required: true, unique: true, trim: true },
  email:    { type: String, required: true, unique: true, lowercase: true },
  password: { type: String, required: true },
  avatarUrl: { type: String, default: '/default-avatar-icon-of-social-media-user-vector.jpg' }  
}, { timestamps: true });

module.exports = mongoose.model('User', userSchema);

