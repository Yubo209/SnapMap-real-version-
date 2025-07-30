const Post = require('../models/Post');

const createPost = async (req, res) => {
  try {
    const { name, description, address, imageUrl, lat, lng } = req.body;

    
    if (!name || !description || !address || !imageUrl || lat == null || lng == null) {
      return res.status(400).json({ message: 'All fields are required.' });
    }

    
    const newPost = new Post({
      title: name,
      description,
      address,
      imageUrl,  
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
