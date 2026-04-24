
const express = require('express');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const cors = require('cors');




dotenv.config();

console.log('🚀 Server starting...');
console.log('Node version:', process.version);
console.log('Environment:', process.env.NODE_ENV);
console.log('CLOUDINARY_CLOUD_NAME:', process.env.CLOUDINARY_CLOUD_NAME ? '✅' : '❌');
console.log('MONGO_URI:', process.env.MONGO_URI ? '✅' : '❌');

const app = express();


const allowList = (process.env.CORS_ORIGINS || '')
  .split(',')
  .map(s => s.trim())
  .filter(Boolean);

app.use(cors({
  origin: (origin, cb) => {
    
    if (!origin) return cb(null, true);
    return allowList.includes(origin) ? cb(null, true) : cb(new Error('Not allowed by CORS'));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE']
}));

app.use(express.json({ limit: '30mb' }));
app.use(express.urlencoded({ extended: true, limit: '30mb' }));


app.get('/healthz', (req, res) => res.status(200).send('ok'));


const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/user');
const photoRoutes = require('./routes/photo');
const postRoutes = require('./routes/posts');
const uploadRoutes = require('./routes/upload');

app.use('/api/upload', uploadRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/photos', photoRoutes);
app.use('/api/posts', postRoutes);


mongoose.connect(process.env.MONGO_URI)
  .then(() => {
    console.log('✅ Connected to MongoDB');
    const PORT = process.env.PORT || 5174;      
    app.listen(PORT, () => {
      console.log(`🚀 Server running on port ${PORT}`);
    });
  })
  .catch(err => {
    console.error('❌ MongoDB connection error:', err);
  });
