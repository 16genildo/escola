const Parte = require('../models/Parte');

module.exports = {
  // Listar todas as partes
  async index(req, res) {
    try {
      const partes = await Parte.find().sort('nome');
      res.render('layout', { 
        template: 'pages/partes',
        partes 
      });
    } catch (error) {
      console.error('Erro ao carregar partes:', error);
      res.render('layout', { 
        template: 'pages/partes',
        partes: [],
        error: 'Erro ao carregar partes.'
      });
    }
  },

  // Formulário de nova parte
  async novo(req, res) {
    try {
      res.render('layout', { 
        template: 'pages/parte-form',
        parte: null,
        error: null
      });
    } catch (error) {
      console.error('Erro ao carregar formulário:', error);
      res.redirect('/partes');
    }
  },

  // Criar parte
  async criar(req, res) {
    try {
      const parteData = {
        nome: req.body.nome,
        descricao: req.body.descricao,
        generoPreferido: req.body.generoPreferido || null
      };
      
      await Parte.create(parteData);
      res.redirect('/partes');
    } catch (error) {
      console.error('Erro ao criar parte:', error);
      res.render('layout', { 
        template: 'pages/parte-form',
        parte: req.body,
        error: 'Erro ao criar parte.'
      });
    }
  },

  // Formulário de edição
  async editar(req, res) {
    try {
      const parte = await Parte.findById(req.params.id);
      if (!parte) {
        throw new Error('Parte não encontrada');
      }
      res.render('layout', { 
        template: 'pages/parte-form',
        parte,
        error: null
      });
    } catch (error) {
      console.error('Erro ao carregar edição:', error);
      res.redirect('/partes');
    }
  },

  // Atualizar parte
  async atualizar(req, res) {
    try {
      const parteData = {
        nome: req.body.nome,
        descricao: req.body.descricao,
        generoPreferido: req.body.generoPreferido || null
      };
      
      const parte = await Parte.findByIdAndUpdate(req.params.id, parteData, { new: true });
      if (!parte) {
        throw new Error('Parte não encontrada');
      }
      res.redirect('/partes');
    } catch (error) {
      console.error('Erro ao atualizar:', error);
      res.render('layout', { 
        template: 'pages/parte-form',
        parte: { ...req.body, _id: req.params.id },
        error: 'Erro ao atualizar parte.'
      });
    }
  },

  // Remover parte
  async excluir(req, res) {
    try {
      const parte = await Parte.findByIdAndDelete(req.params.id);
      if (!parte) {
        throw new Error('Parte não encontrada');
      }
      res.redirect('/partes');
    } catch (error) {
      console.error('Erro ao remover:', error);
      res.redirect('/partes');
    }
  }
}; 