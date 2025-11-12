const express = require('express');
const router = express.Router();
const forumController = require('../controllers/forumController');
const { isLoggedIn } = require('../middleware/auth'); 



router.get('/', isLoggedIn, forumController.getForum);


router.get('/ask', isLoggedIn, forumController.getNewQuestionForm);

router.post('/ask', isLoggedIn, forumController.postQuestion);


router.post('/:id/answer', isLoggedIn, forumController.postAnswer);

module.exports = router;