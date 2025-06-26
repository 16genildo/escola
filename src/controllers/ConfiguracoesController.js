const Estudante = require('../models/Estudante');
const Designacao = require('../models/Designacao');

module.exports = {
  async index(req, res) {
    try {
      const totalEstudantes = await Estudante.countDocuments();
      const totalDesignacoes = await Designacao.countDocuments();
      const estudantes = await Estudante.find().sort('nome');
      const designacoes = await Designacao.find().populate('estudante').populate('parte').sort('-data');
      res.render('layout', {
        template: 'pages/configuracoes',
        totalEstudantes,
        totalDesignacoes,
        estudantes,
        designacoes
      });
    } catch (error) {
      res.render('layout', {
        template: 'pages/configuracoes',
        totalEstudantes: 0,
        totalDesignacoes: 0,
        estudantes: [],
        designacoes: [],
        error: 'Erro ao carregar configurações.'
      });
    }
  },

  async deleteEstudante(req, res) {
    try {
      await Estudante.findByIdAndDelete(req.params.id);
      res.redirect('/configuracoes');
    } catch (error) {
      res.redirect('/configuracoes');
    }
  },

  async deleteDesignacao(req, res) {
    try {
      await Designacao.findByIdAndDelete(req.params.id);
      res.redirect('/configuracoes');
    } catch (error) {
      res.redirect('/configuracoes');
    }
  },

  async deleteAllEstudantes(req, res) {
    try {
      await Estudante.deleteMany({});
      res.redirect('/configuracoes');
    } catch (error) {
      res.redirect('/configuracoes');
    }
  },

  async deleteAllDesignacoes(req, res) {
    try {
      await Designacao.deleteMany({});
      res.redirect('/configuracoes');
    } catch (error) {
      res.redirect('/configuracoes');
    }
  }
}; 