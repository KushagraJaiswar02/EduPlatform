const Lesson = require('../models/Lesson');
const Quiz = require('../models/Quiz');
const Result = require('../models/Result');
const Class = require('../models/Class');

exports.getDashboard = async (req, res) => {
  const classes = await Class.find();
  const lessons = await Lesson.find().populate('classRef', 'classNumber subject');
  res.render('teachers/dashboard', { user: req.user, classes, lessons });
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
  try {
    const { lessonId } = req.body;
    const questions = req.body.questions; // already an array from form
    const lesson = await Lesson.findById(lessonId);
    if (!lesson) {
      req.flash('error', 'Lesson not found.');
      return res.redirect('/teacher/dashboard');
    }

    await Quiz.create({
      lessonId,
      classRef: lesson.classRef,
      questions, // from form, no need to JSON.parse
      createdBy: req.user._id
    });

    req.flash('success', 'Quiz created successfully!');
    res.redirect('/teacher/dashboard');
  } catch (err) {
    console.error(err);
    req.flash('error', 'Error creating quiz.');
    res.redirect('/teacher/dashboard');
  }
};


exports.viewResults = async (req, res) => {
  const results = await Result.find().populate('userId quizId');
  res.render('teacher/results', { results });
};


exports.getAllQuizzes = async (req, res) => {
  try {
    const quizzes = await Quiz.find({ createdBy: req.user._id })
      .populate('lessonId', 'title subject')
      .populate('classRef', 'classNumber');
    
    res.render('teachers/quizzes', { quizzes });
  } catch (err) {
    console.error(err);
    res.render('error', { message: 'Failed to load quizzes' });
  }
};
