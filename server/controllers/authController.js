const User = require('../models/User');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const validator = require('validator');


exports.register = async (req, res) => {
  try {
    console.log('Register - Request body:', req.body); 

    const { username, email, password } = req.body;

    
    if (!username || !email || !password) {
      return res.status(400).json({ message: "All fields are required." });
    }
    
    if (!validator.isEmail(email)) {
    return res.status(400).json({ message: 'Please enter a valid email.' });
    }
  if (password.length < 8) {
    return res.status(400).json({ message: 'Password must be at least 8 characters.' });
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(409).json({ message: "User already exists." });
    }

    
    const hashedPassword = await bcrypt.hash(password, 10);

   
    const user = await User.create({
      username,
      email,
      password: hashedPassword
    });

    // JWT token
    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
      expiresIn: '7d'
    });

    
    res.status(201).json({
      token,
      user: {
        id: user._id,
        username: user.username
      }
    });
  } catch (err) {
    console.error('Register Error:', err);
    res.status(500).json({ message: "Server error", error: err.message });
  }
};


exports.login = async (req, res) => {
  try {
    console.log('Login - Request body:', req.body); 

    const { email, password } = req.body;

    
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ message: "Invalid credentials" });
    }
    if (!validator.isEmail(email)) {
    return res.status(400).json({ message: 'Please enter a valid email.' });
    }
    if (password.length < 8) {
    return res.status(400).json({ message: 'Password must be at least 8 characters.' });
    }
    
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: "Invalid credentials" });
    }

    
    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
      expiresIn: '7d'
    });

    
    res.status(200).json({
      token,
      user: {
        id: user._id,
        username: user.username
      }
    });
  } catch (err) {
    console.error('Login Error:', err);
    res.status(500).json({ message: "Server error", error: err.message });
  }
};
