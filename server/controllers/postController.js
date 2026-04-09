// controllers/postController.js
const Post = require('../models/Post');
const cloudinary = require('../lib/cloudinary'); 

exports.createPost = async (req, res) => {
  try {
    const {
      name,
      description,
      address,
      imageUrl,
      imagePublicId,
      lat,
      lng
    } = req.body;

    if (!name || !imageUrl || !imagePublicId) {
      return res.status(400).json({ message: 'name, imageUrl, imagePublicId are required.' });
    }

    const post = await Post.create({
      name,
      description,
      address,
      imageUrl,
      imagePublicId,
      lat,
      lng,
      user: req.user.id  
    });

    return res.status(201).json(post);
  } catch (err) {
    console.error(' createPost error:', err);
    return res.status(500).json({ message: 'Server error creating post' });
  }
};


exports.getPosts = async (_req, res) => {
  try {
    const posts = await Post.find()
      .sort({ createdAt: -1 })
      .populate('user', 'username avatarUrl');

    return res.status(200).json(posts);
  } catch (err) {
    console.error(' getPosts error:', err);
    return res.status(500).json({ message: 'Server error fetching posts' });
  }
};



exports.getPostById = async (req, res) => {
  try {
    const p = await Post.findById(req.params.id);
    if (!p) return res.status(404).json({ message: 'Post not found' });
    return res.json(p);
  } catch (err) {
    console.error(' getPostById error:', err);
    return res.status(500).json({ message: 'Server error fetching post' });
  }
};


exports.deletePost = async (req, res) => {
  try {
    const p = await Post.findById(req.params.id);
    if (!p) return res.status(404).json({ message: 'Post not found' });

    
    if (p.user.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Forbidden' });
    }

    
    if (p.imagePublicId) {
      try {
        await cloudinary.uploader.destroy(p.imagePublicId);
      } catch (e) {
        console.warn('Cloudinary destroy failed (ignored):', e.message);
      }
    }

    await p.deleteOne();
    return res.json({ ok: true });
  } catch (err) {
    console.error(' deletePost error:', err);
    return res.status(500).json({ message: 'Server error deleting post' });
  }
};
