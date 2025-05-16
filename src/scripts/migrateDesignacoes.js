const mongoose = require('mongoose');
const Designacao = require('../models/Designacao');

// Conectar ao MongoDB
mongoose.connect('mongodb://localhost:27017/escola_ministerio', {
    useNewUrlParser: true,
    useUnifiedTopology: true
});

async function migrateDesignacoes() {
    try {
        // Primeiro, vamos dropar a coleção inteira para garantir que não há índices antigos
        console.log('Removendo coleção antiga...');
        await mongoose.connection.dropCollection('designacaos');
        console.log('Coleção removida com sucesso!');
    } catch (error) {
        if (error.code === 26) {
            console.log('Coleção não existe, continuando...');
        } else {
            throw error;
        }
    }

    try {
        // Criar a coleção novamente
        console.log('Criando nova coleção...');
        await mongoose.connection.createCollection('designacaos');
        console.log('Nova coleção criada!');

        // Criar índice não-único para melhorar a performance
        console.log('Criando índice...');
        await mongoose.connection.collection('designacaos').createIndex(
            { semanaInicio: 1, semanaFim: 1, sala: 1 }
        );
        console.log('Índice criado com sucesso!');

        // Desconectar do banco de dados
        await mongoose.disconnect();
        console.log('Migração concluída!');
        process.exit(0);
    } catch (error) {
        console.error('Erro durante a migração:', error);
        process.exit(1);
    }
}

// Executar a migração
migrateDesignacoes(); 