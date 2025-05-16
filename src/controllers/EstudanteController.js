const Estudante = require('../models/Estudante');

module.exports = {
  // Listar todos os estudantes
  async index(req, res) {
    try {
      const estudantes = await Estudante.find().sort('nome');
      res.render('layout', { 
        template: 'pages/estudantes',
        estudantes 
      });
    } catch (error) {
      console.error('Erro ao carregar estudantes:', error);
      res.render('layout', { 
        template: 'pages/estudantes',
        estudantes: [],
        error: 'Erro ao carregar estudantes.'
      });
    }
  },

  // Formulário de novo estudante
  async new(req, res) {
    res.render('layout', { 
      template: 'pages/estudante-form'
    });
  },

  // Criar estudante
  async create(req, res) {
    try {
      const estudanteData = {
        nome: req.body.nome,
        genero: req.body.genero,
        sala: req.body.sala || null
      };
      
      await Estudante.create(estudanteData);
      res.redirect('/estudantes');
    } catch (error) {
      console.error('Erro ao criar estudante:', error);
      res.render('layout', { 
        template: 'pages/estudante-form',
        error: 'Erro ao criar estudante.'
      });
    }
  },

  // Formulário de edição
  async edit(req, res) {
    try {
      const estudante = await Estudante.findById(req.params.id);
      res.render('layout', { 
        template: 'pages/estudante-form',
        estudante 
      });
    } catch (error) {
      console.error('Erro ao carregar edição:', error);
      res.redirect('/estudantes');
    }
  },

  // Atualizar estudante
  async update(req, res) {
    try {
      const estudanteData = {
        nome: req.body.nome,
        genero: req.body.genero,
        sala: req.body.sala || null
      };
      
      await Estudante.findByIdAndUpdate(req.params.id, estudanteData);
      res.redirect('/estudantes');
    } catch (error) {
      console.error('Erro ao atualizar:', error);
      const estudante = await Estudante.findById(req.params.id);
      res.render('layout', { 
        template: 'pages/estudante-form',
        estudante,
        error: 'Erro ao atualizar estudante.'
      });
    }
  },

  // Remover estudante
  async delete(req, res) {
    try {
      await Estudante.findByIdAndDelete(req.params.id);
      res.redirect('/estudantes');
    } catch (error) {
      console.error('Erro ao remover:', error);
      res.redirect('/estudantes');
    }
  }
}; 