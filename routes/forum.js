const express = require('express');
const router = express.Router();
const forumController = require('../controllers/forumController');
const { isLoggedIn } = require('../middleware/auth');

// View forum
router.get('/', isLoggedIn, forumController.getForum);

// Ask question
router.post('/ask', isLoggedIn, forumController.postQuestion);

// Answer question
router.post('/:id/answer', isLoggedIn, forumController.postAnswer);

module.exports = router;
