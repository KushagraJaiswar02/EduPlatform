const express = require('express');
const router = express.Router();
const teacherController = require('../controllers/teacherController');
const { isLoggedIn, isTeacher } = require('../middleware/auth');

// Teacher Dashboard
router.get('/dashboard', isLoggedIn, isTeacher, teacherController.getDashboard);

// Add Lesson
router.post('/add-lesson', isLoggedIn, isTeacher, teacherController.addLesson);

// Add Quiz
router.post('/add-quiz', isLoggedIn, isTeacher, teacherController.addQuiz);

// View Results
router.get('/results', isLoggedIn, isTeacher, teacherController.viewResults);

module.exports = router;
