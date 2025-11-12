const express = require('express');
const router = express.Router();

router.get('/dashboard', (req, res) => res.render('students/dashboard'));

router.get('/lesson/:id', (req, res) => res.render('students/lesson'));

router.get('/quiz/:id', (req, res) => res.render('students/quiz'));

router.get('/result/:id', (req, res) => res.render('students/result'));

module.exports = router;
