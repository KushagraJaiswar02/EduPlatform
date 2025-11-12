const express = require('express');
const router = express.Router();
const studentController = require('../controllers/studentController');
const { isLoggedIn, isStudent } = require('../middleware/auth');

// Student Dashboard
router.get('/dashboard', isLoggedIn, isStudent, studentController.getDashboard);

// View specific lesson
router.get('/lesson/:id', isLoggedIn, isStudent, studentController.getLesson);

// Take a quiz for a lesson
router.get('/quiz/:lessonId', isLoggedIn, isStudent, studentController.getQuiz);

// Submit quiz answers
router.post('/quiz/:quizId/submit', isLoggedIn, isStudent, studentController.submitQuiz);

module.exports = router;
