// ===============================
// Authentication & Role Middleware
// ===============================

const User = require('../models/User');

// Middleware to ensure user is logged in
exports.isLoggedIn = (req, res, next) => {
  // User is already attached in app.js
  if (!req.user) {
    req.flash('error', 'You must be logged in first!');
    return res.redirect('/login');
  }
  next();
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
