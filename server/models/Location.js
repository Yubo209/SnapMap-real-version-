// server/models/Location.js

const mongoose = require('mongoose');

const locationSchema = new mongoose.Schema({
  // 原始地址（用户输入的）
  address: { 
    type: String, 
    required: true,
  },
  
  // 标准化地址（用于查询匹配）
  normalizedAddress: {
    type: String,
    required: true,
    lowercase: true,
    index: true  // 加索引加快查询
  },
  
  // 坐标
  lat: {
    type: Number,
    sparse: true  // 允许为 null
  },
  lng: {
    type: Number,
    sparse: true
  },
  
  // 这个位置的所有 post IDs
  posts: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Post'
    }
  ],
  
  // 这个位置有多少张照片
  photoCount: { 
    type: Number, 
    default: 0 
  },
  
  // 更新时间
  updatedAt: { 
    type: Date, 
    default: Date.now 
  }
}, { timestamps: true });

module.exports = mongoose.model('Location', locationSchema);