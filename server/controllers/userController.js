// controllers/userController.js
const User = require('../models/User');
const Photo = require('../models/Photo');
const Post  = require('../models/Post');
const cloudinary = require('../lib/cloudinary'); 


 
exports.getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user.id)
      .select('-password')
      .populate('likedPosts')  // ← 加这行，populate 用户点赞的所有 posts
      .exec();

    if (!user) return res.status(404).json({ message: "User not found" });

    // 查询用户上传的所有 posts
    const posts = await Post.find({ user: req.user.id })
      .sort({ createdAt: -1 });

    // 返回用户信息 + 用户点赞的 posts + 用户上传的 posts
    return res.status(200).json({ 
      ...user.toObject(), 
      posts,
      likedPosts: user.likedPosts || []
    });
  } catch (err) {
    console.error('getMe error:', err);
    return res.status(500).json({ message: "Server error", error: err.message });
  }
};


exports.getUserPhotos = async (req, res) => {
  try {
    const photos = await Photo.find({ user: req.params.id }).sort({ createdAt: -1 });
    return res.status(200).json(photos);
  } catch (err) {
    console.error('getUserPhotos error:', err);
    return res.status(500).json({ message: "Error fetching user photos", error: err.message });
  }
};


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


exports.updateAvatar = async (req, res) => {
  try {
    const { avatarUrl, avatarPublicId } = req.body;
    if (!avatarUrl || !avatarPublicId) {
      return res.status(400).json({ message: 'avatarUrl and avatarPublicId are required.' });
    }

    const userId = req.user.id;

    
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