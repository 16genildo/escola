const Estudante = require('../models/Estudante');
const Designacao = require('../models/Designacao');

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
  async novo(req, res) {
    try {
      res.render('layout', { 
        template: 'pages/estudante-form',
        estudante: null,
        error: null
      });
    } catch (error) {
      console.error('Erro ao carregar formulário:', error);
      res.redirect('/estudantes');
    }
  },

  // Criar estudante
  async criar(req, res) {
    try {
      const estudanteData = {
        nome: req.body.nome,
        email: req.body.email,
        genero: req.body.genero,
        sala: req.body.sala || null,
        totalDesignacoes: 0,
        ultimaDesignacao: null
      };
      
      await Estudante.create(estudanteData);
      res.redirect('/estudantes');
    } catch (error) {
      console.error('Erro ao criar estudante:', error);
      res.render('layout', { 
        template: 'pages/estudante-form',
        estudante: req.body,
        error: 'Erro ao criar estudante.'
      });
    }
  },

  // Formulário de edição
  async editar(req, res) {
    try {
      const estudante = await Estudante.findById(req.params.id);
      if (!estudante) {
        throw new Error('Estudante não encontrado');
      }
      res.render('layout', { 
        template: 'pages/estudante-form',
        estudante,
        error: null
      });
    } catch (error) {
      console.error('Erro ao carregar edição:', error);
      res.redirect('/estudantes');
    }
  },

  // Atualizar estudante
  async atualizar(req, res) {
    try {
      const estudanteData = {
        nome: req.body.nome,
        email: req.body.email,
        genero: req.body.genero,
        sala: req.body.sala || null
      };
      
      const estudante = await Estudante.findByIdAndUpdate(req.params.id, estudanteData, { new: true });
      if (!estudante) {
        throw new Error('Estudante não encontrado');
      }
      res.redirect('/estudantes');
    } catch (error) {
      console.error('Erro ao atualizar:', error);
      res.render('layout', { 
        template: 'pages/estudante-form',
        estudante: { ...req.body, _id: req.params.id },
        error: 'Erro ao atualizar estudante.'
      });
    }
  },

  // Remover estudante
  async excluir(req, res) {
    try {
      const estudante = await Estudante.findByIdAndDelete(req.params.id);
      if (!estudante) {
        throw new Error('Estudante não encontrado');
      }
      res.redirect('/estudantes');
    } catch (error) {
      console.error('Erro ao remover:', error);
      res.redirect('/estudantes');
    }
  },

  // Apagar todos os estudantes
  async deleteAll(req, res) {
    try {
      const estudantes = await Estudante.find({});
      const ids = estudantes.map(e => e._id);
      await Estudante.deleteMany({});
      // Apagar designações em que estudante ou ajudante seja um dos removidos
      await Designacao.deleteMany({ $or: [ { estudante: { $in: ids } }, { ajudante: { $in: ids } } ] });
      res.redirect('/estudantes');
    } catch (error) {
      console.error('Erro ao apagar todos os estudantes:', error);
      res.redirect('/estudantes');
    }
  },

  // Remover todas as designações órfãs (sem estudante ou parte)
  async removerDesignacoesOrfas(req, res) {
    try {
      const Designacao = require('../models/Designacao');
      const result = await Designacao.deleteMany({ $or: [ { estudante: null }, { parte: null } ] });
      res.redirect('/estudantes');
    } catch (error) {
      console.error('Erro ao remover designações órfãs:', error);
      res.redirect('/estudantes');
    }
  }
}; 