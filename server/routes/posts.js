
const express = require('express');
const router = express.Router();

const authMiddleware = require('../middleware/authMiddleware');
const {
  createPost,
  getPosts,
  getPostById,
  deletePost
} = require('../controllers/postController');


router.post('/', authMiddleware, createPost);


router.get('/', getPosts);


router.get('/:id', getPostById);


router.delete('/:id', authMiddleware, deletePost);

module.exports = router;
