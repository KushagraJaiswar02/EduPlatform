const mongoose = require('mongoose');

const forumSchema = new mongoose.Schema({
  classRef: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Class',
    required: true
  },
  subject: String,
  question: {
    type: String,
    required: true
  },
  askedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  answers: [
    {
      text: String,
      answeredBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
      },
      createdAt: {
        type: Date,
        default: Date.now
      }
    }
  ]
}, { timestamps: true });

module.exports = mongoose.model('Forum', forumSchema);
