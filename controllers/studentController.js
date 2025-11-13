const Lesson = require('../models/Lesson');
const Quiz = require('../models/Quiz');
const Result = require('../models/Result');
const Class = require('../models/Class');

// ==========================
// STUDENT DASHBOARD
// ==========================
exports.getDashboard = async (req, res) => {
  try {
    const classId = req.user.classRef;

    // Only show lessons/quizzes of the student's assigned class
    const lessons = await Lesson.find({ classRef: classId })
      .populate('classRef', 'classNumber');

    const quizzes = await Quiz.find({})
      .populate({
        path: 'lessonId',
        match: { classRef: classId },
        select: 'title classRef'
      });

    // filter null matched lessons
    const filteredQuizzes = quizzes.filter(q => q.lessonId);

    res.render('students/dashboard', {
      user: req.user,
      lessons,
      quizzes: filteredQuizzes
    });

  } catch (err) {
    console.error("Dashboard error:", err);
    res.render('students/dashboard', { user: req.user, lessons: [], quizzes: [] });
  }
};


// ==========================
// LESSON LIST + FILTER
// ==========================
exports.getAllLessons = async (req, res) => {
  try {
    // 1. Sabhi classes ko pehle hi fetch kar lein (dropdown ke liye)
    const classes = await Class.find({}, "classNumber");
    
    let selectedClass = null; // Default display value
    let query = {}; // Default query (sabhi lessons dikhaye)

    // 2. Check karein ki user aur unka classRef maujood hai
    if (req.user && req.user.classRef) {
      
      // 3. Query ke liye seedha ObjectId ka istemaal karein
      query = { classRef: req.user.classRef };

      // 4. Sirf display ke liye user ki class ka number fetch karein
      // Note: Hum classDoc ko null check kar rahe hain taaki crash na ho
      const classDoc = await Class.findById(req.user.classRef);
      if (classDoc) {
        selectedClass = classDoc.classNumber;
      }
    }

    // 5. Ab query sahi hai (ya toh {} ya { classRef: ObjectId(...) })
    const lessons = await Lesson.find(query)
      .populate("classRef", "classNumber");

    res.render("students/lessons", {
      user: req.user,
      lessons,
      classes,
      selectedClass // Ye ab ya toh null hai ya class ka number
    });

  } catch (err) {
    console.error("Lesson loading error:", err);
    
    // Error hone par bhi, classes ko render karne ki koshish karein
    let classes = [];
    try {
      classes = await Class.find({}, "classNumber");
    } catch (e) {
      // Agar yahaan bhi error aaye toh ignore karein
    }

    res.render("students/lessons", {
      user: req.user,
      lessons: [],
      classes, // Page crash na ho isliye classes pass karein
      selectedClass: null
    });
  }
};


// ==========================
// SINGLE LESSON
// ==========================
// controllers/studentController.js (replace getLesson)
exports.getLesson = async (req, res) => {
  try {
    const lessonId = req.params.id;

    if (!lessonId) {
      req.flash('error', 'Invalid lesson id.');
      return res.redirect('/student/lessons');
    }

    const lesson = await Lesson.findById(lessonId)
      .populate('uploadedBy', 'name email')
      .populate('classRef', 'classNumber');

    if (!lesson) {
      req.flash('error', 'Lesson not found.');
      return res.redirect('/student/lessons');
    }

    // optional debug: uncomment while testing
    // console.log('Loaded lesson:', lesson);

    return res.render('students/lesson', { user: req.user, lesson });
  } catch (err) {
    console.error('getLesson error:', err);
    req.flash('error', 'Could not load lesson.');
    return res.redirect('/student/lessons');
  }
};


// ==========================
// QUIZ LIST + FILTER
// ==========================
exports.getAllQuizzes = async (req, res) => {
  try {
    const selectedClass = req.query.class || null;

    const classes = await Class.find({}, "classNumber");

    // Step 1: Get lessons by class filter
    const lessonQuery = selectedClass
      ? { classRef: selectedClass }
      : {};

    const lessons = await Lesson.find(lessonQuery).select("_id classRef title subject");

    const lessonIds = lessons.map(l => l._id);

    // Step 2: Get quizzes for those lessons
    const quizzes = await Quiz.find({ lessonId: { $in: lessonIds } })
      .populate("lessonId", "title subject classRef")
      .populate({
        path: "lessonId",
        populate: { path: "classRef", select: "classNumber" }
      });

    res.render("students/quizzes", {
      user: req.user,
      quizzes,
      classes,
      selectedClass
    });

  } catch (err) {
    console.error("Quiz list error:", err);
    res.render("students/quizzes", {
      user: req.user,
      quizzes: [],
      classes: [],
      selectedClass: null
    });
  }
};

// ==========================
// GET SINGLE QUIZ (BY QUIZ ID)
// ==========================
exports.getQuiz = async (req, res) => {
  try {
    const quiz = await Quiz.findById(req.params.quizId)
      .populate("lessonId", "title subject classRef");
      console.log(req.params.quizId)

    if (!quiz) {
      req.flash("error", "Quiz not found.");
      console.log(quiz)
      return res.redirect("/student/quizzes");
    }

    res.render("students/quiz", {
      user: req.user,
      quiz
    });

  } catch (err) {
    console.error("Quiz error:", err);
    req.flash("error", "Could not load quiz.");
    res.redirect("/student/quizzes");
  }
};

// ==========================
// SUBMIT QUIZ
// ==========================
exports.submitQuiz = async (req, res) => {
  try {
    const quiz = await Quiz.findById(req.params.quizId);

    if (!quiz) {
      req.flash("error", "Quiz not found.");
      return res.redirect("/student/quizzes");
    }

    let score = 0;

    // Calculate score by comparing answers
    quiz.questions.forEach((q, i) => {
      if (req.body[`q${i}`] === q.answer) score++;
    });

    // Create result record
    const result = await Result.create({
      userId: req.user._id,
      quizId: quiz._id,
      score,
      total: quiz.questions.length
    });

    // Update user's profile stats
    req.user.profile.totalQuizzesTaken = (req.user.profile.totalQuizzesTaken || 0) + 1;
    req.user.profile.averageScore = (
      (req.user.profile.averageScore * (req.user.profile.totalQuizzesTaken - 1) + score) / 
      req.user.profile.totalQuizzesTaken
    ).toFixed(2);
    await req.user.save();

    req.flash("success", `Quiz submitted! Your score: ${score}/${quiz.questions.length}`);
    res.redirect(`/student/results/${result._id}`);

  } catch (err) {
    console.error("Submit quiz error:", err);
    req.flash("error", "Failed to submit quiz.");
    res.redirect("/student/quizzes");
  }
};
// ==========================
// RESULTS LIST
// ==========================
exports.getAllResults = async (req, res) => {
  try {
    const results = await Result.find({ userId: req.user._id })
      .populate({
        path: 'quizId',
        populate: {
          path: 'lessonId',
          select: 'title subject'
        }
      })
      .sort({ createdAt: -1 });

    res.render('students/result', {
      user: req.user,
      results
    });

  } catch (err) {
    console.error("Get results error:", err);
    req.flash("error", "Could not load results.");
    res.redirect("/student/dashboard");
  }
};

// ==========================
// GET SINGLE RESULT (DETAIL)
// ==========================
exports.getResultById = async (req, res) => {
  try {
    const result = await Result.findById(req.params.id)
      .populate({
        path: 'quizId',
        populate: {
          path: 'lessonId',
          select: 'title subject'
        }
      });

    if (!result) {
      req.flash("error", "Result not found.");
      return res.redirect("/student/results");
    }

    // Ensure user owns this result
    if (result.userId.toString() !== req.user._id.toString()) {
      req.flash("error", "Unauthorized access.");
      return res.redirect("/student/results");
    }

    res.render('students/result-detail', {
      user: req.user,
      result
    });

  } catch (err) {
    console.error("Get result by id error:", err);
    req.flash("error", "Could not load result.");
    res.redirect("/student/results");
  }
};