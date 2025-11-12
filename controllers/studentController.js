const Lesson = require('../models/Lesson');
const Quiz = require('../models/Quiz');
const Result = require('../models/Result');

// ==========================
// DASHBOARD
// ==========================
exports.getDashboard = async (req, res) => {
  const lessons = await Lesson.find({ classRef: req.user.classRef }).populate('classRef', 'classNumber');
  const quizzes = await Quiz.find({ classRef: req.user.classRef });
  res.render('students/dashboard', { user: req.user, lessons, quizzes });
};

// ==========================
// LESSONS
// ==========================
exports.getAllLessons = async (req, res) => {
  const lessons = await Lesson.find({ classRef: req.user.classRef });
  res.render('students/lessons', { user: req.user, lessons });
};

exports.getLesson = async (req, res) => {
  const lesson = await Lesson.findById(req.params.id).populate('uploadedBy', 'name');
  res.render('students/lesson', { user: req.user, lesson });
};

// ==========================
// QUIZZES
// ==========================
exports.getAllQuizzes = async (req, res) => {
  const quizzes = await Quiz.find({ classRef: req.user.classRef })
    .populate('lessonId', 'title subject');
  res.render('students/quizzes', { user: req.user, quizzes });
};

exports.getQuiz = async (req, res) => {
  const quiz = await Quiz.findOne({ lessonId: req.params.lessonId }).populate('lessonId', 'title');
  if (!quiz) {
    req.flash('error', 'No quiz found for this lesson.');
    return res.redirect('/student/quizzes');
  }
  console.log(quiz)
  res.render('students/quiz', { user: req.user, quiz });
};

exports.submitQuiz = async (req, res) => {
  const quiz = await Quiz.findById(req.params.quizId);
  let score = 0;

  quiz.questions.forEach((q, i) => {
    if (req.body[`q${i}`] === q.answer) score++;
  });

  const result = await Result.create({
    userId: req.user._id,
    quizId: quiz._id,
    score,
    total: quiz.questions.length
  });

  req.flash('success', 'Quiz submitted successfully!');
  res.redirect(`/student/results/${result._id}`);
};

// ==========================
// RESULTS
// ==========================
exports.getAllResults = async (req, res) => {
  try {
    const results = await Result.find({ userId: req.user._id })
      .populate({
        path: 'quizId',
        populate: { path: 'lessonId', select: 'title subject' }
      })
      .sort({ createdAt: -1 });

    res.render('students/results', { user: req.user, results });
  } catch (err) {
    console.error(err);
    res.render('error', { message: 'Failed to load results' });
  }
};


exports.getResultById = async (req, res) => {
  const result = await Result.findById(req.params.id)
    .populate({
      path: 'quizId',
      populate: { path: 'lessonId', select: 'title subject' }
    });

  if (!result) {
    req.flash('error', 'Result not found.');
    return res.redirect('/student/results');
  }

  res.render('students/result', { user: req.user, result });
};
