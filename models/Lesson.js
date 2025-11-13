const mongoose = require('mongoose');

const lessonSchema = new mongoose.Schema({
  classRef: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Class',
    required: true
  },
  subject: {
    type: String,
    required: true
  },
  title: {
    type: String,
    required: true
  },
  content: {
    type: String,
    required: true
  },
  lessonType: {
    type: String,
    enum: ['core', 'revision', 'practice'],
    default: 'core'
  },
  relatedTo: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Lesson'
  },
  difficultyLevel: {
    type: String,
    enum: ['beginner', 'intermediate', 'advanced'],
    default: 'beginner'
  },
  // resources can be simple strings (legacy) or richer objects
  // Use Mixed so both string and object representations are accepted without cast errors.
  resources: {
    type: [mongoose.Schema.Types.Mixed],
    default: []
  },
  live: {
    enabled: { type: Boolean, default: false },
    meetingUrl: String,
    scheduledAt: Date,
    // whether a live session is currently active (teacher started it)
    active: { type: Boolean, default: false }
  },
  uploadedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  approvedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
}, { timestamps: true });

module.exports = mongoose.model('Lesson', lessonSchema);
