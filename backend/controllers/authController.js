const User = require('../models/User');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const generateToken = (id) => jwt.sign(
  { id: String(id), type: 'access' },
  process.env.JWT_SECRET,
  { expiresIn: '1d' },
);

const publicUser = (user) => ({
  _id: user._id,
  name: user.name,
  email: user.email,
  role: user.role,
  token: generateToken(user._id),
});

const registerUser = async (req, res) => {
  const name = typeof req.body?.name === 'string' ? req.body.name.trim() : '';
  const email = typeof req.body?.email === 'string' ? req.body.email.trim().toLowerCase() : '';
  const password = typeof req.body?.password === 'string' ? req.body.password : '';
  if (!name || name.length > 100 || !EMAIL_PATTERN.test(email) || password.length < 8 || password.length > 128) {
    return res.status(400).json({ message: 'Provide a valid name and email, and a password between 8 and 128 characters.' });
  }

  try {
    const user = await User.create({ name, email, password: await bcrypt.hash(password, 12) });
    return res.status(201).json(publicUser(user));
  } catch (error) {
    if (error.code === 11000) return res.status(409).json({ message: 'An account with this email already exists.' });
    if (error.name === 'ValidationError') return res.status(400).json({ message: 'Account details are invalid.' });
    console.error('Registration failed:', error.message);
    return res.status(500).json({ message: 'Unable to create account.' });
  }
};

const loginUser = async (req, res) => {
  const email = typeof req.body?.email === 'string' ? req.body.email.trim().toLowerCase() : '';
  const password = typeof req.body?.password === 'string' ? req.body.password : '';
  if (!EMAIL_PATTERN.test(email) || !password) {
    return res.status(400).json({ message: 'Provide a valid email and password.' });
  }

  try {
    const user = await User.findOne({ email });
    if (!user || !(await bcrypt.compare(password, user.password))) {
      return res.status(401).json({ message: 'Invalid email or password.' });
    }
    return res.status(200).json(publicUser(user));
  } catch (error) {
    console.error('Sign-in failed:', error.message);
    return res.status(500).json({ message: 'Unable to sign in.' });
  }
};

const getUsers = async (req, res) => {
  try {
    const users = await User.find({}).select('_id name email role createdAt').sort({ createdAt: -1 }).lean();
    return res.status(200).json(users);
  } catch (error) {
    console.error('User list failed:', error.message);
    return res.status(500).json({ message: 'Unable to list users.' });
  }
};

module.exports = { registerUser, loginUser, getUsers };
