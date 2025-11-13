const express = require('express');
const router = express.Router();
const studentController = require('../controllers/studentController');
const { isLoggedIn, isStudent } = require('../middleware/auth');

// ==========================
// STUDENT DASHBOARD
// ==========================
router.get('/dashboard', isLoggedIn, isStudent, studentController.getDashboard);

// ==========================
// LESSONS
// ==========================
router.get('/lessons', isLoggedIn, isStudent, studentController.getAllLessons);
router.get('/lesson/:id', isLoggedIn, isStudent, studentController.getLesson);

// ==========================
// QUIZZES
// ==========================
// View all quizzes for student's class
router.get('/quizzes', isLoggedIn, isStudent, studentController.getAllQuizzes);

// Take quiz by quizId (not lessonId)
router.get('/quiz/:quizId', isLoggedIn, isStudent, studentController.getQuiz);

// Submit quiz answers — matches form action
router.post('/quiz/:quizId', isLoggedIn, isStudent, studentController.submitQuiz);

// ==========================
// RESULTS
// ==========================
// View all quiz results for the student
router.get('/results', isLoggedIn, isStudent, studentController.getAllResults);

// View a single quiz result
router.get('/results/:id', isLoggedIn, isStudent, studentController.getResultById);

module.exports = router;
