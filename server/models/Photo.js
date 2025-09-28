// models/Photo.js
const mongoose = require('mongoose');

const photoSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },

  imageUrl: { type: String, required: true },
  imagePublicId: { type: String, required: true },   // ✅ 新增：Cloudinary public_id

  caption: { type: String, default: '' },
  location: { type: String, default: '' },

  coordinates: {
    lat: Number,
    lng: Number
  },

  ipAddress: String,

  createdAt: { type: Date, default: Date.now }
});

photoSchema.index({ createdAt: -1 }); // 可选：列表倒序更快
module.exports = mongoose.model('Photo', photoSchema);
