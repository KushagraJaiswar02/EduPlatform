const express = require('express');
const router = express.Router();
const teacherController = require('../controllers/teacherController');
const { isLoggedIn, isTeacher } = require('../middleware/auth');

// Teacher Dashboard
router.get('/dashboard', isLoggedIn, isTeacher, teacherController.getDashboard);

// Add new lesson
router.post('/add-lesson', isLoggedIn, isTeacher, teacherController.addLesson);

// Add quiz for lesson
router.post('/add-quiz', isLoggedIn, isTeacher, teacherController.addQuiz);

// View results for quizzes
router.get('/results', isLoggedIn, isTeacher, teacherController.viewResults);

module.exports = router;
