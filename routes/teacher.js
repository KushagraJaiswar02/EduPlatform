const express = require('express');
const router = express.Router();

const teacherController = require('../controllers/teacherController');
const { isLoggedIn, isTeacher } = require('../middleware/auth');

// Dashboard
router.get('/dashboard', isLoggedIn, isTeacher, teacherController.getDashboard);

// Create lesson
router.post('/add-lesson', isLoggedIn, isTeacher, teacherController.addLesson);

// Create quiz
router.post('/add-quiz', isLoggedIn, isTeacher, teacherController.addQuiz);

// View all quizzes
router.get('/quizzes', isLoggedIn, isTeacher, teacherController.getAllQuizzes);

// View quiz results
router.get('/results', isLoggedIn, isTeacher, teacherController.viewResults);

module.exports = router;
