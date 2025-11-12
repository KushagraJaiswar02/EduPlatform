const mongoose = require('mongoose');

const quizSchema = new mongoose.Schema({
  lessonId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Lesson',
    required: true
  },
  // 'classRef' yahan se hata diya gaya hai (redundant tha).
  questions: [
    {
      question: String,
      options: [String],
      answer: String
    }
  ],
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
}, { timestamps: true });

module.exports = mongoose.model('Quiz', quizSchema);