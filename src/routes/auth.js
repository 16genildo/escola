const express = require('express');
const router = express.Router();
const AuthController = require('../controllers/AuthController');

// Rota para página de login
router.get('/login', AuthController.loginForm);

// Rota para processar login
router.post('/login', AuthController.login);

// Rota para logout
router.get('/logout', AuthController.logout);

module.exports = router; 