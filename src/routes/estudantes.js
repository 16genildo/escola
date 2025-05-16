const express = require('express');
const router = express.Router();
const EstudanteController = require('../controllers/EstudanteController');
const AuthController = require('../controllers/AuthController');

// Proteger todas as rotas
router.use(AuthController.requireAuth);

// Listar todos os estudantes
router.get('/', EstudanteController.index);

// Formulário de novo estudante
router.get('/new', EstudanteController.new);

// Criar estudante
router.post('/', EstudanteController.create);

// Formulário de edição
router.get('/:id/edit', EstudanteController.edit);

// Atualizar estudante
router.put('/:id', EstudanteController.update);

// Remover estudante
router.delete('/:id', EstudanteController.delete);

module.exports = router; 