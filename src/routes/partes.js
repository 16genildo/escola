const express = require('express');
const router = express.Router();
const ParteController = require('../controllers/ParteController');
const AuthController = require('../controllers/AuthController');

// Rotas de partes
router.get('/', ParteController.index);
router.get('/novo', ParteController.novo);
router.post('/', ParteController.criar);
router.get('/:id/editar', ParteController.editar);
router.put('/:id', ParteController.atualizar);
router.delete('/:id', ParteController.excluir);

module.exports = router; 