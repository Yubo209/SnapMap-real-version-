const User = require('../models/User');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

// 注册用户
exports.register = async (req, res) => {
  try {
    console.log('Register - Request body:', req.body); // ✅ 打印注册请求体

    const { username, email, password } = req.body;

    // 1. 检查字段是否完整
    if (!username || !email || !password) {
      return res.status(400).json({ message: "All fields are required." });
    }

    // 2. 检查用户是否已存在
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(409).json({ message: "User already exists." });
    }

    // 3. 加密密码
    const hashedPassword = await bcrypt.hash(password, 10);

    // 4. 保存新用户
    const user = await User.create({
      username,
      email,
      password: hashedPassword
    });

    // 5. 生成 JWT token
    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
      expiresIn: '7d'
    });

    // 6. 返回 token 和用户信息
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

// 登录用户
exports.login = async (req, res) => {
  try {
    console.log('Login - Request body:', req.body); // ✅ 打印登录请求体

    const { email, password } = req.body;

    // 1. 查找用户
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ message: "Invalid credentials" });
    }

    // 2. 验证密码
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: "Invalid credentials" });
    }

    // 3. 生成 JWT token
    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
      expiresIn: '7d'
    });

    // 4. 返回 token 和用户信息
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
