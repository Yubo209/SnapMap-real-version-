const Post = require('../models/Post');


const createPost = async (req, res) => {
  try {
    const { name, description, address, imageBase64 } = req.body;

    if (!name || !description || !address || !imageBase64) {
      return res.status(400).json({ message: 'All fields are required.' });
    }

    
    const lat = 41.8756; 
    const lng = -87.6272;

    const newPost = new Post({
      title: name,
      description,
      imageUrl: imageBase64,
      lat,
      lng
    });

    await newPost.save();
    res.status(201).json({ message: 'Post created successfully!' });

  } catch (err) {
    console.error('❌ Error creating post:', err);
    res.status(500).json({ message: 'Server error during post creation.' });
  }
};

const getAllPosts = async (req, res) => {
  try {
    const posts = await Post.find().sort({ createdAt: -1 });
    res.json(posts);
  } catch (err) {
    console.error('❌ Error fetching posts:', err);
    res.status(500).json({ message: 'Failed to fetch posts' });
  }
};

module.exports = { getAllPosts, createPost };
