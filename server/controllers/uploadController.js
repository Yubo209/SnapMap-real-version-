// controllers/uploadController.js
const streamifier = require('streamifier');
const cloudinary = require('../lib/cloudinary');

/**
 * POST /api/upload/image
 * 接收 multer 处理后的 req.file（在内存中），上传到 Cloudinary，
 * 返回 { url, public_id, width, height, format, bytes }
 */
exports.uploadImage = async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'No file provided' });

    // 可选：允许客户端通过 body.folder 指定子目录，否则默认
    const folder = (req.body && req.body.folder) ? String(req.body.folder) : 'snapmap/uploads';

    const result = await new Promise((resolve, reject) => {
      const cld = cloudinary.uploader.upload_stream(
        {
          folder,
          resource_type: 'image',
          // 如需默认压缩/限制尺寸可开：transformation: [{ width: 1600, crop: 'limit', quality: 'auto' }]
        },
        (err, uploadResult) => (err ? reject(err) : resolve(uploadResult))
      );
      streamifier.createReadStream(req.file.buffer).pipe(cld);
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
    console.error('Upload image error:', e);
    // multer 的错误（大小/类型）也会走这里：
    return res.status(400).json({ error: e.message || 'Upload failed' });
  }
};
