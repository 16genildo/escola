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
      res.render('layout', { 
        template: 'pages/partes',
        partes: [],
        error: 'Erro ao carregar partes.'
      });
    }
  },

  // Formulário de nova parte
  new(req, res) {
    res.render('layout', { 
      template: 'pages/parte-form'
    });
  },

  // Criar parte
  async create(req, res) {
    try {
      await Parte.create(req.body);
      res.redirect('/partes');
    } catch (error) {
      res.render('layout', { 
        template: 'pages/parte-form',
        error: 'Erro ao criar parte.'
      });
    }
  },

  // Formulário de edição
  async edit(req, res) {
    try {
      const parte = await Parte.findById(req.params.id);
      res.render('layout', { 
        template: 'pages/parte-form',
        parte 
      });
    } catch (error) {
      res.redirect('/partes');
    }
  },

  // Atualizar parte
  async update(req, res) {
    try {
      await Parte.findByIdAndUpdate(req.params.id, req.body);
      res.redirect('/partes');
    } catch (error) {
      const parte = await Parte.findById(req.params.id);
      res.render('layout', { 
        template: 'pages/parte-form',
        parte,
        error: 'Erro ao atualizar parte.'
      });
    }
  },

  // Remover parte
  async delete(req, res) {
    try {
      await Parte.findByIdAndDelete(req.params.id);
      res.redirect('/partes');
    } catch (error) {
      res.redirect('/partes');
    }
  }
}; 