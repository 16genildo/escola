const Designacao = require('../models/Designacao');
const Estudante = require('../models/Estudante');
const { getWeekRange } = require('../utils/dateUtils');

module.exports = {
    // Mostrar formulário de avaliação
    async avaliacaoForm(req, res) {
        try {
            const designacao = await Designacao.findById(req.params.id)
                .populate('estudante')
                .populate('ajudante')
                .populate('parte');

            if (!designacao) {
                return res.redirect('/designacoes');
            }

            const proximaSemana = getWeekRange(new Date());

            res.render('layout', {
                template: 'pages/avaliacao-form',
                designacao,
                proximaSemana
            });
        } catch (error) {
            console.error('Erro ao carregar formulário de avaliação:', error);
            res.redirect('/designacoes');
        }
    },

    // Salvar avaliação
    async salvarAvaliacao(req, res) {
        try {
            const {
                pontuacao,
                comentarios,
                pontosFortes,
                pontosAMelhorar
            } = req.body;

            const designacao = await Designacao.findById(req.params.id);
            if (!designacao) {
                return res.redirect('/designacoes');
            }

            // Atualizar a avaliação
            designacao.avaliacao = {
                realizada: true,
                data: new Date(),
                pontuacao: parseInt(pontuacao),
                comentarios,
                pontosFortes: pontosFortes ? pontosFortes.split(',').map(p => p.trim()) : [],
                pontosAMelhorar: pontosAMelhorar ? pontosAMelhorar.split(',').map(p => p.trim()) : []
            };

            await designacao.save();

            // Atualizar estatísticas do estudante
            const estudante = await Estudante.findById(designacao.estudante);
            if (estudante) {
                // Aqui você pode adicionar lógica para atualizar estatísticas do estudante
                // baseado na avaliação, se necessário
            }

            res.redirect('/designacoes');
        } catch (error) {
            console.error('Erro ao salvar avaliação:', error);
            res.redirect(`/designacoes/${req.params.id}/avaliacao`);
        }
    },

    // Criar avaliação
    async criar(req, res) {
        try {
            const designacao = await Designacao.findById(req.params.id);
            if (!designacao) {
                return res.redirect('/designacoes');
            }

            const avaliacaoData = {
                pontos: req.body.pontos,
                comentarios: req.body.comentarios,
                data: new Date()
            };

            designacao.avaliacao = avaliacaoData;
            await designacao.save();

            res.redirect('/designacoes');
        } catch (error) {
            console.error('Erro ao criar avaliação:', error);
            res.redirect('/designacoes');
        }
    },

    // Atualizar avaliação
    async atualizar(req, res) {
        try {
            const designacao = await Designacao.findById(req.params.id);
            if (!designacao) {
                return res.redirect('/designacoes');
            }

            designacao.avaliacao = {
                pontos: req.body.pontos,
                comentarios: req.body.comentarios,
                data: new Date()
            };

            await designacao.save();
            res.redirect('/designacoes');
        } catch (error) {
            console.error('Erro ao atualizar avaliação:', error);
            res.redirect('/designacoes');
        }
    },

    // Excluir avaliação
    async excluir(req, res) {
        try {
            const designacao = await Designacao.findById(req.params.id);
            if (!designacao) {
                return res.redirect('/designacoes');
            }

            designacao.avaliacao = undefined;
            await designacao.save();

            res.redirect('/designacoes');
        } catch (error) {
            console.error('Erro ao excluir avaliação:', error);
            res.redirect('/designacoes');
        }
    }
}; 