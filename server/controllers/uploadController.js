// controllers/uploadController.js
const streamifier = require('streamifier');
const cloudinary = require('../lib/cloudinary');


exports.uploadImage = async (req, res) => {
  try {
    console.log('📸 Upload request received');
    console.log('req.file:', req.file ? `${req.file.originalname} (${req.file.size} bytes)` : 'UNDEFINED');
    console.log('req.body:', req.body);
    console.log('Cloudinary config:', {
      cloud_name: process.env.CLOUDINARY_CLOUD_NAME ? '✅' : '❌',
      api_key: process.env.CLOUDINARY_API_KEY ? '✅' : '❌',
      api_secret: process.env.CLOUDINARY_API_SECRET ? '✅' : '❌'
    });

    if (!req.file) {
      console.error('❌ No file received!');
      return res.status(400).json({ error: 'No file provided' });
    }

    const folder = (req.body && req.body.folder) ? String(req.body.folder) : 'snapmap/uploads';

    const result = await new Promise((resolve, reject) => {
      const cld = cloudinary.uploader.upload_stream(
        { folder, resource_type: 'image' },
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
      streamifier.createReadStream(req.file.buffer).pipe(cld);
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