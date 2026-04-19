const mongoose = require('mongoose');

const commentSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    text: {
      type: String,
      required: true,
      trim: true,
      maxlength: 500,
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },
  },
  { _id: true }
);

const postSchema = new mongoose.Schema({
  name: { type: String, required: true },
  description: { type: String, default: '', required: true },
  address: { type: String, default: '', required: true },

  imageUrl: { type: String, required: true },
  imagePublicId: { type: String, required: true },

  lat: { type: Number },
  lng: { type: Number },

  createdAt: { type: Date, default: Date.now },

  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },

  likes: {
    type: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
      },
    ],
    default: [],
  },

  comments: {
    type: [commentSchema],
    default: [],
  },
});

postSchema.index({ createdAt: -1 });

module.exports = mongoose.model('Post', postSchema);