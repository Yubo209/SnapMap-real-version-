const mongoose = require('mongoose');

const postSchema = new mongoose.Schema({
  name: String,
  description: String,
  address: String,
  imageUrl: String,
  lat: Number,
  lng: Number,
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Post', postSchema);
