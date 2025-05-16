const express = require('express');
const router = express.Router();
const EstudanteController = require('../controllers/EstudanteController');
const AuthController = require('../controllers/AuthController');

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

module.exports = router; 