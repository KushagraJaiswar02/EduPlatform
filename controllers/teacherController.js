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
    const {
      classNumber,
      subject,
      title,
      content,
      lessonType,
      difficultyLevel,
      relatedTo
    } = req.body;

    // normalize resources[] (can be single string or array)
    let resourcesArr = [];
    if (req.body.resources) {
      if (Array.isArray(req.body.resources)) resourcesArr = req.body.resources;
      else resourcesArr = [req.body.resources];
      resourcesArr = resourcesArr.map(r => String(r).trim()).filter(Boolean);
    }

    const classDoc = await Class.findOne({ classNumber });
    if (!classDoc) {
      req.flash("error", "Class not found.");
      return res.redirect("/teacher/dashboard");
    }

    // validate relatedTo if provided
    let relatedToId = undefined;
    if (relatedTo && String(relatedTo).trim()) {
      const rel = await Lesson.findById(String(relatedTo).trim());
      if (rel) relatedToId = rel._id;
    }

    await Lesson.create({
      classRef: classDoc._id,
      subject,
      title,
      content,
      lessonType,
      difficultyLevel: difficultyLevel || 'beginner',
      relatedTo: relatedToId,
      resources: resourcesArr,
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
