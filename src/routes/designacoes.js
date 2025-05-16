const express = require('express');
const router = express.Router();
const DesignacaoController = require('../controllers/DesignacaoController');
const AvaliacaoController = require('../controllers/AvaliacaoController');
const AuthController = require('../controllers/AuthController');

// Rotas de designações
router.get('/pdf', DesignacaoController.gerarPdf);
router.get('/novo', DesignacaoController.novo);
router.get('/', DesignacaoController.index);
router.post('/', DesignacaoController.criar);
router.get('/:id/editar', DesignacaoController.editar);
router.put('/:id', DesignacaoController.atualizar);
router.delete('/:id', DesignacaoController.excluir);

// Rotas de avaliação
router.post('/:id/avaliacoes', AvaliacaoController.criar);
router.put('/:id/avaliacoes', AvaliacaoController.atualizar);
router.delete('/:id/avaliacoes', AvaliacaoController.excluir);

module.exports = router; 