// models/User.js
const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  username : { type: String, required: true, unique: true, trim: true },
  email:    { type: String, required: true, unique: true, lowercase: true },
  password: { type: String, required: true },


  avatarUrl: { type: String, default: '/default-avatar-icon-of-social-media-user-vector.jpg' },
  avatarPublicId: { type: String, default: '' }   
}, { timestamps: true });


userSchema.index({ email: 1 }, { unique: true });
userSchema.index({ username: 1 }, { unique: true });

module.exports = mongoose.model('User', userSchema);
