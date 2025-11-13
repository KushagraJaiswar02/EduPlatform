const Lesson = require('../models/Lesson');
const Quiz = require('../models/Quiz');
const Result = require('../models/Result');
const Class = require('../models/Class');

// ===============================
// TEACHER DASHBOARD
// ===============================
exports.getDashboard = async (req, res) => {
  try {
    const teacherId = req.user._id;

    // Classes where teacher teaches ANY subject
    const classes = await Class.find({
      "subjects.teacher": teacherId
    });

    // Lessons created BY this teacher
    const myLessons = await Lesson.find({
      uploadedBy: teacherId
    }).populate("classRef", "classNumber subjects");

    // Quizzes created BY this teacher (nested populate)
    const myQuizzes = await Quiz.find({
      createdBy: teacherId
    }).populate({
      path: "lessonId",
      populate: {
        path: "classRef",
        select: "classNumber subjects"
      }
    });

    return res.render("teachers/dashboard", {
      user: req.user,
      classes,
      myLessons,
      myQuizzes
    });

  } catch (err) {
    console.error("Dashboard Error:", err);
    res.render("error", { message: "Could not load teacher dashboard" });
  }
};

// ===============================
// ADD LESSON
// ===============================
exports.addLesson = async (req, res) => {
  try {
    const { classNumber, subject, title, content, lessonType } = req.body;

    const classDoc = await Class.findOne({ classNumber });
    if (!classDoc) {
      req.flash("error", "Class not found.");
      return res.redirect("/teacher/dashboard");
    }

    await Lesson.create({
      classRef: classDoc._id,
      subject,
      title,
      content,
      lessonType,
      uploadedBy: req.user._id
    });

    req.flash("success", "Lesson added successfully.");
    return res.redirect("/teacher/dashboard");

  } catch (err) {
    console.error("Add Lesson Error:", err);
    req.flash("error", "Failed to add lesson.");
    return res.redirect("/teacher/dashboard");
  }
};

// ===============================
// ADD QUIZ
// ===============================
exports.addQuiz = async (req, res) => {
  try {
    const { lessonId, questions } = req.body;

    const lesson = await Lesson.findById(lessonId);
    if (!lesson) {
      req.flash("error", "Lesson not found.");
      return res.redirect("/teacher/dashboard");
    }

    await Quiz.create({
      lessonId,
      questions,
      createdBy: req.user._id
    });

    req.flash("success", "Quiz created successfully!");
    return res.redirect("/teacher/dashboard");

  } catch (err) {
    console.error("Add Quiz Error:", err);
    req.flash("error", "Error creating quiz.");
    return res.redirect("/teacher/dashboard");
  }
};

// ===============================
// VIEW QUIZ RESULTS
// ===============================
exports.viewResults = async (req, res) => {
  try {
    const results = await Result.find()
      .populate("userId", "name email")
      .populate({
        path: "quizId",
        populate: {
          path: "lessonId",
          select: "title"
        }
      });

    return res.render("teachers/results", { results });

  } catch (err) {
    console.error("View Results Error:", err);
    res.render("error", { message: "Failed to load results" });
  }
};

// ===============================
// TEACHER'S QUIZZES PAGE
// ===============================
exports.getAllQuizzes = async (req, res) => {
  try {
    const quizzes = await Quiz.find({ createdBy: req.user._id })
      .populate({
        path: "lessonId",
        populate: {
          path: "classRef",
          select: "classNumber subjects"
        }
      });

    return res.render("teachers/quizzes", { quizzes });

  } catch (err) {
    console.error("Load Quizzes Error:", err);
    res.render("error", { message: "Failed to load quizzes" });
  }
};
