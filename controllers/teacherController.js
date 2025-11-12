const Lesson = require('../models/Lesson');
const Quiz = require('../models/Quiz');
const Result = require('../models/Result');
const Class = require('../models/Class');

exports.getDashboard = async (req, res) => {
  const classes = await Class.find();
  res.render('teachers/dashboard', { user: req.user, classes });
};

exports.addLesson = async (req, res) => {
  const { classNumber, subject, title, content, lessonType } = req.body;
  const classRef = (await Class.findOne({ classNumber }))?._id;

  await Lesson.create({
    classRef,
    subject,
    title,
    content,
    lessonType,
    uploadedBy: req.user._id
  });

  req.flash('success', 'Lesson added successfully.');
  res.redirect('/teacher/dashboard');
};

exports.addQuiz = async (req, res) => {
  const { lessonId, questions } = req.body;
  const lesson = await Lesson.findById(lessonId);
  const classRef = lesson.classRef;

  await Quiz.create({
    lessonId,
    classRef,
    questions,
    createdBy: req.user._id
  });

  req.flash('success', 'Quiz created!');
  res.redirect('/teacher/dashboard');
};

exports.viewResults = async (req, res) => {
  const results = await Result.find().populate('userId quizId');
  res.render('teacher/results', { results });
};
