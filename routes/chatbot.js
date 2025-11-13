const express = require('express');
const router = express.Router();
const chatbot = require('../controllers/chatbotController');

// POST route to send a message and get a reply
router.post('/send', chatbot.sendMessage);

// POST route to clear chat history 
router.post('/clear', chatbot.clearChat);

module.exports = router;