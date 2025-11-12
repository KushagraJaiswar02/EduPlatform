const express = require('express');
const router = express.Router();

router.get('/dashboard', (req, res) => res.render('teachers/dashboard'));
router.get('/addLesson', (req, res) => res.render('teachers/addLesson'));
router.get('/addQuiz', (req, res) => res.render('teachers/addQuiz'));

module.exports = router;
