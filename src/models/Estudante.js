const mongoose = require('mongoose');

const estudanteSchema = new mongoose.Schema({
  nome: { 
    type: String, 
    trim: true
  },
  email: {
    type: String,
    trim: true,
    lowercase: true,
    unique: true,
    sparse: true
  },
  genero: {
    type: String,
    enum: ['M', 'F']
  },
  sala: { 
    type: String, 
    enum: ['A', 'B', null], 
    default: null 
  },
  partesFeitas: [{ 
    data: Date,
    parte: {
      type: mongoose.Schema.Types.ObjectId, 
      ref: 'Parte' 
    }
  }],
  ultimaDesignacao: {
    type: Date,
    default: null
  },
  totalDesignacoes: {
    type: Number,
    default: 0
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Estudante', estudanteSchema); 