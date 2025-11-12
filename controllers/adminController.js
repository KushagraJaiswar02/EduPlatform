const Class = require('../models/Class');
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

exports.getClasses = async (req, res) => {
  try {
    // Classes aur unke subjects mein jo teacher hain, unhe populate karein
    const classes = await Class.find().populate('subjects.teacher');
    
    // Sabhi teachers ki list nikalein
    const teachers = await User.find({ role: 'teacher' });
    
    res.render('admin/classes', {
      user: req.user,
      classes,
      teachers // teachers ko view mein pass karein
    });
  } catch (err) {
    console.error(err);
    req.flash('error', 'Could not fetch classes or teachers.');
    res.redirect('/admin/dashboard');
  }
};

exports.addClass = async (req, res) => {
  try {
    const { classNumber, subjectName, subjectTeacher } = req.body;

    // Subject data ko Class model ke format mein badlein
    let subjects = [];

    if (typeof subjectName === 'string') {
      // Agar sirf ek subject add kiya hai
      if (subjectName && subjectTeacher) {
        subjects.push({ name: subjectName, teacher: subjectTeacher });
      }
    } else if (Array.isArray(subjectName)) {
      // Agar multiple subjects add kiye hain
      for (let i = 0; i < subjectName.length; i++) {
        if (subjectName[i] && subjectTeacher[i]) {
          subjects.push({ name: subjectName[i], teacher: subjectTeacher[i] });
        }
      }
    }

    // Check karein ki class pehle se hai ya nahi
    const existingClass = await Class.findOne({ classNumber });
    if (existingClass) {
      req.flash('error', `Class ${classNumber} already exists.`);
      return res.redirect('/admin/classes');
    }

    // Nayi class banayein
    await Class.create({
      classNumber,
      subjects
    });

    req.flash('success', 'Class added successfully.');
    res.redirect('/admin/classes');

  } catch (err) {
    console.error(err);
    req.flash('error', 'Error adding class.');
    res.redirect('/admin/classes');
  }
};