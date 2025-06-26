const Designacao = require('../models/Designacao');
const Estudante = require('../models/Estudante');
const Parte = require('../models/Parte');
const PDFDocument = require('pdfkit');
const { sendMail } = require('../utils/emailUtils');
const multer = require('multer');
const XLSX = require('xlsx');
const upload = multer({ dest: 'uploads/' });

// Função auxiliar para carregar designações agrupadas por data
async function carregarDesignacoesPorData(filtro = {}) {
    const designacoes = await Designacao.find(filtro)
        .populate('estudante')
        .populate('parte')
        .populate('ajudante')
        .sort('data');

    // Agrupar designações por data
    const designacoesPorData = {};
    designacoes.forEach(designacao => {
        const data = new Date(designacao.data);
        const dataFormatada = data.toLocaleDateString('pt-BR');
        
        if (!designacoesPorData[dataFormatada]) {
            designacoesPorData[dataFormatada] = [];
        }
        designacoesPorData[dataFormatada].push(designacao);
    });

    // Converter para array e ordenar por data
    return Object.entries(designacoesPorData)
        .sort(([dataA], [dataB]) => {
            const [diaA, mesA, anoA] = dataA.split('/').map(Number);
            const [diaB, mesB, anoB] = dataB.split('/').map(Number);
            return new Date(anoA, mesA - 1, diaA) - new Date(anoB, mesB - 1, diaB);
        });
}

module.exports = {
    // Listar todas as designações
    async index(req, res) {
        try {
            // Construir o filtro baseado na query
            const filtro = {};
            if (req.query.sala && ['A', 'B'].includes(req.query.sala)) {
                filtro.sala = req.query.sala;
            }

            const designacoesPorData = await carregarDesignacoesPorData(filtro);

            let notificacoes = null;
            if (req.session && req.session.notificacoes) {
                notificacoes = req.session.notificacoes;
                delete req.session.notificacoes;
            }
            res.render('layout', { 
                template: 'pages/designacoes',
                designacoesPorData,
                salaFiltro: req.query.sala || '',
                notificacoes
            });
        } catch (error) {
            console.error('Erro ao carregar designações:', error);
            res.render('layout', { 
                template: 'pages/designacoes',
                designacoesPorData: [],
                salaFiltro: req.query.sala || '',
                error: 'Erro ao carregar designações.'
            });
        }
    },

    // Formulário de nova designação
    async novo(req, res) {
        try {
            const [estudantes, partes] = await Promise.all([
                Estudante.find().sort('nome'),
                Parte.find().sort('nome')
            ]);

            res.render('layout', { 
                template: 'pages/designacao-form',
                estudantes,
                partes,
                designacoesPorData: [] // Garantir que a variável existe mesmo no formulário
            });
        } catch (error) {
            console.error('Erro ao carregar formulário:', error);
            res.redirect('/designacoes');
        }
    },

    // Criar designação
    async criar(req, res) {
        try {
            // Ajusta a data para meia-noite no fuso horário local
            const dataInput = new Date(req.body.data + 'T00:00:00');
            const dataAjustada = new Date(dataInput.getTime() + dataInput.getTimezoneOffset() * 60000);

            const designacaoData = {
                estudante: req.body.estudante,
                parte: req.body.parte,
                data: dataAjustada,
                sala: req.body.sala,
                ajudante: req.body.ajudante || null,
                observacoes: req.body.observacoes
            };
            
            // Cria a designação e popula parte e ajudante para o email
            const novaDesignacao = await Designacao.create(designacaoData);
            const parte = await Parte.findById(req.body.parte);
            let ajudante = null;
            if (req.body.ajudante) {
                ajudante = await Estudante.findById(req.body.ajudante);
            }

            // Atualizar informações do estudante
            await Estudante.findByIdAndUpdate(req.body.estudante, {
                $inc: { totalDesignacoes: 1 },
                $set: { ultimaDesignacao: dataAjustada },
                $push: { 
                    partesFeitas: {
                        data: dataAjustada,
                        parte: req.body.parte
                    }
                }
            });

            // Notificações por email
            let notificacoes = [];
            const estudante = await Estudante.findById(req.body.estudante);
            // Montar detalhes para o email
            const detalhes = `
Data: ${dataAjustada.toLocaleDateString('pt-BR')}
Sala: ${req.body.sala}
Parte: ${parte ? parte.nome : '-'}
${ajudante ? 'Ajudante: ' + ajudante.nome + '\n' : ''}${designacaoData.observacoes ? 'Observação: ' + designacaoData.observacoes + '\n' : ''}`;
            const detalhesHtml = `
<ul>
  <li><b>Data:</b> ${dataAjustada.toLocaleDateString('pt-BR')}</li>
  <li><b>Sala:</b> ${req.body.sala}</li>
  <li><b>Parte:</b> ${parte ? parte.nome : '-'}</li>
  ${ajudante ? '<li><b>Ajudante:</b> ' + ajudante.nome + '</li>' : ''}
  ${designacaoData.observacoes ? '<li><b>Observação:</b> ' + designacaoData.observacoes + '</li>' : ''}
</ul>`;
            const agradecimento = '\nAgradecemos pela sua disponibilidade!\n\nCongregação Parque Urbano';
            const agradecimentoHtml = '<p>Agradecemos pela sua disponibilidade!</p><p><b>Congregação Parque Urbano</b></p>';

            if (req.body.notificarEstudante && estudante && estudante.email) {
                try {
                    await sendMail({
                        to: estudante.email,
                        subject: 'Nova Designação Recebida',
                        text: `Olá, ${estudante.nome}!\n\nVocê recebeu uma nova designação.\n${detalhes}${agradecimento}`,
                        html: `<p>Olá, <b>${estudante.nome}</b>!</p><p>Você recebeu uma nova designação:</p>${detalhesHtml}${agradecimentoHtml}`
                    });
                    notificacoes.push('Email enviado para o estudante.');
                } catch (emailErr) {
                    console.error('Erro ao enviar email para estudante:', emailErr);
                    notificacoes.push('Falha ao enviar email para o estudante.');
                }
            }
            // Notificar ajudante se selecionado
            if (req.body.notificarAjudante && ajudante && ajudante.email) {
                try {
                    await sendMail({
                        to: ajudante.email,
                        subject: 'Você foi designado como ajudante',
                        text: `Olá, ${ajudante.nome}!\n\nVocê foi designado como ajudante do estudante ${estudante ? estudante.nome : '-'}!\n${detalhes}${agradecimento}`,
                        html: `<p>Olá, <b>${ajudante.nome}</b>!</p><p>Você foi designado como ajudante do estudante <b>${estudante ? estudante.nome : '-'}</b>:</p>${detalhesHtml}${agradecimentoHtml}`
                    });
                    notificacoes.push('Email enviado para o ajudante.');
                } catch (emailErr) {
                    console.error('Erro ao enviar email para ajudante:', emailErr);
                    notificacoes.push('Falha ao enviar email para o ajudante.');
                }
            } else if (req.body.notificarAjudante && ajudante) {
                notificacoes.push('Ajudante não possui email cadastrado.');
            }

            // Redirecionar para a lista com mensagem
            req.session = req.session || {};
            req.session.notificacoes = notificacoes;
            res.redirect('/designacoes');
        } catch (error) {
            console.error('Erro ao criar designação:', error);
            const [estudantes, partes] = await Promise.all([
                Estudante.find().sort('nome'),
                Parte.find().sort('nome')
            ]);

            res.render('layout', { 
                template: 'pages/designacao-form',
                estudantes,
                partes,
                designacoesPorData: [], // Garantir que a variável existe mesmo no erro
                error: 'Erro ao criar designação.'
            });
        }
    },

    // Formulário de edição
    async editar(req, res) {
        try {
            const [designacao, estudantes, partes] = await Promise.all([
                Designacao.findById(req.params.id)
                    .populate('estudante')
                    .populate('ajudante')
                    .populate('parte'),
                Estudante.find().sort('nome'),
                Parte.find().sort('nome')
            ]);

            res.render('layout', { 
                template: 'pages/designacao-form',
                designacao,
                estudantes,
                partes,
                designacoesPorData: [] // Garantir que a variável existe mesmo no formulário de edição
            });
        } catch (error) {
            console.error('Erro ao carregar edição:', error);
            res.redirect('/designacoes');
        }
    },

    // Atualizar designação
    async atualizar(req, res) {
        try {
            // Ajusta a data para meia-noite no fuso horário local
            const dataInput = new Date(req.body.data + 'T00:00:00');
            const dataAjustada = new Date(dataInput.getTime() + dataInput.getTimezoneOffset() * 60000);

            const designacaoData = {
                estudante: req.body.estudante,
                parte: req.body.parte,
                data: dataAjustada,
                sala: req.body.sala,
                ajudante: req.body.ajudante || null,
                observacoes: req.body.observacoes
            };
            
            await Designacao.findByIdAndUpdate(req.params.id, designacaoData);
            res.redirect('/designacoes');
        } catch (error) {
            console.error('Erro ao atualizar:', error);
            const [designacao, estudantes, partes] = await Promise.all([
                Designacao.findById(req.params.id)
                    .populate('estudante')
                    .populate('ajudante')
                    .populate('parte'),
                Estudante.find().sort('nome'),
                Parte.find().sort('nome')
            ]);

            res.render('layout', { 
                template: 'pages/designacao-form',
                designacao,
                estudantes,
                partes,
                designacoesPorData: [], // Garantir que a variável existe mesmo no erro
                error: 'Erro ao atualizar designação.'
            });
        }
    },

    // Remover designação
    async excluir(req, res) {
        try {
            const designacao = await Designacao.findById(req.params.id);
            
            if (designacao) {
                // Atualizar informações do estudante
                await Estudante.findByIdAndUpdate(designacao.estudante, {
                    $inc: { totalDesignacoes: -1 }
                });

                await designacao.deleteOne();
            }

            res.redirect('/designacoes');
        } catch (error) {
            console.error('Erro ao remover:', error);
            res.redirect('/designacoes');
        }
    },

    // Gerar PDF das designações
    async gerarPdf(req, res) {
        try {
            const filtro = {};
            if (req.query.sala && ['A', 'B'].includes(req.query.sala)) {
                filtro.sala = req.query.sala;
            }

            const designacoes = await Designacao.find(filtro)
                .populate('estudante')
                .populate('ajudante')
                .populate('parte')
                .sort('data');

            // Criar um novo documento PDF
            const doc = new PDFDocument({
                size: 'A4',
                margin: 20
            });

            // Configurar o cabeçalho do response
            res.setHeader('Content-Type', 'application/pdf');
            res.setHeader('Content-Disposition', `attachment; filename=designacoes${req.query.sala ? '_sala_'+req.query.sala : ''}.pdf`);

            // Pipe o PDF para o response
            doc.pipe(res);

            // Desenhar quatro formulários por página
            for (let i = 0; i < designacoes.length; i += 4) {
                if (i > 0 && i % 4 === 0) {
                    doc.addPage();
                }

                // Linhas separadoras
                // Vertical
                doc.moveTo(297.5, 20)
                   .lineTo(297.5, 820)
                   .stroke();
                // Horizontal
                doc.moveTo(20, 420)
                   .lineTo(575, 420)
                   .stroke();

                // Primeiro formulário (superior esquerdo)
                desenharFormulario(doc, 25, 25, designacoes[i]);

                // Segundo formulário (superior direito)
                if (i + 1 < designacoes.length) {
                    desenharFormulario(doc, 300, 25, designacoes[i + 1]);
                }

                // Terceiro formulário (inferior esquerdo)
                if (i + 2 < designacoes.length) {
                    desenharFormulario(doc, 25, 425, designacoes[i + 2]);
                }

                // Quarto formulário (inferior direito)
                if (i + 3 < designacoes.length) {
                    desenharFormulario(doc, 300, 425, designacoes[i + 3]);
                }
            }

            // Finalizar o PDF
            doc.end();

        } catch (error) {
            console.error('Erro ao gerar PDF:', error);
            res.status(500).send('Erro ao gerar PDF das designações');
        }
    },

    // Exclusão múltipla de designações selecionadas
    async deleteMultiple(req, res) {
        try {
            const ids = req.body.ids;
            if (!ids || (Array.isArray(ids) && ids.length === 0)) {
                return res.redirect('/designacoes');
            }
            await Designacao.deleteMany({ _id: { $in: ids } });
            res.redirect('/designacoes');
        } catch (error) {
            console.error('Erro ao apagar designações selecionadas:', error);
            res.redirect('/designacoes');
        }
    },

    // Exclusão de todas as designações de uma sala
    async deleteBySala(req, res) {
        try {
            const sala = req.body.sala;
            if (!sala) return res.redirect('/designacoes');
            await Designacao.deleteMany({ sala });
            res.redirect('/designacoes');
        } catch (error) {
            console.error('Erro ao apagar designações da sala:', error);
            res.redirect('/designacoes');
        }
    },

    // Exclusão de todas as designações
    async deleteAll(req, res) {
        try {
            await Designacao.deleteMany({});
            res.redirect('/designacoes');
        } catch (error) {
            console.error('Erro ao apagar todas as designações:', error);
            res.redirect('/designacoes');
        }
    },

    // Reenviar email de notificação para estudante e ajudante de uma designação
    async sendEmail(req, res) {
        try {
            const designacao = await Designacao.findById(req.params.id)
                .populate('estudante')
                .populate('ajudante')
                .populate('parte');
            if (!designacao) {
                req.session = req.session || {};
                req.session.notificacoes = ['Designação não encontrada.'];
                return res.redirect('/designacoes');
            }
            const dataAjustada = new Date(designacao.data);
            const detalhes = `\nData: ${dataAjustada.toLocaleDateString('pt-BR')}\nSala: ${designacao.sala}\nParte: ${designacao.parte ? designacao.parte.nome : '-'}\n${designacao.ajudante ? 'Ajudante: ' + designacao.ajudante.nome + '\n' : ''}${designacao.observacoes ? 'Observação: ' + designacao.observacoes + '\n' : ''}`;
            const detalhesHtml = `\n<ul>\n  <li><b>Data:</b> ${dataAjustada.toLocaleDateString('pt-BR')}</li>\n  <li><b>Sala:</b> ${designacao.sala}</li>\n  <li><b>Parte:</b> ${designacao.parte ? designacao.parte.nome : '-'}</li>\n  ${designacao.ajudante ? '<li><b>Ajudante:</b> ' + designacao.ajudante.nome + '</li>' : ''}\n  ${designacao.observacoes ? '<li><b>Observação:</b> ' + designacao.observacoes + '</li>' : ''}\n</ul>`;
            const agradecimento = '\nAgradecemos pela sua disponibilidade!\n\nCongregação Parque Urbano';
            const agradecimentoHtml = '<p>Agradecemos pela sua disponibilidade!</p><p><b>Congregação Parque Urbano</b></p>';
            let notificacoes = [];
            // Enviar para estudante
            if (designacao.estudante && designacao.estudante.email) {
                try {
                    await sendMail({
                        to: designacao.estudante.email,
                        subject: 'Nova Designação Recebida',
                        text: `Olá, ${designacao.estudante.nome}!\n\nVocê recebeu uma nova designação.\n${detalhes}${agradecimento}`,
                        html: `<p>Olá, <b>${designacao.estudante.nome}</b>!</p><p>Você recebeu uma nova designação:</p>${detalhesHtml}${agradecimentoHtml}`
                    });
                    notificacoes.push('Email reenviado para o estudante.');
                } catch (emailErr) {
                    console.error('Erro ao reenviar email para estudante:', emailErr);
                    notificacoes.push('Falha ao reenviar email para o estudante.');
                }
            } else {
                notificacoes.push('Estudante não possui email cadastrado.');
            }
            // Enviar para ajudante
            if (designacao.ajudante && designacao.ajudante.email) {
                try {
                    await sendMail({
                        to: designacao.ajudante.email,
                        subject: 'Você foi designado como ajudante',
                        text: `Olá, ${designacao.ajudante.nome}!\n\nVocê foi designado como ajudante do estudante ${designacao.estudante ? designacao.estudante.nome : '-'}!\n${detalhes}${agradecimento}`,
                        html: `<p>Olá, <b>${designacao.ajudante.nome}</b>!</p><p>Você foi designado como ajudante do estudante <b>${designacao.estudante ? designacao.estudante.nome : '-'}</b>:</p>${detalhesHtml}${agradecimentoHtml}`
                    });
                    notificacoes.push('Email reenviado para o ajudante.');
                } catch (emailErr) {
                    console.error('Erro ao reenviar email para ajudante:', emailErr);
                    notificacoes.push('Falha ao reenviar email para o ajudante.');
                }
            } else if (designacao.ajudante) {
                notificacoes.push('Ajudante não possui email cadastrado.');
            }
            req.session = req.session || {};
            req.session.notificacoes = notificacoes;
            res.redirect('/designacoes');
        } catch (error) {
            console.error('Erro ao reenviar email:', error);
            req.session = req.session || {};
            req.session.notificacoes = ['Erro ao reenviar email de notificação.'];
            res.redirect('/designacoes');
        }
    },

    // Enviar email para várias designações selecionadas
    async sendEmailMultiple(req, res) {
        let notificacoes = [];
        try {
            const ids = req.body.ids;
            if (!ids || (Array.isArray(ids) && ids.length === 0)) {
                notificacoes.push('Nenhuma designação selecionada.');
            } else {
                const idsArray = Array.isArray(ids) ? ids : [ids];
                for (const id of idsArray) {
                    try {
                        const designacao = await Designacao.findById(id)
                            .populate('estudante')
                            .populate('ajudante')
                            .populate('parte');
                        if (!designacao) {
                            notificacoes.push(`Designação ${id} não encontrada.`);
                            continue;
                        }
                        const dataAjustada = new Date(designacao.data);
                        const detalhes = `\nData: ${dataAjustada.toLocaleDateString('pt-BR')}\nSala: ${designacao.sala}\nParte: ${designacao.parte ? designacao.parte.nome : '-'}\n${designacao.ajudante ? 'Ajudante: ' + designacao.ajudante.nome + '\n' : ''}${designacao.observacoes ? 'Observação: ' + designacao.observacoes + '\n' : ''}`;
                        const detalhesHtml = `\n<ul>\n  <li><b>Data:</b> ${dataAjustada.toLocaleDateString('pt-BR')}</li>\n  <li><b>Sala:</b> ${designacao.sala}</li>\n  <li><b>Parte:</b> ${designacao.parte ? designacao.parte.nome : '-'}</li>\n  ${designacao.ajudante ? '<li><b>Ajudante:</b> ' + designacao.ajudante.nome + '</li>' : ''}\n  ${designacao.observacoes ? '<li><b>Observação:</b> ' + designacao.observacoes + '</li>' : ''}\n</ul>`;
                        const agradecimento = '\nAgradecemos pela sua disponibilidade!\n\nCongregação Parque Urbano';
                        const agradecimentoHtml = '<p>Agradecemos pela sua disponibilidade!</p><p><b>Congregação Parque Urbano</b></p>';
                        // Enviar para estudante
                        if (designacao.estudante && designacao.estudante.email) {
                            try {
                                await sendMail({
                                    to: designacao.estudante.email,
                                    subject: 'Nova Designação Recebida',
                                    text: `Olá, ${designacao.estudante.nome}!\n\nVocê recebeu uma nova designação.\n${detalhes}${agradecimento}`,
                                    html: `<p>Olá, <b>${designacao.estudante.nome}</b>!</p><p>Você recebeu uma nova designação:</p>${detalhesHtml}${agradecimentoHtml}`
                                });
                                notificacoes.push(`Email enviado para o estudante ${designacao.estudante.nome}.`);
                            } catch (emailErr) {
                                console.error('Erro ao enviar email para estudante:', emailErr);
                                notificacoes.push(`Falha ao enviar email para o estudante ${designacao.estudante.nome}.`);
                            }
                        } else {
                            notificacoes.push(`Estudante ${designacao.estudante ? designacao.estudante.nome : ''} não possui email cadastrado.`);
                        }
                        // Enviar para ajudante
                        if (designacao.ajudante && designacao.ajudante.email) {
                            try {
                                await sendMail({
                                    to: designacao.ajudante.email,
                                    subject: 'Você foi designado como ajudante',
                                    text: `Olá, ${designacao.ajudante.nome}!\n\nVocê foi designado como ajudante do estudante ${designacao.estudante ? designacao.estudante.nome : '-'}!\n${detalhes}${agradecimento}`,
                                    html: `<p>Olá, <b>${designacao.ajudante.nome}</b>!</p><p>Você foi designado como ajudante do estudante <b>${designacao.estudante ? designacao.estudante.nome : '-'}</b>:</p>${detalhesHtml}${agradecimentoHtml}`
                                });
                                notificacoes.push(`Email enviado para o ajudante ${designacao.ajudante.nome}.`);
                            } catch (emailErr) {
                                console.error('Erro ao enviar email para ajudante:', emailErr);
                                notificacoes.push(`Falha ao enviar email para o ajudante ${designacao.ajudante.nome}.`);
                            }
                        } else if (designacao.ajudante) {
                            notificacoes.push(`Ajudante ${designacao.ajudante.nome} não possui email cadastrado.`);
                        }
                    } catch (err) {
                        notificacoes.push(`Erro ao processar designação ${id}: ${err.message}`);
                    }
                }
            }
        } catch (error) {
            notificacoes.push('Erro ao enviar emails em massa: ' + error.message);
        }
        req.session = req.session || {};
        req.session.notificacoes = notificacoes;
        res.redirect('/designacoes');
    },

    // Importar designações via JSON
    importJson: [upload.single('file'), async (req, res) => {
        let notificacoes = [];
        try {
            if (!req.file) throw new Error('Nenhum arquivo enviado.');
            const fs = require('fs');
            const data = fs.readFileSync(req.file.path, 'utf8');
            const json = JSON.parse(data);
            if (!Array.isArray(json)) throw new Error('O JSON deve ser um array de designações.');
            let inseridos = 0;
            for (const item of json) {
                try {
                    // Buscar parte pelo nome (tolerante), criar se não existir
                    let parteDoc = null;
                    if (item.parte) {
                        parteDoc = await Parte.findOne({ nome: { $regex: `^${item.parte.trim()}$`, $options: 'i' } });
                        if (!parteDoc) {
                            parteDoc = await Parte.create({ nome: item.parte.trim() });
                        }
                    }
                    // Buscar ajudante pelo nome, se houver (tolerante), criar se não existir
                    let ajudanteDoc = null;
                    if (item.ajudante) {
                        const Estudante = require('../models/Estudante');
                        ajudanteDoc = await Estudante.findOne({ nome: { $regex: `^${item.ajudante.trim()}$`, $options: 'i' } });
                        if (!ajudanteDoc) {
                            ajudanteDoc = await Estudante.create({ nome: item.ajudante.trim(), genero: 'M', sala: 'A' });
                        }
                    }
                    // Buscar estudante pelo nome, criar se não existir
                    if (item.estudante) {
                        estudanteDoc = await Estudante.findOne({ nome: { $regex: `^${item.estudante.trim()}$`, $options: 'i' } });
                        if (!estudanteDoc) {
                            estudanteDoc = await Estudante.create({ nome: item.estudante.trim(), genero: 'M', sala: 'A' });
                        }
                    }
                    // Preencher numeroDesignacoes corretamente
                    let numero = item.numeroDesignacoes;
                    if (!numero && item.parte) {
                        if (typeof item.parte === 'number') {
                            numero = item.parte;
                        } else if (typeof item.parte === 'string') {
                            const match = item.parte.match(/\d+/);
                            if (match) numero = Number(match[0]);
                        }
                    }
                    // Normalizar sala
                    let salaNormalizada = item.sala;
                    if (salaNormalizada === 'Principal') {
                        salaNormalizada = 'A';
                    } else if (salaNormalizada && salaNormalizada.trim().toUpperCase().startsWith('SALA ')) {
                        salaNormalizada = salaNormalizada.trim().slice(-1);
                    }
                    const designacaoData = {
                        data: item.data,
                        sala: salaNormalizada,
                        parte: parteDoc ? parteDoc._id : null,
                        ajudante: ajudanteDoc ? ajudanteDoc._id : null,
                        observacoes: item.observacoes || '',
                        estudante: estudanteDoc ? estudanteDoc._id : null,
                        numeroDesignacoes: (numero !== undefined && numero !== null && String(numero).trim() !== '')
                            ? String(numero)
                            : (item.parte ? String(item.parte).trim() : 'N/A')
                    };
                    const novaDesignacao = await Designacao.create(designacaoData);
                    inseridos++;
                    // Enviar email se estudante tiver email
                    if (estudanteDoc && estudanteDoc.email) {
                        // Buscar parte e ajudante populados para o email
                        const parte = await Parte.findById(novaDesignacao.parte);
                        let ajudante = null;
                        if (novaDesignacao.ajudante) {
                            ajudante = await Estudante.findById(novaDesignacao.ajudante);
                        }
                        const dataAjustada = new Date(novaDesignacao.data);
                        const detalhes = `\nData: ${dataAjustada.toLocaleDateString('pt-BR')}\nSala: ${novaDesignacao.sala}\nParte: ${parte ? parte.nome : '-'}\n${ajudante ? 'Ajudante: ' + ajudante.nome + '\n' : ''}${novaDesignacao.observacoes ? 'Observação: ' + novaDesignacao.observacoes + '\n' : ''}`;
                        const detalhesHtml = `\n<ul>\n  <li><b>Data:</b> ${dataAjustada.toLocaleDateString('pt-BR')}</li>\n  <li><b>Sala:</b> ${novaDesignacao.sala}</li>\n  <li><b>Parte:</b> ${parte ? parte.nome : '-'}</li>\n  ${ajudante ? '<li><b>Ajudante:</b> ' + ajudante.nome + '</li>' : ''}\n  ${novaDesignacao.observacoes ? '<li><b>Observação:</b> ' + novaDesignacao.observacoes + '</li>' : ''}\n</ul>`;
                        const agradecimento = '\nAgradecemos pela sua disponibilidade!\n\nCongregação Parque Urbano';
                        const agradecimentoHtml = '<p>Agradecemos pela sua disponibilidade!</p><p><b>Congregação Parque Urbano</b></p>';
                        try {
                            await sendMail({
                                to: estudanteDoc.email,
                                subject: 'Nova Designação Recebida',
                                text: `Olá, ${estudanteDoc.nome}!\n\nVocê recebeu uma nova designação.\n${detalhes}${agradecimento}`,
                                html: `<p>Olá, <b>${estudanteDoc.nome}</b>!</p><p>Você recebeu uma nova designação:</p>${detalhesHtml}${agradecimentoHtml}`
                            });
                            notificacoes.push(`Email enviado para o estudante ${estudanteDoc.nome}.`);
                        } catch (emailErr) {
                            console.error('Erro ao enviar email para estudante:', emailErr);
                            notificacoes.push(`Falha ao enviar email para o estudante ${estudanteDoc.nome}.`);
                        }
                        // Enviar email para o ajudante, se houver e se tiver email
                        if (ajudante && ajudante.email) {
                            try {
                                await sendMail({
                                    to: ajudante.email,
                                    subject: 'Você foi designado como ajudante',
                                    text: `Olá, ${ajudante.nome}!\n\nVocê foi designado como ajudante do estudante ${estudanteDoc ? estudanteDoc.nome : '-'}!\n${detalhes}${agradecimento}`,
                                    html: `<p>Olá, <b>${ajudante.nome}</b>!</p><p>Você foi designado como ajudante do estudante <b>${estudanteDoc ? estudanteDoc.nome : '-'}</b>:</p>${detalhesHtml}${agradecimentoHtml}`
                                });
                                notificacoes.push(`Email enviado para o ajudante ${ajudante.nome}.`);
                            } catch (emailErr) {
                                console.error('Erro ao enviar email para ajudante:', emailErr);
                                notificacoes.push(`Falha ao enviar email para o ajudante ${ajudante.nome}.`);
                            }
                        } else if (ajudante) {
                            notificacoes.push(`Ajudante ${ajudante.nome} não possui email cadastrado.`);
                        }
                    }
                } catch (err) {
                    notificacoes.push('Erro ao importar uma designação: ' + (err.message || err));
                }
            }
            notificacoes.unshift(`${inseridos} designação(ões) importadas com sucesso.`);
        } catch (error) {
            notificacoes.push('Erro ao importar JSON: ' + error.message);
        }
        req.session = req.session || {};
        req.session.notificacoes = notificacoes;
        res.redirect('/designacoes');
    }],

    // Importar designações via Excel
    importExcel: [upload.single('file'), async (req, res) => {
        let notificacoes = [];
        try {
            if (!req.file) throw new Error('Nenhum arquivo enviado.');
            const fs = require('fs');
            const workbook = XLSX.readFile(req.file.path);
            const sheetName = workbook.SheetNames[0];
            const sheet = workbook.Sheets[sheetName];
            const data = XLSX.utils.sheet_to_json(sheet);
            let inseridos = 0;
            for (const item of data) {
                try {
                    await Designacao.create(item);
                    inseridos++;
                } catch (err) {
                    notificacoes.push('Erro ao importar uma designação: ' + (err.message || err));
                }
            }
            notificacoes.unshift(`${inseridos} designação(ões) importadas com sucesso.`);
        } catch (error) {
            notificacoes.push('Erro ao importar Excel: ' + error.message);
        }
        req.session = req.session || {};
        req.session.notificacoes = notificacoes;
        res.redirect('/designacoes');
    }],

    // Exportar designações em JSON
    async exportJson(req, res) {
        try {
            const designacoes = await Designacao.find()
                .populate('estudante')
                .populate('ajudante')
                .populate('parte');
            res.setHeader('Content-Type', 'application/json');
            res.setHeader('Content-Disposition', 'attachment; filename=designacoes.json');
            res.send(JSON.stringify(designacoes, null, 2));
        } catch (error) {
            res.status(500).send({ error: 'Erro ao exportar designações.' });
        }
    },

    // Exportar designações em JSON básico
    async exportJsonBasico(req, res) {
        try {
            const designacoes = await Designacao.find()
                .populate('parte')
                .populate('ajudante');
            const basico = designacoes.map(d => ({
                data: d.data,
                sala: d.sala,
                parte: d.parte && d.parte.nome ? d.parte.nome : d.parte,
                ajudante: d.ajudante && d.ajudante.nome ? d.ajudante.nome : d.ajudante,
                observacoes: d.observacoes || ''
            }));
            res.setHeader('Content-Type', 'application/json');
            res.setHeader('Content-Disposition', 'attachment; filename=designacoes_basico.json');
            res.send(JSON.stringify(basico, null, 2));
        } catch (error) {
            res.status(500).send({ error: 'Erro ao exportar designações básicas.' });
        }
    },

    // Exportar designações em JSON básico com estudante
    async exportJsonBasicoEstudante(req, res) {
        try {
            const designacoes = await Designacao.find()
                .populate('parte')
                .populate('ajudante')
                .populate('estudante');
            const basico = designacoes.map(d => ({
                data: d.data,
                sala: d.sala,
                parte: d.parte && d.parte.nome ? d.parte.nome : d.parte,
                estudante: d.estudante && d.estudante.nome ? d.estudante.nome : d.estudante,
                ajudante: d.ajudante && d.ajudante.nome ? d.ajudante.nome : d.ajudante,
                observacoes: d.observacoes || ''
            }));
            res.setHeader('Content-Type', 'application/json');
            res.setHeader('Content-Disposition', 'attachment; filename=designacoes_basico_estudante.json');
            res.send(JSON.stringify(basico, null, 2));
        } catch (error) {
            res.status(500).send({ error: 'Erro ao exportar designações básicas com estudante.' });
        }
    },

    // Converter Excel em JSON para designações e baixar (formato personalizado)
    convertExcelToJson: [upload.single('file'), async (req, res) => {
        try {
            if (!req.file) throw new Error('Nenhum arquivo enviado.');
            const fs = require('fs');
            const XLSX = require('xlsx');
            const workbook = XLSX.readFile(req.file.path);
            const sheetName = workbook.SheetNames[0];
            const sheet = workbook.Sheets[sheetName];
            const rows = XLSX.utils.sheet_to_json(sheet, { header: 1 });
            if (rows.length < 3) throw new Error('Planilha com formato inválido.');
            // Pega a data do topo
            const dataTopo = rows[0][1];
            // Pega os índices das colunas
            const header = rows[1];
            const idxNum = header.findIndex(h => h && h.toString().toUpperCase().includes('DESIGNA'));
            const idxEstudante = header.findIndex(h => h && h.toString().toUpperCase().includes('PUBLICADOR'));
            const idxAjudante = header.findIndex(h => h && h.toString().toUpperCase().includes('AJUDANTE'));
            // Monta o array de designações
            const designacoes = [];
            for (let i = 2; i < rows.length; i++) {
                const row = rows[i];
                const estudante = row[idxEstudante];
                if (!estudante) continue;
                designacoes.push({
                    data: typeof dataTopo === 'string' ? dataTopo : XLSX.SSF.format('yyyy-mm-dd', dataTopo),
                    numeroDesignacoes: row[idxNum],
                    estudante: estudante,
                    ajudante: row[idxAjudante] || ''
                });
            }
            res.setHeader('Content-Type', 'application/json');
            res.setHeader('Content-Disposition', 'attachment; filename=designacoes_convertidas.json');
            res.send(JSON.stringify(designacoes, null, 2));
        } catch (error) {
            req.session = req.session || {};
            req.session.notificacoes = ['Erro ao converter Excel: ' + error.message];
            res.redirect('/designacoes');
        }
    }]
};

// Função auxiliar para desenhar um formulário no PDF
function desenharFormulario(doc, x, y, designacao) {
    if (!designacao) return;

    // Borda do formulário
    doc.rect(x, y, 270, 380).stroke();

    // Título
    doc.font('Helvetica-Bold')
       .fontSize(11)
       .text('DESIGNAÇÃO PARA A REUNIÃO', x, y + 10, { align: 'center', width: 270 })
       .fontSize(10)
       .text('NOSSA VIDA E MINISTÉRIO CRISTÃO', x, y + 25, { align: 'center', width: 270 });

    // Campos do formulário
    const startY = y + 45;
    doc.font('Helvetica-Bold')
       .fontSize(9)
       .text('Nome:', x + 15, startY)
       .font('Helvetica')
       .text(designacao.estudante.nome, x + 55, startY);

    doc.font('Helvetica-Bold')
       .text('Ajudante:', x + 15, startY + 20)
       .font('Helvetica')
       .text(designacao.ajudante ? designacao.ajudante.nome : '', x + 65, startY + 20);

    doc.font('Helvetica-Bold')
       .text('Data:', x + 15, startY + 40)
       .font('Helvetica')
       .text(new Date(designacao.data).toLocaleDateString('pt-BR'), x + 50, startY + 40);

    doc.font('Helvetica-Bold')
       .text('Parte:', x + 15, startY + 60)
       .font('Helvetica')
       .text(designacao.parte.nome, x + 55, startY + 60, { width: 200 });

    // Seção Local
    doc.font('Helvetica-Bold')
       .text('Local:', x + 15, startY + 80);

    // Checkboxes para salas
    const checkboxSize = 10;
    const checkboxX = x + 25;
    const checkboxBaseY = startY + 100;
    const checkboxSpacing = 20;

    // Função auxiliar para desenhar checkbox
    function desenharCheckbox(yOffset, label, checked) {
        const checkboxY = checkboxBaseY + yOffset;
        
        // Desenhar caixa
        doc.rect(checkboxX, checkboxY, checkboxSize, checkboxSize)
           .lineWidth(0.5)
           .stroke();

        // Desenhar marca se selecionado
        if (checked) {
            doc.save()
               .translate(checkboxX, checkboxY)
               .path('M 2 5 L 4 7 L 8 3')
               .lineWidth(1.5)
               .stroke()
               .restore();
        }

        // Texto do label
        doc.font('Helvetica')
           .text(label, checkboxX + checkboxSize + 8, checkboxY + 2);
    }

    // Desenhar checkboxes
    desenharCheckbox(0, 'Sala A', designacao.sala === 'A');
    desenharCheckbox(checkboxSpacing, 'Sala B', designacao.sala === 'B');

    // Observações
    if (designacao.observacoes) {
        doc.font('Helvetica-Bold')
           .text('Observações:', x + 15, startY + 160)
           .font('Helvetica')
           .text(designacao.observacoes, x + 15, startY + 175, { width: 240 });
    }

    // Código do formulário
    doc.font('Helvetica')
       .fontSize(7)
       .text('S-89-T     11/23', x + 15, y + 350);
} 