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
  console.log("hellooooooo", req.body);

  const { email, password } = req.body;

  const user = await User.findOne({ email });

  if (!user) {
    req.flash("error", "User not found! Please check your email.");
    return res.redirect('/login');
  }

  console.log("FOUND USER:", user);

  const match = await user.matchPassword(password);

  if (!match) {
    req.flash("error", "Incorrect password! Please try again.");
    return res.redirect('/login');
  }

  console.log("PASSWORD MATCHED");

  req.session.userId = user._id;
  req.session.role = user.role;

  req.flash("success", `Welcome back, ${user.name}!`);
  console.log("LOGGED IN USER:", user);

  if (user.role === 'teacher') {
    req.flash("success", "Logged in as Teacher");
    return res.redirect('/teacher/dashboard');
  }

  if (user.role === 'admin') {
    req.flash("success", "Logged in as Admin");
    return res.redirect('/admin/dashboard');
  }

  req.flash("success", "Logged in as Student");
  return res.redirect('/student/dashboard');
};


exports.logoutUser = (req, res) => {
  req.session.destroy(() => {
    res.redirect('/login');
  });
};
