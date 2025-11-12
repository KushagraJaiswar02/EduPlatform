const mongoose = require('mongoose');

const classSchema = new mongoose.Schema({
  classNumber: {
    type: Number,
    required: true,
    unique: true,
    min: 1,
    max: 8
  },
  // Yah structure theek hai kyonki ek class mein kayi subjects ho sakte hain
  // aur har subject ka ek specific teacher ho sakta hai.
  subjects: [
    {
      name: String,
      teacher: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User' // teacher handling that subject
      }
    }
  ]
  // 'students' array yahan se hata diya gaya hai.
  // 'lessons' array yahan se hata diya gaya hai.
}, { timestamps: true });

module.exports = mongoose.model('Class', classSchema);