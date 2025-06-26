const express = require('express');
const router = express.Router();
const EstudanteController = require('../controllers/EstudanteController');
const AuthController = require('../controllers/AuthController');
const ConfiguracoesController = require('../controllers/ConfiguracoesController');

// Rota de teste
router.get('/teste', (req, res) => {
    res.send('Rota de teste funcionando!');
});

// Rotas de estudantes
router.get('/', EstudanteController.index);
router.get('/novo', EstudanteController.novo);
router.post('/', EstudanteController.criar);
router.get('/:id/editar', EstudanteController.editar);
router.put('/:id', EstudanteController.atualizar);
router.delete('/:id', EstudanteController.excluir);

// Rota para apagar todos os estudantes
router.post('/delete-all', EstudanteController.deleteAll);

// Rota para remover designações órfãs
router.post('/remover-designacoes-orfas', EstudanteController.removerDesignacoesOrfas);

// Rotas de configurações
router.get('/../configuracoes', ConfiguracoesController.index);
router.post('/../configuracoes/delete-estudante/:id', ConfiguracoesController.deleteEstudante);
router.post('/../configuracoes/delete-designacao/:id', ConfiguracoesController.deleteDesignacao);
router.post('/../configuracoes/delete-all-estudantes', ConfiguracoesController.deleteAllEstudantes);
router.post('/../configuracoes/delete-all-designacoes', ConfiguracoesController.deleteAllDesignacoes);

module.exports = router; 