const Lesson = require('../models/Lesson');
const Quiz = require('../models/Quiz');
const Result = require('../models/Result');
const Class = require('../models/Class');
const cloudinary = require('cloudinary').v2;
const fs = require('fs');
const path = require('path');

// Configure Cloudinary from env (CLOUDINARY_URL or individual vars)
if (process.env.CLOUDINARY_URL) {
  cloudinary.config({ url: process.env.CLOUDINARY_URL });
} else if (process.env.CLOUDINARY_CLOUD_NAME) {
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
  });
}

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

    // normalize resources[] (can be single string or array) and convert to resource objects
    let resourcesArr = [];
    if (req.body.resources) {
      let incoming = [];
      if (Array.isArray(req.body.resources)) incoming = req.body.resources;
      else incoming = [req.body.resources];
      incoming = incoming.map(r => String(r).trim()).filter(Boolean);
      // store as objects (backwards-compatible)
      resourcesArr = incoming.map(r => ({ url: r, title: undefined, description: undefined, type: 'link', downloadable: false }));
    }

    // If a video file was uploaded via multer (memoryStorage), upload it to Cloudinary if configured,
    // otherwise save locally to public/uploads/videos so students can play/download.
    if (req.file && req.file.buffer) {
      if (cloudinary.config().cloud_name) {
        try {
          const uploadStream = () => new Promise((resolve, reject) => {
            const stream = cloudinary.uploader.upload_stream({ resource_type: 'video', folder: 'lessons' }, (error, result) => {
              if (error) return reject(error);
              resolve(result);
            });
            stream.end(req.file.buffer);
          });

          const result = await uploadStream();
          // Prepend the uploaded video resource so it's visible first
          resourcesArr.unshift({
            title: title ? title + ' — Video' : 'Lecture Video',
            url: result.secure_url || result.url,
            description: undefined,
            type: 'video',
            downloadable: true
          });
        } catch (upErr) {
          console.error('Cloudinary upload failed:', upErr);
          // carry on without failing the whole request; flash a warning
          req.flash('error', 'Video upload failed — lesson saved without video.');
        }
      } else {
        try {
          // ensure upload dir exists
          const uploadDir = path.join(__dirname, '..', 'public', 'uploads', 'videos');
          fs.mkdirSync(uploadDir, { recursive: true });
          // make a safe filename
          const safeName = `${Date.now()}-${req.file.originalname.replace(/[^a-zA-Z0-9.\-_]/g, '_')}`;
          const fullPath = path.join(uploadDir, safeName);
          fs.writeFileSync(fullPath, req.file.buffer);
          const publicUrl = `/uploads/videos/${safeName}`;
          resourcesArr.unshift({
            title: title ? title + ' — Video' : 'Lecture Video',
            url: publicUrl,
            description: undefined,
            type: 'video',
            downloadable: true
          });
          req.flash('success', 'Video saved locally and attached to the lesson.');
        } catch (fsErr) {
          console.error('Local video save failed:', fsErr);
          req.flash('error', 'Video upload failed — lesson saved without video.');
        }
      }
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

    // create lesson first
    const created = await Lesson.create({
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

    // handle live lecture option
    const liveEnabled = req.body.liveEnabled === 'on' || req.body.liveEnabled === 'true' || req.body.liveEnabled === true;
    if (liveEnabled) {
      // scheduled time (optional)
      let scheduledAt = null;
      if (req.body.liveScheduledAt) {
        const d = new Date(req.body.liveScheduledAt);
        if (!isNaN(d)) scheduledAt = d;
      }

      // Generate a Jitsi room name using lesson id for predictability
      const roomName = `eduplatform-lesson-${created._id}`;
      const meetingUrl = `https://meet.jit.si/${encodeURIComponent(roomName)}`;

      created.live = {
        enabled: true,
        meetingUrl,
        scheduledAt: scheduledAt || undefined
      };
      await created.save();
    }

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

<<<<<<< HEAD
// ===============================
// ENABLE LIVE FOR EXISTING LESSON
// ===============================
exports.enableLive = async (req, res) => {
  try {
    const lessonId = req.params.id;
    const lesson = await Lesson.findById(lessonId);
    if (!lesson) {
      req.flash('error', 'Lesson not found.');
      return res.redirect('/teacher/dashboard');
    }

    // If already has meetingUrl, just enable
    if (lesson.live && lesson.live.meetingUrl) {
      lesson.live = Object.assign({}, lesson.live, { enabled: true });
      await lesson.save();
      req.flash('success', 'Live enabled for lesson.');
      return res.redirect('/teacher/dashboard');
    }

    // Otherwise generate meeting URL and enable
    const roomName = `eduplatform-lesson-${lesson._id}`;
    const meetingUrl = `https://meet.jit.si/${encodeURIComponent(roomName)}`;
    lesson.live = Object.assign({}, lesson.live || {}, { enabled: true, meetingUrl });
    await lesson.save();
    req.flash('success', 'Live enabled for lesson.');
    return res.redirect('/teacher/dashboard');
  } catch (err) {
    console.error('Enable Live Error:', err);
    req.flash('error', 'Could not enable live for this lesson.');
    return res.redirect('/teacher/dashboard');
  }
};
=======

exports.getResults = async (req, res) => {
  try {
    // 1) find classes where this teacher appears in subjects (adjust to your Class schema)
    const classes = await Class.find({ 'subjects.teacher': req.user._id }).select('_id classNumber');

    if (!classes || classes.length === 0) {
      req.flash('info', 'You are not assigned to any classes yet.');
      return res.render('teachers/results', { results: [], classes: [] , filterClass: null });
    }

    const classIds = classes.map(c => c._id);

    // 2) lessons that belong to these classes
    const lessons = await Lesson.find({ classRef: { $in: classIds } }).select('_id title classRef');

    const lessonIds = lessons.map(l => l._id);

    // 3) quizzes that refer to those lessons
    const quizzes = await Quiz.find({ lessonId: { $in: lessonIds } }).select('_id lessonId');

    const quizIds = quizzes.map(q => q._id);

    // 4) results for these quizzes
    const results = await Result.find({ quizId: { $in: quizIds } })
      .populate({
        path: 'quizId',
        populate: { path: 'lessonId', select: 'title classRef' }
      })
      .populate('userId', 'name email classRef')
      .sort({ createdAt: -1 });

    res.render('teachers/results', {
      results,
      classes,
      filterClass: null
    });

  } catch (err) {
    console.error('Teacher getResults error:', err);
    req.flash('error', 'Could not load results.');
    return res.redirect('/teacher/dashboard');
  }
};

exports.getResultDetail = async (req, res) => {
  try {
    // 1) find classes teacher handles
    const classes = await Class.find({ 'subjects.teacher': req.user._id }).select('_id');
    const classIds = classes.map(c => c._id.toString());

    // 2) load the result with nested populates
    const result = await Result.findById(req.params.id)
      .populate('userId', 'name email classRef')
      .populate({
        path: 'quizId',
        populate: {
          path: 'lessonId',
          select: 'title classRef'
        }
      });

    if (!result) {
      req.flash('error', 'Result not found.');
      return res.redirect('/teacher/results');
    }

    // 3) authorization: ensure the lesson's classRef belongs to one of teacher's classes
    const lesson = result.quizId && result.quizId.lessonId;
    const lessonClassId = lesson && lesson.classRef ? lesson.classRef.toString() : null;

    if (!lessonClassId || !classIds.includes(lessonClassId)) {
      req.flash('error', 'You are not authorized to view this result.');
      return res.redirect('/teacher/results');
    }

    // 4) render detail view
    res.render('teachers/result-detail', {
      result,
      classes
    });

  } catch (err) {
    console.error('Teacher getResultDetail error:', err);
    req.flash('error', 'Could not load result detail.');
    return res.redirect('/teacher/results');
  }
};
>>>>>>> d3631539af01fa271b3a9d9f138bc5a00f79412b
