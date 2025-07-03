const mongoose = require('mongoose');

const photoSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  imageUrl: {
    type: String,
    required: true
  },
  caption: String,
  location: String,         // 文本地址，比如“北京三里屯”
  coordinates: {            // 经纬度坐标
    lat: Number,
    lng: Number
  },
  ipAddress: String,        // 可选，上传者的 IP（非必须）
  createdAt: {
    type: Date,
    default: Date.now
  }
})
