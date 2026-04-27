// controllers/uploadController.js
const streamifier = require('streamifier');
const sharp = require('sharp');
const cloudinary = require('../lib/cloudinary');

exports.uploadImage = async (req, res) => {
  try {
    console.log('🔥 uploadImage called');
    console.log('req.file:', req.file ? `${req.file.originalname} (${req.file.size} bytes)` : 'UNDEFINED');

    if (!req.file) {
      console.log('❌ No file');
      return res.status(400).json({ error: 'No file provided' });
    }

    console.log('📦 Original size:', (req.file.size / 1024 / 1024).toFixed(2), 'MB');

    // 使用 sharp 压缩图片
    let imageBuffer = req.file.buffer;
    const MAX_SIZE = 10 * 1024 * 1024; // 10MB
    let quality = 95;
    
    try {
      // ✅ 循环降低质量，直到文件<10MB
      while (quality >= 70) {
        imageBuffer = await sharp(req.file.buffer)
          .resize(2000, 2000, {
            fit: 'inside',
            withoutEnlargement: true
          })
          .jpeg({ quality })
          .toBuffer();
        
        if (imageBuffer.length <= MAX_SIZE) {
          console.log(`✅ Compressed with quality ${quality}: ${(imageBuffer.length / 1024 / 1024).toFixed(2)} MB`);
          break;
        }
        
        quality -= 5; // 每次降低5个质量
      }
      
      if (imageBuffer.length > MAX_SIZE) {
        console.warn(`⚠️ File still >10MB at quality 70, using anyway: ${(imageBuffer.length / 1024 / 1024).toFixed(2)} MB`);
      }
    } catch (compressErr) {
      console.warn('⚠️ Compression failed, using original:', compressErr.message);
      // 如果压缩失败，用原始图片
    }

    console.log('📤 Starting Cloudinary upload...');

    const result = await new Promise((resolve, reject) => {
      const cld = cloudinary.uploader.upload_stream(
        {
          folder: 'snapmap/uploads',
          resource_type: 'image'
        },
        (err, uploadResult) => {
          if (err) {
            console.error('❌ Cloudinary upload error:', err.message);
            reject(err);
          } else {
            console.log('✅ Cloudinary upload success:', uploadResult.public_id);
            resolve(uploadResult);
          }
        }
      );
      
      streamifier.createReadStream(imageBuffer).pipe(cld);
    });

    console.log('✅ Upload complete:', {
      url: result.secure_url,
      public_id: result.public_id,
      width: result.width,
      height: result.height
    });

    return res.json({
      url: result.secure_url,
      public_id: result.public_id,
      width: result.width,
      height: result.height,
      format: result.format,
      bytes: result.bytes
    });
  } catch (e) {
    console.error('❌ Upload error:', e.message);
    console.error('❌ Stack:', e.stack);
    return res.status(500).json({ error: e.message || 'Upload failed' });
  }
};