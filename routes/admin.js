const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const { isLoggedIn, isAdmin } = require('../middleware/auth');

// Admin dashboard
router.get('/dashboard', isLoggedIn, isAdmin, adminController.getDashboard);

// Approve lesson
router.post('/lesson/:id/approve', isLoggedIn, isAdmin, adminController.approveLesson);

// Manage users
router.get('/users', isLoggedIn, isAdmin, adminController.manageUsers);

module.exports = router;
