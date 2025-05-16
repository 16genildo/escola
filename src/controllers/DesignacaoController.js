const Designacao = require('../models/Designacao');
const Estudante = require('../models/Estudante');
const Parte = require('../models/Parte');
const PDFDocument = require('pdfkit');

module.exports = {
    // Listar todas as designações
    async index(req, res) {
        try {
            // Construir o filtro baseado na query
            const filtro = {
                'avaliacao.realizada': { $ne: true } // Apenas designações não avaliadas
            };
            if (req.query.sala && ['A', 'B'].includes(req.query.sala)) {
                filtro.sala = req.query.sala;
            }

            const designacoes = await Designacao.find(filtro)
                .populate('estudante')
                .populate('ajudante')
                .populate('parte')
                .sort('-data');
            
            // Agrupar designações por data
            const designacoesPorData = {};
            
            designacoes.forEach(d => {
                // Ajusta a data para o fuso horário local
                const data = new Date(d.data);
                const dataLocal = new Date(data.getTime() - data.getTimezoneOffset() * 60000);
                const dataKey = dataLocal.toLocaleDateString('pt-BR');
                
                if (!designacoesPorData[dataKey]) {
                    designacoesPorData[dataKey] = {
                        data: dataKey,
                        designacoes: []
                    };
                }
                
                designacoesPorData[dataKey].designacoes.push(d.toObject());
            });

            // Converter para array e ordenar por data (mais recente primeiro)
            const datas = Object.values(designacoesPorData).sort((a, b) => 
                new Date(b.data.split('/').reverse().join('-')) - new Date(a.data.split('/').reverse().join('-'))
            );
            
            res.render('layout', { 
                template: 'pages/designacoes',
                datas,
                salaFiltro: req.query.sala || ''
            });
        } catch (error) {
            console.error('Erro ao carregar designações:', error);
            res.render('layout', { 
                template: 'pages/designacoes',
                datas: [],
                salaFiltro: req.query.sala || '',
                error: 'Erro ao carregar designações.'
            });
        }
    },

    // Histórico de designações
    async historico(req, res) {
        try {
            // Construir o filtro baseado na query
            const filtro = {
                'avaliacao.realizada': true // Apenas designações avaliadas
            };
            if (req.query.sala && ['A', 'B'].includes(req.query.sala)) {
                filtro.sala = req.query.sala;
            }

            const designacoes = await Designacao.find(filtro)
                .populate('estudante')
                .populate('ajudante')
                .populate('parte')
                .sort('-avaliacao.data');
            
            // Agrupar designações por data
            const designacoesPorData = {};
            
            designacoes.forEach(d => {
                // Usar a data da avaliação
                const data = new Date(d.avaliacao.data);
                const dataLocal = new Date(data.getTime() - data.getTimezoneOffset() * 60000);
                const dataKey = dataLocal.toLocaleDateString('pt-BR');
                
                if (!designacoesPorData[dataKey]) {
                    designacoesPorData[dataKey] = {
                        data: dataKey,
                        designacoes: []
                    };
                }
                
                designacoesPorData[dataKey].designacoes.push(d.toObject());
            });

            // Converter para array e ordenar por data (mais recente primeiro)
            const datas = Object.values(designacoesPorData).sort((a, b) => 
                new Date(b.data.split('/').reverse().join('-')) - new Date(a.data.split('/').reverse().join('-'))
            );
            
            res.render('layout', { 
                template: 'pages/historico-designacoes',
                datas,
                salaFiltro: req.query.sala || ''
            });
        } catch (error) {
            console.error('Erro ao carregar histórico:', error);
            res.render('layout', { 
                template: 'pages/historico-designacoes',
                datas: [],
                salaFiltro: req.query.sala || '',
                error: 'Erro ao carregar histórico de designações.'
            });
        }
    },

    // Criar designação
    async create(req, res) {
        try {
            // Ajusta a data para meia-noite no fuso horário local
            const dataInput = new Date(req.body.data + 'T00:00:00');
            const dataAjustada = new Date(dataInput.getTime() + dataInput.getTimezoneOffset() * 60000);

            const designacaoData = {
                data: dataAjustada,
                sala: req.body.sala,
                estudante: req.body.estudante,
                parte: req.body.parte,
                ajudante: req.body.ajudante || null
            };

            const novaDesignacao = await Designacao.create(designacaoData);
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
                error: 'Erro ao criar designação.'
            });
        }
    },

    // Formulário de nova designação
    async new(req, res) {
        try {
            const [estudantes, partes] = await Promise.all([
                Estudante.find().sort('nome'),
                Parte.find().sort('nome')
            ]);

            res.render('layout', { 
                template: 'pages/designacao-form',
                estudantes,
                partes
            });
        } catch (error) {
            console.error('Erro ao carregar formulário:', error);
            res.redirect('/designacoes');
        }
    },

    // Formulário de edição
    async edit(req, res) {
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
                partes
            });
        } catch (error) {
            console.error('Erro ao carregar edição:', error);
            res.redirect('/designacoes');
        }
    },

    // Atualizar designação
    async update(req, res) {
        try {
            // Ajusta a data para meia-noite no fuso horário local
            const dataInput = new Date(req.body.data + 'T00:00:00');
            const dataAjustada = new Date(dataInput.getTime() + dataInput.getTimezoneOffset() * 60000);

            const designacaoData = {
                data: dataAjustada,
                sala: req.body.sala,
                estudante: req.body.estudante,
                parte: req.body.parte,
                ajudante: req.body.ajudante || null
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
                error: 'Erro ao atualizar designação.'
            });
        }
    },

    // Remover designação
    async delete(req, res) {
        try {
            await Designacao.findByIdAndDelete(req.params.id);
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
                desenharFormulario(25, 25, designacoes[i]);

                // Segundo formulário (superior direito)
                if (i + 1 < designacoes.length) {
                    desenharFormulario(300, 25, designacoes[i + 1]);
                }

                // Terceiro formulário (inferior esquerdo)
                if (i + 2 < designacoes.length) {
                    desenharFormulario(25, 425, designacoes[i + 2]);
                }

                // Quarto formulário (inferior direito)
                if (i + 3 < designacoes.length) {
                    desenharFormulario(300, 425, designacoes[i + 3]);
                }
            }

            // Função para desenhar um formulário de designação
            function desenharFormulario(x, y, designacao) {
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

                // Extrair o número da parte do nome da parte
                console.log('Nome da parte:', designacao.parte.nome);
                const numeroParte = designacao.parte.nome;
                console.log('Número extraído:', numeroParte);
                
                doc.font('Helvetica-Bold')
                   .text('Número da parte:', x + 15, startY + 60)
                   .font('Helvetica')
                   .text(numeroParte, x + 95, startY + 60, { width: 150 });

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
                desenharCheckbox(0, 'Salão principal', designacao.sala === 'A');
                desenharCheckbox(checkboxSpacing, 'Sala B', designacao.sala === 'B');
                desenharCheckbox(checkboxSpacing * 2, 'Sala C', false);

                // Observação
                const obsY = startY + 180;
                doc.font('Helvetica-Bold')
                   .fontSize(8)
                   .text('Observação para o estudante:', x + 15, obsY);
                
                doc.font('Helvetica')
                   .fontSize(8)
                   .text('A lição e a fonte de matéria para a sua designação estão na Apostila da Reunião Vida e Ministério. Veja as instruções para a parte que estão nas Instruções para a Reunião Nossa Vida e Ministério Cristão (S-38).', 
                         x + 15, obsY + 12, { width: 240 });

                // Código do formulário
                doc.font('Helvetica')
                   .fontSize(7)
                   .text('S-89-T     11/23', x + 15, y + 350);
            }

            // Finalizar o PDF
            doc.end();

        } catch (error) {
            console.error('Erro ao gerar PDF:', error);
            res.status(500).send('Erro ao gerar PDF das designações');
        }
    }
}; 