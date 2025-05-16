const Designacao = require('../models/Designacao');
const Estudante = require('../models/Estudante');
const Parte = require('../models/Parte');
const PDFDocument = require('pdfkit');

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

            res.render('layout', { 
                template: 'pages/designacoes',
                designacoesPorData,
                salaFiltro: req.query.sala || ''
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
            
            await Designacao.create(designacaoData);

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
    }
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