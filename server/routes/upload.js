// routes/upload.js
const express = require('express');
const router = express.Router();

const { uploadImage } = require('../middleware/upload');       // multer
const uploadController = require('../controllers/uploadController'); // 业务

// 单图上传到 Cloudinary
router.post('/image', uploadImage, uploadController.uploadImage);

module.exports = router;
