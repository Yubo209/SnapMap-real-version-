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
  location: String,         
  coordinates: {            
    lat: Number,
    lng: Number
  },
  ipAddress: String,        
  createdAt: {
    type: Date,
    default: Date.now
  }
})
