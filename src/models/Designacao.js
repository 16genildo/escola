const mongoose = require('mongoose');

const avaliacaoSchema = new mongoose.Schema({
    pontos: {
        type: Number,
        required: true,
        min: 0,
        max: 5
    },
    comentarios: {
        type: String,
        trim: true
    },
    data: {
        type: Date,
        default: Date.now
    }
});

const designacaoSchema = new mongoose.Schema({
  data: { 
    type: Date, 
    required: true
  },
  sala: {
    type: String,
    required: true
  },
  estudante: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Estudante',
    required: true
  },
  parte: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Parte',
    required: true
  },
  numeroDesignacoes: {
    type: String,
    required: true,
    default: ''
  },
  precisaAjudante: {
    type: Boolean,
    default: false
  },
  observacoes: {
    type: String,
    trim: true
  },
  ajudante: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Estudante',
    default: null
  },
  avaliacao: avaliacaoSchema
}, {
  timestamps: true
});

// Criar índice para melhorar a performance das consultas
designacaoSchema.index({ data: 1, sala: 1 });

module.exports = mongoose.model('Designacao', designacaoSchema); 