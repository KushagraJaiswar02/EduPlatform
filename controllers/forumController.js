const Forum = require('../models/Forum');
const Class = require('../models/Class');

// ===============================
// NEW DOUBT FORM
// ===============================
exports.getNewQuestionForm = async (req, res) => {
  try {
    let classes = [];

    if (req.user.role === 'teacher') {
      classes = await Class.find({ "subjects.teacher": req.user._id });
    }

    res.render('forum/doubt', {
      pageTitle: 'Post a New Doubt',
      classes
    });

  } catch (err) {
    console.error(err);
    res.render('forum/doubt', { pageTitle: 'Post a New Doubt', classes: [] });
  }
};

// ===============================
// GET FORUM WITH CLASS FILTER
// ===============================
exports.getForum = async (req, res) => {
  try {
    if (!req.user) {
      req.flash('error', 'Please log in to view the forum.');
      return res.render('forum/forum', { forum: [], classes: [], selectedClass: null });
    }

    // class filter via query ?class=ID
    const selectedClass = req.query.class || null;

    // Build accessible classes for the current user
    let userClasses = [];

    if (req.user.role === 'student') {
      if (req.user.classRef) userClasses = [req.user.classRef];
    }

    if (req.user.role === 'teacher') {
      const clsDocs = await Class.find({ "subjects.teacher": req.user._id });
      userClasses = clsDocs.map(c => c._id);
    }

    if (req.user.role === 'admin') {
      userClasses = null; // admin sees all
    }

    // Class filter logic
    let query = {};

    if (userClasses && userClasses.length > 0) {
      query.classRef = { $in: userClasses };
    }

    if (selectedClass) {
      query.classRef = selectedClass;
    }

    // Fetch forum posts + populate relations
    const forum = await Forum.find(query)
      .populate("askedBy", "name role")
      .populate("answers.answeredBy", "name role")
      .populate("classRef", "classNumber");

    // All classes for dropdown
    const allClasses = await Class.find({}, "classNumber");

    res.render('forum/forum', {
      forum,
      classes: allClasses,
      selectedClass
    });

  } catch (err) {
    console.error("Error fetching forum:", err);
    req.flash('error', 'Could not load forum posts.');
    res.render('forum/forum', { forum: [], classes: [], selectedClass: null });
  }
};

// ===============================
// POST NEW QUESTION
// ===============================
exports.postQuestion = async (req, res) => {
  try {
    if (!req.user) {
      req.flash('error', 'Please log in to post a doubt.');
      return res.redirect('/forum/ask');
    }

    const { subject, question, classId, tags } = req.body;

    if (!subject || !question) {
      req.flash('error', 'Please fill all fields.');
      return res.redirect('/forum/ask');
    }

    let classRef = null;

    // Teachers pick class manually
    if (req.user.role === 'teacher' && classId) {
      classRef = classId;
    }

    // Students get class automatically
    if (req.user.role === 'student') {
      classRef = req.user.classRef;
    }

    if (!classRef) {
      req.flash('error', 'No class assigned to this question.');
      return res.redirect('/forum/ask');
    }

    await Forum.create({
      subject,
      question,
      tags: tags ? tags.split(',').map(t => t.trim()) : [],
      classRef,
      askedBy: req.user._id
    });

    req.flash('success', 'Your doubt has been posted.');
    res.redirect('/forum');

  } catch (err) {
    console.error("Error posting question:", err);
    req.flash('error', 'Something went wrong.');
    res.redirect('/forum/ask');
  }
};

// ===============================
// POST ANSWER
// ===============================
exports.postAnswer = async (req, res) => {
  try {
    const forumPost = await Forum.findById(req.params.id);

    if (!forumPost) {
      req.flash('error', 'This post no longer exists.');
      return res.redirect('/forum');
    }

    forumPost.answers.push({
      text: req.body.text,
      answeredBy: req.user._id
    });

    await forumPost.save();

    req.flash('success', 'Answer added.');
    res.redirect('/forum');

  } catch (err) {
    console.error("Error posting answer:", err);
    req.flash('error', 'Could not post your answer.');
    res.redirect('/forum');
  }
};
