const express = require('express');
const router = express.Router();
const studentController = require('../controllers/studentController');
const { isLoggedIn } = require('../middleware/auth');

// Dashboard
router.get('/dashboard', isLoggedIn, studentController.getDashboard);

// Lessons
router.get('/lesson/:id', isLoggedIn, studentController.getLesson);

// Quizzes
router.get('/quiz/:lessonId', isLoggedIn, studentController.getQuiz);
router.post('/quiz/:quizId/submit', isLoggedIn, studentController.submitQuiz);

module.exports = router;
