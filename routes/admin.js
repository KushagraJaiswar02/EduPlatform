const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const { isLoggedIn, isAdmin } = require('../middleware/auth');

// Admin dashboard
router.get('/dashboard', isLoggedIn, isAdmin, adminController.getDashboard);

router.get('/classes', isLoggedIn, isAdmin, adminController.getClasses);

router.post('/add-class', isLoggedIn, isAdmin, adminController.addClass);

// Approve lessons uploaded by teachers
router.post('/lesson/:id/approve', isLoggedIn, isAdmin, adminController.approveLesson);

// Manage users (view all)
router.get('/users', isLoggedIn, isAdmin, adminController.manageUsers);

router.post('/add-subject', isLoggedIn, isAdmin, adminController.addSubjectToClass);

router.post('/reassign-teacher', isLoggedIn, isAdmin, adminController.reassignTeacher);


module.exports = router;
