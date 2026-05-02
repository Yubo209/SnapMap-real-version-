
const express = require('express');
const router = express.Router();

const authMiddleware = require('../middleware/authMiddleware');
const {
  getMe,
  getUserPhotos,
  getUserProfile,
  updateAvatar,
  searchUsers

} = require('../controllers/userController');


router.get('/me', authMiddleware, getMe);


router.get('/:id/photos', getUserPhotos);


router.get('/:id/profile', getUserProfile);


router.put('/avatar', authMiddleware, updateAvatar);


router.get('/search', searchUsers);

module.exports = router;
