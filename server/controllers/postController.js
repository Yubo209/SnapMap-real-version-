// server/controllers/postController.js

const Post = require('../models/Post');
const Location = require('../models/Location');
const cloudinary = require('../lib/cloudinary');
const { normalizeAddressString, getDistanceBetweenCoords } = require('../utils/addressNormalizer');

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

    // 1️⃣ 创建 post（永远创建新的）
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

    // 2️⃣ 处理 Location（地址去重）
    if (address) {
      const normalizedAddress = normalizeAddressString(address);
      let location = null;

      // 策略1️⃣：先用标准化地址精确匹配（优先）
      location = await Location.findOne({ normalizedAddress });

      // 策略2️⃣：如果地址没匹配，才用坐标（距离 50m 以内）
      if (!location && lat && lng) {
        const nearbyLocations = await Location.find({
          lat: { $exists: true },
          lng: { $exists: true }
        });

        for (const loc of nearbyLocations) {
          const distance = getDistanceBetweenCoords(lat, lng, loc.lat, loc.lng);
          
          // 50 米以内视为同一位置
          if (distance < 0.05) {
            location = loc;
            console.log(`✅ 坐标匹配：${location.address}，距离 ${(distance * 1000).toFixed(0)}m`);
            break;
          }
        }
      }

      // 创建或更新 Location
      if (!location) {
        // 创建新的 Location（这个post是第一个，作为代表）
        location = await Location.create({
          address,
          normalizedAddress,
          lat,
          lng,
          posts: [post._id],
          photoCount: 1
        });
        console.log(`✅ 创建新位置：${address}（第1张照片）`);
      } else {
        // 🆕 新逻辑：分配到现有Location时
        // - 使用 Location.posts[0] 作为这个位置的代表
        // - 新post直接加入posts数组
        if (!location.posts.includes(post._id)) {
          location.posts.push(post._id);
        }
        location.photoCount = location.posts.length;
        location.updatedAt = new Date();
        await location.save();
        console.log(`✅ 加入现有位置：${location.address}（共${location.posts.length}张照片，代表图：posts[0]）`);
      }
    }

    // 3️⃣ 返回 post
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

    // 删除 cloudinary 图片
    if (post.imagePublicId) {
      try {
        await cloudinary.uploader.destroy(post.imagePublicId);
      } catch (e) {
        console.warn('Cloudinary destroy failed (ignored):', e.message);
      }
    }

    // 删除post前，从Location中移除这个postId
    if (post.address) {
      const normalizedAddress = normalizeAddressString(post.address);
      const location = await Location.findOne({ normalizedAddress });
      
      if (location) {
        location.posts = location.posts.filter(id => id.toString() !== post._id.toString());
        location.photoCount = location.posts.length;
        
        if (location.posts.length === 0) {
          // 如果这个位置没有posts了，直接删除Location
          await Location.findByIdAndDelete(location._id);
          console.log(`✅ 删除空位置：${location.address}`);
        } else {
          await location.save();
          console.log(`✅ 更新位置：${location.address}（剩余${location.posts.length}张照片，新代表：posts[0]）`);
        }
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

    // ✅ 同时更新user的likedPosts
    const User = require('../models/User');
    const user = await User.findById(userId);
    if (user) {
      if (alreadyLiked) {
        // 取消赞时，从likedPosts移除
        user.likedPosts = user.likedPosts.filter(id => id.toString() !== post._id.toString());
      } else {
        // 点赞时，加到likedPosts
        if (!user.likedPosts.includes(post._id)) {
          user.likedPosts.push(post._id);
        }
      }
      await user.save();
    }

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