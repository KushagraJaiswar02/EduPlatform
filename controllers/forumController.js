const Forum = require('../models/Forum');


exports.getNewQuestionForm = (req, res) => {
  
  res.render('forum/doubt', { pageTitle: 'Post a New Doubt' }); 
};

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
  // Successful post ke baad, user ko forum main page par redirect kar dega
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