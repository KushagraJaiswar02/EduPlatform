const Lesson = require('../models/Lesson');
const Quiz = require('../models/Quiz');
const Result = require('../models/Result');
const Class = require('../models/Class');

exports.getDashboard = async (req, res) => {
  const userClass = await Class.findById(req.user.classRef).populate('lessons');
  res.render('student/dashboard', { user: req.user, userClass });
};

exports.getLesson = async (req, res) => {
  const lesson = await Lesson.findById(req.params.id);
  res.render('student/lesson', { lesson });
};

exports.getQuiz = async (req, res) => {
  const quiz = await Quiz.findOne({ lessonId: req.params.lessonId });
  res.render('student/quiz', { quiz });
};

exports.submitQuiz = async (req, res) => {
  const { answers } = req.body;
  const quiz = await Quiz.findById(req.params.quizId);
  let score = 0;

  quiz.questions.forEach((q, i) => {
    if (answers[i] && answers[i] === q.answer) score++;
  });

  // Simple AI logic
  let recommendation = 'Great job!';
  if (score < quiz.questions.length * 0.4)
    recommendation = 'Revise this topic.';
  else if (score < quiz.questions.length * 0.7)
    recommendation = 'Good effort, but more practice needed.';

  await Result.create({
    userId: req.user._id,
    quizId: quiz._id,
    classRef: quiz.classRef,
    score,
    total: quiz.questions.length,
    recommendation
  });

  res.render('student/result', { score, total: quiz.questions.length, recommendation });
};
