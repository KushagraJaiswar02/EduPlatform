const Lesson = require('../models/Lesson');
const User = require('../models/User');

exports.getDashboard = async (req, res) => {
  const unapprovedLessons = await Lesson.find({ approvedBy: { $exists: false } }).populate('uploadedBy');
  const user = await req.user.populate('classRef');

  res.render('admin/dashboard', { unapprovedLessons, user: user });
};

exports.approveLesson = async (req, res) => {
  const lesson = await Lesson.findById(req.params.id);
  lesson.approvedBy = req.user._id;
  await lesson.save();
  req.flash('success', 'Lesson approved successfully.');
  res.redirect('/admin/dashboard');
};

exports.manageUsers = async (req, res) => {
  const users = await User.find();
  res.render('admin/users', { users });
};
