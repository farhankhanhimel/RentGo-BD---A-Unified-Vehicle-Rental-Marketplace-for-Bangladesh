const jwt = require('jsonwebtoken');
const User = require('../models/User');

// Protect routes - verify JWT token
exports.protect = async (req, res, next) => {
  let token;

  // Check Authorization header first
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    token = req.headers.authorization.split(' ')[1];
  }

  // Fallback: check query param (needed for file export via window.open)
  if (!token && req.query.token) {
    token = req.query.token;
  }

  if (!token) {
    return res.status(401).json({ message: 'Not authorized, no token' });
  }

  try {
    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Get user from token
    req.user = await User.findById(decoded.id);

    if (!req.user) {
      return res.status(401).json({ message: 'User not found' });
    }

    next();
  } catch (error) {
    console.error(error);
    return res.status(401).json({ message: 'Not authorized, token failed' });
  }
};

// Admin middleware
exports.admin = (req, res, next) => {
  if (req.user && req.user.role === 'admin') {
    next();
  } else {
    res.status(403).json({ message: 'Not authorized as admin' });
  }
};

// Vendor middleware
exports.vendor = (req, res, next) => {
  if (req.user && req.user.role === 'vendor') {
    next();
  } else {
    res.status(403).json({ message: 'Not authorized as vendor' });
  }
};

// Customer middleware
exports.customer = (req, res, next) => {
  if (req.user && req.user.role === 'customer') {
    next();
  } else {
    res.status(403).json({ message: 'Not authorized as customer' });
  }
};

// Verify account is active
exports.verifyActive = (req, res, next) => {
  if (req.user && req.user.isActive) {
    next();
  } else {
    res.status(403).json({ message: 'Account not verified' });
  }
};
