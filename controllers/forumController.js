const Forum = require('../models/Forum');
const Class = require('../models/Class');


exports.getNewQuestionForm = (req, res) => {
  try {
    // If teacher, provide list of classes they teach so they can choose target class
    if (req.user && req.user.role === 'teacher') {
      Class.find({ 'subjects.teacher': req.user._id })
        .then(classes => res.render('forum/doubt', { pageTitle: 'Post a New Doubt', classes }))
        .catch(err => {
          console.error('Error fetching teacher classes:', err);
          res.render('forum/doubt', { pageTitle: 'Post a New Doubt', classes: [] });
        });
      return;
    }

    // For students or others, render form; students will have classRef set on server when posting
    res.render('forum/doubt', { pageTitle: 'Post a New Doubt', classes: [] });
  } catch (err) {
    console.error('Error rendering new doubt form:', err);
    res.render('forum/doubt', { pageTitle: 'Post a New Doubt', classes: [] });
  }
};

exports.getForum = async (req, res) => {
  try {
    if (!req.user) {
      req.flash('error', 'Please log in to view the forum.');
      return res.render('forum/forum', { forum: [] });
    }

    // Build list of class IDs the current user belongs to or teaches
    let classIds = [];
    if (req.user.role === 'student') {
      if (req.user.classRef) classIds.push(req.user.classRef);
    } else if (req.user.role === 'teacher') {
      const classes = await Class.find({ 'subjects.teacher': req.user._id }).select('_id');
      classIds = classes.map(c => c._id);
    } else if (req.user.role === 'admin') {
      // admin: show all posts
      classIds = null;
    }

    if (classIds && classIds.length === 0) {
      req.flash('info', 'No forum posts available for your classes.');
      return res.render('forum/forum', { forum: [] });
    }

    const query = classIds ? { classRef: { $in: classIds } } : {};
    const forum = await Forum.find(query)
      .populate('askedBy')
      .populate('answers.answeredBy')
      .populate('classRef');
    res.render('forum/forum', { forum });
  } catch (err) {
    console.error('Error fetching forum posts:', err);
    req.flash('error', 'Could not load forum posts.');
    res.render('forum/forum', { forum: [] });
  }
};

exports.postQuestion = async (req, res) => {
  try {
    if (!req.user) {
      req.flash('error', 'Please log in to post a doubt.');
      return res.redirect('/forum/ask');
    }

    // Support two possible form shapes:
    // 1) req.body.subject & req.body.question
    // 2) req.body.forum = { title, description, tags }
  let subject = req.body.subject;
  let question = req.body.question;
  let tags = [];
  let targetClassId = req.body.classId || null;

    if (!subject && !question && req.body.forum) {
      subject = req.body.forum.title;
      question = req.body.forum.description;
      if (req.body.forum.tags) {
        // allow comma separated tags or array
        if (Array.isArray(req.body.forum.tags)) tags = req.body.forum.tags;
        else tags = String(req.body.forum.tags).split(',').map(t => t.trim()).filter(Boolean);
      }
    }

    // parse flat tags field if present (comma separated)
    if (!tags.length && req.body.tags) {
      if (Array.isArray(req.body.tags)) tags = req.body.tags;
      else tags = String(req.body.tags).split(',').map(t => t.trim()).filter(Boolean);
    }

    // If fields are still missing, show an error
    if (!subject || !question) {
      req.flash('error', 'Please provide a subject and a detailed question.');
      return res.redirect('/forum/ask');
    }

    // Determine classRef: priority -> explicit classId (teacher), then user's classRef
    let classRef = null;
    if (targetClassId) classRef = targetClassId;
    else if (req.user.classRef) classRef = req.user.classRef;

    if (!classRef) {
      req.flash('error', 'Please select a target class for this doubt.');
      return res.redirect('/forum/ask');
    }

    await Forum.create({
      classRef,
      subject,
      question,
      tags,
      askedBy: req.user._id
    });

    req.flash('success', 'Doubt posted successfully.');
    res.redirect('/forum');
  } catch (err) {
    console.error('Error posting question:', err);
    req.flash('error', 'Could not post your doubt.');
    res.redirect('/forum/ask');
  }
};

exports.postAnswer = async (req, res) => {
  try {
    const forumPost = await Forum.findById(req.params.id);
    if (!forumPost) {
      req.flash('error', 'Forum post not found.');
      return res.redirect('/forum');
    }

    forumPost.answers.push({
      text: req.body.text,
      answeredBy: req.user._id
    });
    await forumPost.save();
    req.flash('success', 'Answer posted.');
    res.redirect('/forum');
  } catch (err) {
    console.error('Error posting answer:', err);
    req.flash('error', 'Could not post your answer.');
    res.redirect('/forum');
  }
};