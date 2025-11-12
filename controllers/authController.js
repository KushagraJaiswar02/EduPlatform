const User = require('../models/User');
const Class = require('../models/Class');
const bcrypt = require('bcryptjs');

exports.getRegister = async (req, res) => {
  const classes = await Class.find().sort({ classNumber: 1 });
  res.render('auth/register', { classes });
};
exports.getLogin = (req, res) => res.render('auth/login');

exports.registerUser = async (req, res) => {
  try {
    const { name, email, password, role, classNumber } = req.body;
    const existingUser = await User.findOne({ email });
    if (existingUser) return res.redirect('/login');

    let classRef = null;
    if (role === 'student' && classNumber) {
      const foundClass = await Class.findOne({ classNumber });
      classRef = foundClass?._id;
    }

    const user = new User({ name, email, password, role, classRef });
    await user.save();

    req.session.userId = user._id;
    req.flash('success', 'Welcome to EduBridge Kids!');
    res.redirect('/');
  } catch (err) {
    console.error(err);
    res.redirect('/register');
  }
};

exports.loginUser = async (req, res) => {
  const { email, password } = req.body;
  const user = await User.findOne({ email });
  if (!user) return res.redirect('/login');

  const match = await user.matchPassword(password);
  if (!match) return res.redirect('/login');

  req.session.userId = user._id;
  req.session.role = user.role;
  req.flash('success', `Welcome back, ${user.name}`);
  if (user.role === 'teacher') return res.redirect('/teacher/dashboard');
  if (user.role === 'admin') return res.redirect('/admin/dashboard');
  res.redirect('/student/dashboard');
};

exports.logoutUser = (req, res) => {
  req.session.destroy(() => {
    res.redirect('/login');
  });
};
