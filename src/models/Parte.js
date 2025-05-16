const mongoose = require('mongoose');

const parteSchema = new mongoose.Schema({
  nome: { 
    type: String, 
    required: true 
  },
  descricao: String,
  generoPreferido: {
    type: String,
    enum: ['M', 'F', null],
    default: null,
    description: 'Gênero preferido para esta parte (M, F ou null para qualquer)'
  },
  createdAt: { 
    type: Date, 
    default: Date.now 
  }
});

module.exports = mongoose.model('Parte', parteSchema); 