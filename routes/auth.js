const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');

// GET routes
router.get('/register', authController.getRegister);
router.get('/login', authController.getLogin);

// POST routes
router.post('/register', authController.registerUser);
router.post('/login', authController.loginUser);

// LOGOUT
router.get('/logout', authController.logoutUser);

module.exports = router;
