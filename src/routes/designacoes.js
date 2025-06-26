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

// Rotas de exclusão em massa
router.post('/delete-multiple', DesignacaoController.deleteMultiple);
router.post('/delete-by-sala', DesignacaoController.deleteBySala);
router.post('/delete-all', DesignacaoController.deleteAll);

// Rota para reenviar email de notificação
router.post('/:id/send-email', DesignacaoController.sendEmail);

// Rotas de importação
router.post('/import-json', DesignacaoController.importJson);
router.post('/import-excel', DesignacaoController.importExcel);

// Rota de exportação
router.get('/export-json', DesignacaoController.exportJson);

// Rota para converter Excel em JSON
router.post('/convert-excel-json', DesignacaoController.convertExcelToJson);

// Rota para enviar email em massa
router.post('/send-email-multiple', DesignacaoController.sendEmailMultiple);

// Rota para exportar designações em JSON básico
router.get('/export-json-basico', DesignacaoController.exportJsonBasico);

// Rota para exportar designações em JSON básico com estudante
router.get('/export-json-basico-estudante', DesignacaoController.exportJsonBasicoEstudante);

module.exports = router; 