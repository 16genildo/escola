const mongoose = require('mongoose');

const salaSchema = new mongoose.Schema({
  nome: { 
    type: String, 
    enum: ['A', 'B']
  },
  capacidade: { 
    type: Number,
    default: 0
  },
  createdAt: { 
    type: Date, 
    default: Date.now 
  }
});

module.exports = mongoose.model('Sala', salaSchema); 