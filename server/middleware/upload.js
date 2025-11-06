// middleware/upload.js
const multer = require('multer');

const storage = multer.memoryStorage();

const imageOnly = (req, file, cb) => {
  const ok = ['image/jpeg', 'image/png', 'image/webp', 'image/jpg', 'image/gif'].includes(file.mimetype);
  if (!ok) return cb(new Error('Unsupported file type'));
  cb(null, true);
};

const uploadImage = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: imageOnly
}).single('image'); 

module.exports = { uploadImage };
