const express = require('express');
const router = express.Router();
const forumController = require('../controllers/forumController');
const { isLoggedIn } = require('../middleware/auth');

// View all questions in current student's class
router.get('/', isLoggedIn, forumController.getForum);

// Post a new question
router.post('/ask', isLoggedIn, forumController.postQuestion);

// Post an answer to a question
router.post('/:id/answer', isLoggedIn, forumController.postAnswer);

module.exports = router;
