const express = require('express');
const router = express.Router();
const DesignacaoController = require('../controllers/DesignacaoController');
const AvaliacaoController = require('../controllers/AvaliacaoController');
const AuthController = require('../controllers/AuthController');

// Proteger todas as rotas
router.use(AuthController.requireAuth);

// Listar todas as designações
router.get('/', DesignacaoController.index);

// Download do PDF
router.get('/pdf', DesignacaoController.gerarPdf);

// Formulário de nova designação
router.get('/new', DesignacaoController.new);

// Criar designação
router.post('/', DesignacaoController.create);

// Formulário de edição
router.get('/:id/edit', DesignacaoController.edit);

// Atualizar designação
router.put('/:id', DesignacaoController.update);

// Remover designação
router.delete('/:id', DesignacaoController.delete);

// Rotas de avaliação
router.get('/:id/avaliacao', AvaliacaoController.avaliacaoForm);
router.post('/:id/avaliacao', AvaliacaoController.salvarAvaliacao);

module.exports = router; 