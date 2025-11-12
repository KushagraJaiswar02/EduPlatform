const mongoose = require('mongoose');

const classSchema = new mongoose.Schema({
  classNumber: {
    type: Number,
    required: true,
    unique: true,
    min: 1,
    max: 8
  },
  subjects: [
    {
      name: String,
      teacher: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User' // teacher handling that subject
      }
    }
  ],
  students: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }
  ],
  lessons: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Lesson'
    }
  ]
}, { timestamps: true });

module.exports = mongoose.model('Class', classSchema);
