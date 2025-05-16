const mongoose = require('mongoose');

const designacaoSchema = new mongoose.Schema({
  data: { 
    type: Date, 
    required: true
  },
  sala: {
    type: String,
    required: true,
    enum: ['A', 'B']
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
    type: Number,
    required: true,
    enum: [4, 5],
    default: 4
  },
  precisaAjudante: {
    type: Boolean,
    default: false
  },
  observacoes: String,
  ajudante: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Estudante',
    default: null
  },
  // Campos de avaliação
  avaliacao: {
    realizada: {
      type: Boolean,
      default: false
    },
    data: Date,
    pontuacao: {
      type: Number,
      min: 1,
      max: 5,
      default: null
    },
    comentarios: String,
    pontosFortes: [String],
    pontosAMelhorar: [String]
  }
}, {
  timestamps: true
});

// Criar índice para melhorar a performance das consultas
designacaoSchema.index({ data: 1, sala: 1 });

module.exports = mongoose.model('Designacao', designacaoSchema); 