

const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/authMiddleware');
const Photo = require('../models/Photo');

// 上传作品（需要登录）
router.post('/', authMiddleware, async (req, res) => {
  const { imageUrl, caption, location, coordinates } = req.body;

  if (!imageUrl) {
    return res.status(400).json({ message: "Image URL is required" });
  }

  try {
    const newPhoto = await Photo.create({
      user: req.user.id,
      imageUrl,
      caption,
      location,
      coordinates,                     // { lat: ..., lng: ... }
      ipAddress: req.ip               // 自动记录发请求者 IP
    });

    res.status(201).json(newPhoto);
  } catch (err) {
    res.status(500).json({ message: "Error uploading photo", error: err.message });
  }
});


// 删除一张作品（需要登录 + 是本人上传）
router.delete('/:id', authMiddleware, async (req, res) => {
    try {
      const photo = await Photo.findById(req.params.id);
  
      if (!photo) {
        return res.status(404).json({ message: "Photo not found" });
      }
  
      // 判断是不是本人上传的
      if (photo.user.toString() !== req.user.id) {
        return res.status(403).json({ message: "You are not allowed to delete this photo" });
      }
  
      await photo.deleteOne();
  
      res.status(200).json({ message: "Photo deleted successfully" });
    } catch (err) {
      res.status(500).json({ message: "Error deleting photo", error: err.message });
    }
  });
  
module.exports = router;
