const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/authMiddleware');
const User = require('../models/User');
const Photo = require('../models/Photo');

// ✅ 获取当前登录用户的信息（需要登录）
router.get('/me', authMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-password'); // 不返回密码
    if (!user) return res.status(404).json({ message: "User not found" });
    res.status(200).json(user);
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
});

// ✅ 获取某个用户上传的所有照片（公开访问）
router.get('/:id/photos', async (req, res) => {
  try {
    const photos = await Photo.find({ user: req.params.id }).sort({ createdAt: -1 });
    res.status(200).json(photos);
  } catch (err) {
    res.status(500).json({ message: "Error fetching user photos", error: err.message });
  }
});
// 获取用户信息 + 作品
router.get('/:id/profile', async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select('-password');
    if (!user) return res.status(404).json({ message: "User not found" });

    const photos = await Photo.find({ user: req.params.id }).sort({ createdAt: -1 });

    res.status(200).json({
      user,
      photos
    });
  } catch (err) {
    res.status(500).json({ message: "Error fetching profile" });
  }
});

module.exports = router;
