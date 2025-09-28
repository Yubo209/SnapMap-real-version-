// models/User.js
const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  username : { type: String, required: true, unique: true, trim: true },
  email:    { type: String, required: true, unique: true, lowercase: true },
  password: { type: String, required: true },

  // 头像：只存 Cloudinary 的 url + public_id
  avatarUrl: { type: String, default: '/default-avatar-icon-of-social-media-user-vector.jpg' },
  avatarPublicId: { type: String, default: '' }   // ✅ 新增：用于删除旧头像
}, { timestamps: true });

// 常用的唯一键索引（Mongoose 已自动，但显式也可以）
userSchema.index({ email: 1 }, { unique: true });
userSchema.index({ username: 1 }, { unique: true });

module.exports = mongoose.model('User', userSchema);
