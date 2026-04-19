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
      lng,
    } = req.body;

    if (!name || !imageUrl || !imagePublicId) {
      return res.status(400).json({
        message: 'name, imageUrl, imagePublicId are required.',
      });
    }

    const post = await Post.create({
      name,
      description,
      address,
      imageUrl,
      imagePublicId,
      lat,
      lng,
      user: req.user.id,
    });

    const populatedPost = await Post.findById(post._id)
      .populate('user', 'username avatarUrl')
      .populate('comments.user', 'username avatarUrl');

    return res.status(201).json(populatedPost);
  } catch (err) {
    console.error('createPost error:', err);
    return res.status(500).json({ message: 'Server error creating post' });
  }
};

exports.getPosts = async (_req, res) => {
  try {
    const posts = await Post.find()
      .sort({ createdAt: -1 })
      .populate('user', 'username avatarUrl')
      .populate('comments.user', 'username avatarUrl');

    return res.status(200).json(posts);
  } catch (err) {
    console.error('getPosts error:', err);
    return res.status(500).json({ message: 'Server error fetching posts' });
  }
};

exports.getPostById = async (req, res) => {
  try {
    const post = await Post.findById(req.params.id)
      .populate('user', 'username avatarUrl')
      .populate('comments.user', 'username avatarUrl');

    if (!post) {
      return res.status(404).json({ message: 'Post not found' });
    }

    return res.status(200).json(post);
  } catch (err) {
    console.error('getPostById error:', err);
    return res.status(500).json({ message: 'Server error fetching post' });
  }
};

exports.deletePost = async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);

    if (!post) {
      return res.status(404).json({ message: 'Post not found' });
    }

    if (post.user.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Forbidden' });
    }

    if (post.imagePublicId) {
      try {
        await cloudinary.uploader.destroy(post.imagePublicId);
      } catch (e) {
        console.warn('Cloudinary destroy failed (ignored):', e.message);
      }
    }

    await post.deleteOne();

    return res.json({ ok: true });
  } catch (err) {
    console.error('deletePost error:', err);
    return res.status(500).json({ message: 'Server error deleting post' });
  }
};

exports.toggleLike = async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);

    if (!post) {
      return res.status(404).json({ message: 'Post not found' });
    }

    const userId = req.user.id;

    const alreadyLiked = post.likes.some(
      (id) => id.toString() === userId
    );

    if (alreadyLiked) {
      post.likes = post.likes.filter(
        (id) => id.toString() !== userId
      );
    } else {
      post.likes.push(userId);
    }

    await post.save();

    const updatedPost = await Post.findById(post._id)
      .populate('user', 'username avatarUrl')
      .populate('comments.user', 'username avatarUrl');

    return res.status(200).json({
      message: alreadyLiked ? 'Post unliked' : 'Post liked',
      post: updatedPost,
    });
  } catch (err) {
    console.error('toggleLike error:', err);
    return res.status(500).json({ message: 'Server error toggling like' });
  }
};

exports.addComment = async (req, res) => {
  try {
    const { text } = req.body;

    if (!text || !text.trim()) {
      return res.status(400).json({ message: 'Comment text is required' });
    }

    const post = await Post.findById(req.params.id);

    if (!post) {
      return res.status(404).json({ message: 'Post not found' });
    }

    post.comments.push({
      user: req.user.id,
      text: text.trim(),
    });

    await post.save();

    const updatedPost = await Post.findById(post._id)
      .populate('user', 'username avatarUrl')
      .populate('comments.user', 'username avatarUrl');

    return res.status(201).json({
      message: 'Comment added',
      post: updatedPost,
    });
  } catch (err) {
    console.error('addComment error:', err);
    return res.status(500).json({ message: 'Server error adding comment' });
  }
};