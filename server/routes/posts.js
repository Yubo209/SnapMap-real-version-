// routes/posts.js
const express = require('express');
const router = express.Router();

const authMiddleware = require('../middleware/authMiddleware');
const {
  createPost,
  getPosts,
  getPostById,
  deletePost
} = require('../controllers/postController');

// 创建
router.post('/', authMiddleware, createPost);

// 列表
router.get('/', getPosts);

// 详情（可选）
router.get('/:id', getPostById);

// 删除
router.delete('/:id', authMiddleware, deletePost);

module.exports = router;
