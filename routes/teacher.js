const express = require('express');
const router = express.Router();

const teacherController = require('../controllers/teacherController');
const { isLoggedIn, isTeacher } = require('../middleware/auth');
const multer = require('multer');

// Use memory storage so we can upload directly to Cloudinary from buffer
const storage = multer.memoryStorage();
const upload = multer({ storage });

// Dashboard
router.get('/dashboard', isLoggedIn, isTeacher, teacherController.getDashboard);

// Enable live for existing lesson (create meetingUrl and enable)
router.post('/lesson/:id/enable-live', isLoggedIn, isTeacher, teacherController.enableLive);

// Create lesson (accept optional video upload in field 'video')
router.post('/add-lesson', isLoggedIn, isTeacher, upload.single('video'), teacherController.addLesson);

// Create quiz
router.post('/add-quiz', isLoggedIn, isTeacher, teacherController.addQuiz);

// View all quizzes
router.get('/quizzes', isLoggedIn, isTeacher, teacherController.getAllQuizzes);

// View quiz results
router.get('/results', isLoggedIn, isTeacher, teacherController.viewResults);

router.get('/results/:id', isLoggedIn, isTeacher, teacherController.getResultDetail);


module.exports = router;
