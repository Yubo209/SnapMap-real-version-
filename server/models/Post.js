const mongoose = require('mongoose');

const postSchema = new mongoose.Schema({
 
  name: { type: String, required: true },         
  description: { type: String, default: '' , required: true },
  address: { type: String, default: '', required: true  },

  // 图片相关：只存 Cloudinary 返回的信息
  imageUrl: { type: String, required: true },     
  imagePublicId: { type: String, required: true },// ✅ 新增：Cloudinary public_id，便于删除

  // 地理信息
  lat: { type: Number },
  lng: { type: Number },

  // 时间
  createdAt: { type: Date, default: Date.now },

  // 作者
  user: {                                         // 原本就有
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  }
});

// ✅ 可选：按时间倒序常用的话，加个索引提升查询性能
postSchema.index({ createdAt: -1 });

module.exports = mongoose.model('Post', postSchema);
