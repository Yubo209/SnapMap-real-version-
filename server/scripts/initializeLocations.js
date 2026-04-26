// server/scripts/initializeLocations.js
// 
// 使用方法：
// node server/scripts/initializeLocations.js
//
// 功能：
// - 扫描所有 posts
// - 按地址分组
// - 创建 Location 文档
// - 建立 Post ↔ Location 关系

const mongoose = require('mongoose');
const dotenv = require('dotenv');
const Post = require('../models/Post');
const Location = require('../models/Location');
const { normalizeAddressString, getDistanceBetweenCoords } = require('../utils/addressNormalizer');

const MONGO_URI = "mongodb+srv://duyubo9:JFaxzoBW7fhL7Njn@cluster1.5ox4ltp.mongodb.net/snapmap?retryWrites=true&w=majority";

async function initializeLocations() {
  try {
    console.log('🚀 连接数据库...');
    await mongoose.connect(MONGO_URI);
    console.log('✅ 数据库连接成功');

    // 1. 查询所有 posts
    console.log('\n📍 扫描所有posts...');
    const allPosts = await Post.find();
    console.log(`找到 ${allPosts.length} 个posts`);

    if (allPosts.length === 0) {
      console.log('没有posts，跳过初始化');
      process.exit(0);
    }

    // 2. 按地址分组
    console.log('\n🔄 按地址分组...');
    const groupsByAddress = new Map();

    for (const post of allPosts) {
      if (!post.address) {
        console.log(`⚠️ 跳过：post ${post._id} 没有地址`);
        continue;
      }

      const normalized = normalizeAddressString(post.address);
      
      if (!groupsByAddress.has(normalized)) {
        groupsByAddress.set(normalized, []);
      }
      groupsByAddress.get(normalized).push(post);
    }

    console.log(`分组完成：${groupsByAddress.size} 个地址`);

    // 3. 创建 Locations
    console.log('\n💾 创建Locations...');
    let created = 0;
    let updated = 0;

    for (const [normalizedAddress, posts] of groupsByAddress) {
      // 获取该组的第一个post作为代表
      const firstPost = posts[0];
      const address = firstPost.address;
      const lat = firstPost.lat;
      const lng = firstPost.lng;

      // 检查是否已存在
      const existing = await Location.findOne({ normalizedAddress });

      if (existing) {
        // 更新：确保所有posts都在posts数组中
        existing.posts = posts.map(p => p._id);
        existing.photoCount = posts.length;
        await existing.save();
        updated++;
        console.log(`✏️ 更新：${address} (${posts.length} posts)`);
      } else {
        // 创建新的
        await Location.create({
          address,
          normalizedAddress,
          lat,
          lng,
          posts: posts.map(p => p._id),
          photoCount: posts.length
        });
        created++;
        console.log(`✨ 新建：${address} (${posts.length} posts)`);
      }
    }

    console.log(`\n✅ 初始化完成：新建${created}个，更新${updated}个`);

    // 4. 验证
    console.log('\n🔍 验证数据...');
    const locations = await Location.find();
    console.log(`总共有 ${locations.length} 个locations`);

    let totalPosts = 0;
    for (const location of locations) {
      totalPosts += location.posts.length;
      console.log(`  📍 ${location.address}: ${location.posts.length} posts`);
    }
    console.log(`所有locations共有 ${totalPosts} 个posts引用`);

    if (totalPosts === allPosts.length) {
      console.log('✅ 数据一致性检查通过！');
    } else {
      console.log(`⚠️ 警告：posts数量不一致（${totalPosts} vs ${allPosts.length}）`);
    }

    process.exit(0);
  } catch (err) {
    console.error('❌ 错误:', err.message);
    process.exit(1);
  }
}

initializeLocations();