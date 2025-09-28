// controllers/userController.js
const User = require('../models/User');
const Photo = require('../models/Photo');
const Post  = require('../models/Post');
const cloudinary = require('../lib/cloudinary'); // 用于删旧头像

/**
 * GET /api/users/me
 * 需要登录：返回当前用户信息（去掉密码）+ 该用户的 posts
 */
exports.getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-password');
    if (!user) return res.status(404).json({ message: "User not found" });

    const posts = await Post.find({ user: req.user.id }).sort({ createdAt: -1 });

    return res.status(200).json({ ...user.toObject(), posts });
  } catch (err) {
    console.error('getMe error:', err);
    return res.status(500).json({ message: "Server error", error: err.message });
  }
};

/**
 * GET /api/users/:id/photos
 * 公开：获取某用户的所有照片
 */
exports.getUserPhotos = async (req, res) => {
  try {
    const photos = await Photo.find({ user: req.params.id }).sort({ createdAt: -1 });
    return res.status(200).json(photos);
  } catch (err) {
    console.error('getUserPhotos error:', err);
    return res.status(500).json({ message: "Error fetching user photos", error: err.message });
  }
};

/**
 * GET /api/users/:id/profile
 * 公开：获取用户资料 + 作品（photos）
 */
exports.getUserProfile = async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select('-password');
    if (!user) return res.status(404).json({ message: "User not found" });

    const photos = await Photo.find({ user: req.params.id }).sort({ createdAt: -1 });

    return res.status(200).json({ user, photos });
  } catch (err) {
    console.error('getUserProfile error:', err);
    return res.status(500).json({ message: "Error fetching profile" });
  }
};

/**
 * PUT /api/users/avatar
 * 需要登录：更新头像
 * 约定：前端已先 /api/upload/image 拿到 { url, public_id }，再把它们传到这里
 * body: { avatarUrl, avatarPublicId }
 */
exports.updateAvatar = async (req, res) => {
  try {
    const { avatarUrl, avatarPublicId } = req.body;
    if (!avatarUrl || !avatarPublicId) {
      return res.status(400).json({ message: 'avatarUrl and avatarPublicId are required.' });
    }

    const userId = req.user.id;

    // 找旧头像的 publicId，先删旧图（失败忽略）
    const prev = await User.findById(userId).select('avatarPublicId');
    if (prev?.avatarPublicId) {
      try {
        await cloudinary.uploader.destroy(prev.avatarPublicId);
      } catch (e) {
        console.warn('Cloudinary destroy old avatar failed (ignored):', e.message);
      }
    }

    const updatedUser = await User.findByIdAndUpdate(
      userId,
      { avatarUrl, avatarPublicId },
      { new: true }
    ).select('-password');

    return res.json({
      message: 'Avatar updated successfully.',
      avatarUrl: updatedUser.avatarUrl,
      avatarPublicId: updatedUser.avatarPublicId
    });
  } catch (err) {
    console.error('updateAvatar error:', err);
    return res.status(500).json({ message: 'Server error updating avatar' });
  }
};
