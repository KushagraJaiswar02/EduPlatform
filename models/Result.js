const mongoose = require('mongoose');

const resultSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  quizId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Quiz'
  },
  classRef: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Class'
  },
  score: Number,
  total: Number,
  recommendation: String
}, { timestamps: true });

module.exports = mongoose.model('Result', resultSchema);
