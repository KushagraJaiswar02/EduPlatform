const Forum = require('../models/Forum');

exports.getForum = async (req, res) => {
  const forum = await Forum.find({ classRef: req.user.classRef })
    .populate('askedBy')
    .populate('answers.answeredBy');
  res.render('forum/forum', { forum });
};

exports.postQuestion = async (req, res) => {
  await Forum.create({
    classRef: req.user.classRef,
    subject: req.body.subject,
    question: req.body.question,
    askedBy: req.user._id
  });
  res.redirect('/forum');
};

exports.postAnswer = async (req, res) => {
  const forumPost = await Forum.findById(req.params.id);
  forumPost.answers.push({
    text: req.body.text,
    answeredBy: req.user._id
  });
  await forumPost.save();
  res.redirect('/forum');
};
