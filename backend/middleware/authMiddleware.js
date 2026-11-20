const jwt = require('jsonwebtoken');
const User = require('../models/User');

const protect = async (req, res, next) => {
  const authHeader = req.headers.authorization || '';
  if (!authHeader.startsWith('Bearer ')) return res.status(401).json({ message: 'Authentication required.' });
  try {
    const token = authHeader.slice('Bearer '.length).trim();
    if (!token) return res.status(401).json({ message: 'Authentication required.' });
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    if (decoded.type !== 'access') return res.status(401).json({ message: 'Invalid or expired token.' });
    const user = await User.findById(decoded.id).select('-password').lean();
    if (!user) return res.status(401).json({ message: 'Account not found.' });
    req.user = user;
    return next();
  } catch {
    return res.status(401).json({ message: 'Invalid or expired token.' });
  }
};

module.exports = { protect };
