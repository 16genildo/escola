const express = require('express');
const router = express.Router();
const ParteController = require('../controllers/ParteController');
const AuthController = require('../controllers/AuthController');

// Proteger todas as rotas
router.use(AuthController.requireAuth);

// Listar todas as partes
router.get('/', ParteController.index);

// Formulário de nova parte
router.get('/new', ParteController.new);

// Criar parte
router.post('/', ParteController.create);

// Formulário de edição
router.get('/:id/edit', ParteController.edit);

// Atualizar parte
router.put('/:id', ParteController.update);

// Remover parte
router.delete('/:id', ParteController.delete);

module.exports = router; 