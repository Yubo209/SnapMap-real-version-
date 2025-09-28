// routes/photo.js
const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/authMiddleware');
const Photo = require('../models/Photo');
const cloudinary = require('../lib/cloudinary'); // ✅ 新增

// 上传作品（需要登录）
router.post('/', authMiddleware, async (req, res) => {
  const { imageUrl, imagePublicId, caption, location, coordinates } = req.body; // 🔄 修改：接收 imagePublicId

  if (!imageUrl || !imagePublicId) { // 🔄 修改：必填校验
    return res.status(400).json({ message: "imageUrl and imagePublicId are required" });
  }

  try {
    const newPhoto = await Photo.create({
      user: req.user.id,
      imageUrl,
      imagePublicId, // ✅ 新增：写入
      caption,
      location,
      coordinates,
      ipAddress: req.ip
    });

    res.status(201).json(newPhoto);
  } catch (err) {
    res.status(500).json({ message: "Error uploading photo", error: err.message });
  }
});
router.get('/', async (_req, res) => {
  try {
    const photos = await Photo.find().sort({ createdAt: -1 });
    res.json(photos);
  } catch (e) {
    res.status(500).json({ message: 'Error fetching photos' });
  }
});
// 删除一张作品（需要登录 + 是本人上传）
router.delete('/:id', authMiddleware, async (req, res) => {
  try {
    const photo = await Photo.findById(req.params.id);

    if (!photo) {
      return res.status(404).json({ message: "Photo not found" });
    }

    if (photo.user.toString() !== req.user.id) {
      return res.status(403).json({ message: "You are not allowed to delete this photo" });
    }

    // ✅ 先删云端
    if (photo.imagePublicId) {
      try {
        await cloudinary.uploader.destroy(photo.imagePublicId);
      } catch (e) {
        console.warn('Cloudinary destroy failed (ignored):', e.message);
      }
    }

    await photo.deleteOne();
    res.status(200).json({ message: "Photo deleted successfully" });
  } catch (err) {
    res.status(500).json({ message: "Error deleting photo", error: err.message });
  }
});

module.exports = router;
