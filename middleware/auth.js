// ===============================
// Authentication & Role Middleware
// ===============================

const User = require('../models/User');

// Middleware to ensure user is logged in
exports.isLoggedIn = async (req, res, next) => {
  try {
    if (!req.session.userId) {
      req.flash('error', 'You must be logged in first!');
      return res.redirect('/login');
    }

    // Attach the full user object to req.user for later use
    const user = await User.findById(req.session.userId);
    if (!user) {
      req.flash('error', 'User not found. Please log in again.');
      return res.redirect('/login');
    }

    req.user = user;
    next();
  } catch (err) {
    console.error('Auth error:', err);
    res.redirect('/login');
  }
};

// Check if the user is a Student
exports.isStudent = (req, res, next) => {
  if (!req.user || req.user.role !== 'student') {
    req.flash('error', 'Access denied. Students only.');
    return res.redirect('/');
  }
  next();
};

// Check if the user is a Teacher
exports.isTeacher = (req, res, next) => {
  if (!req.user || req.user.role !== 'teacher') {
    req.flash('error', 'Access denied. Teachers only.');
    return res.redirect('/');
  }
  next();
};

// Check if the user is an Admin
exports.isAdmin = (req, res, next) => {
  if (!req.user || req.user.role !== 'admin') {
    req.flash('error', 'Access denied. Admins only.');
    return res.redirect('/');
  }
  next();
};

// Optional: Protect routes for logged-out users (redirect to dashboard)
exports.preventLoggedInAccess = (req, res, next) => {
  if (req.session.userId) {
    const role = req.session.role;
    if (role === 'student') return res.redirect('/student/dashboard');
    if (role === 'teacher') return res.redirect('/teacher/dashboard');
    if (role === 'admin') return res.redirect('/admin/dashboard');
  }
  next();
};
