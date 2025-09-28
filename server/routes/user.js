// routes/user.js
const express = require('express');
const router = express.Router();

const authMiddleware = require('../middleware/authMiddleware');
const {
  getMe,
  getUserPhotos,
  getUserProfile,
  updateAvatar
} = require('../controllers/userController');

// ✅ 当前登录用户信息 + posts
router.get('/me', authMiddleware, getMe);

// ✅ 公开：某用户的所有照片
router.get('/:id/photos', getUserPhotos);

// ✅ 公开：用户资料 + 作品
router.get('/:id/profile', getUserProfile);

// ✅ 更新头像（需要先 /api/upload/image）
router.put('/avatar', authMiddleware, updateAvatar);

module.exports = router;
