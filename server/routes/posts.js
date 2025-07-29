// routes/posts.js
const express = require('express');
const router = express.Router();
const { createPost, getAllPosts } = require('../controllers/postController');

router.post('/', createPost);  
router.get('/', getAllPosts);

module.exports = router;
