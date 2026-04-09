// controllers/uploadController.js
const streamifier = require('streamifier');
const cloudinary = require('../lib/cloudinary');


exports.uploadImage = async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'No file provided' });

    
    const folder = (req.body && req.body.folder) ? String(req.body.folder) : 'snapmap/uploads';

    const result = await new Promise((resolve, reject) => {
      const cld = cloudinary.uploader.upload_stream(
        {
          folder,
          resource_type: 'image',
          
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
    
    return res.status(400).json({ error: e.message || 'Upload failed' });
  }
};
