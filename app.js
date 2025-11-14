// ==========================
// EduBridge Kids - Main App
// ==========================

require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const path = require('path');
const ejsMate = require('ejs-mate');
const session = require('express-session');
const flash = require('connect-flash');
const methodOverride = require('method-override');
const compression = require('compression');
const cookieParser = require('cookie-parser');
const i18n = require('i18n');

// ROUTES
const authRoutes = require('./routes/auth');
const studentRoutes = require('./routes/student');
const teacherRoutes = require('./routes/teacher');
const forumRoutes = require('./routes/forum');
const adminRoutes = require('./routes/admin');
const chatbotRoutes = require('./routes/chatbot');


// Initialize app
const app = express();

// ==========================
// Database Connection (try primary then fallback)
// ==========================
async function connectWithFallback() {
  const mainUri = process.env.MONGO_URI;
  const fallbackUri = process.env.LOCAL_MONGO_URI || 'mongodb://127.0.0.1:27017/eduplatform';

  const commonOpts = {
    // Let the driver use sensible defaults; set a short server selection timeout
    serverSelectionTimeoutMS: 5000
  };

  if (mainUri) {
    try {
      await mongoose.connect(mainUri, commonOpts);
      console.log('✅ MongoDB connected to primary URI');
      return;
    } catch (err) {
      console.error('❌ Mongo primary connection failed:', err && err.message ? err.message : err);
      console.warn('Attempting to connect to local MongoDB fallback...');
    }
  } else {
    console.warn('No MONGO_URI provided in environment; attempting local fallback.');
  }

  try {
    await mongoose.connect(fallbackUri, commonOpts);
    console.log('✅ MongoDB connected to fallback (local) URI');
  } catch (err) {
    console.error('❌ Mongo fallback connection failed:', err && err.message ? err.message : err);
    console.error('The app will continue to run but database-dependent features will fail until MongoDB is available.');
  }
}

// start connection process (non-blocking)
connectWithFallback();

// ==========================
// App Configuration
// ==========================
app.engine('ejs', ejsMate);
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

app.use(express.urlencoded({ extended: true }));i18n.co
app.use(express.json());
app.use(methodOverride('_method'));
app.use(compression());
app.use(express.static(path.join(__dirname, 'public')));


app.use(cookieParser());

// ==========================
// i18n Setup (Multilingual Support)
// ==========================
i18n.configure({
  locales: ['en', 'hi'],
  directory: path.join(__dirname, '/locales'),
  defaultLocale: 'en',
  cookie: 'lang'
});
app.use(i18n.init);

// ==========================
// Session + Flash Config
// ==========================
const sessionConfig = {
  secret: process.env.SESSION_SECRET || 'supersecret',
  resave: false,
  saveUninitialized: false,
  cookie: {
    httpOnly: true,
    maxAge: 1000 * 60 * 60 * 24 // 1 day
  }
};
app.use(session(sessionConfig));
app.use(flash());

// ==========================
// Middleware for Globals
// ==========================
const User = require('./models/User');

app.use(async (req, res, next) => {
  res.locals.success = req.flash('success');
  res.locals.error = req.flash('error');
  res.locals.__ = res.__;
  res.locals.role = req.session.role || null;
  res.locals.currentLocale = req.getLocale();

  // Populate the full user object (with classRef) so views can access class data
  try {
    if (req.session && req.session.userId) {
      const user = await User.findById(req.session.userId).populate('classRef');
      res.locals.currentUser = user || null;
    } else {
      res.locals.currentUser = null;
    }
  } catch (err) {
    console.error('Error loading current user for views:', err);
    res.locals.currentUser = null;
  }
  next();
});

// ==========================
// ROUTES
// ==========================
// Language switching route
app.get('/setLang/:lang', (req, res) => {
  const lang = req.params.lang;
  if (['en', 'hi'].includes(lang)) {
    res.cookie('lang', lang, { maxAge: 1000 * 60 * 60 * 24 * 365 }); // 1 year
    i18n.setLocale(lang);
  }
  res.redirect(req.header('Referer') || '/');
});

app.use('/', authRoutes);
app.use('/student', studentRoutes);
app.use('/teacher', teacherRoutes);
app.use('/forum', forumRoutes);
app.use('/admin', adminRoutes);
app.use('/chatbot', chatbotRoutes);


// ==========================
// OFFLINE + DEFAULT ROUTES
// ==========================
app.get('/offline', (req, res) => res.render('offline'));

// Home Route
app.get('/', (req, res) => {
  res.render('home');
});

// ==========================
// 404 Handler
// ==========================
app.use((req, res) => {
  res.status(404).render('error', { message: 'Page Not Found' });
});


// ==========================
// Start Server + Socket.IO
// ==========================
const http = require('http');
const { Server } = require('socket.io');
const Lesson = require('./models/Lesson');

const PORT = process.env.PORT || 4000;

// create http server so we can attach socket.io
const server = http.createServer(app);
const io = new Server(server);

// make io available to routes/controllers if needed
app.set('io', io);

io.on('connection', (socket) => {
  // join a lesson room
  socket.on('joinLesson', ({ lessonId }) => {
    if (!lessonId) return;
    const room = `lesson-${lessonId}`;
    socket.join(room);
    // optional: emit current live state to the joiner
    Lesson.findById(lessonId).then(lesson => {
      if (lesson && lesson.live && typeof lesson.live.active !== 'undefined') {
        socket.emit('lesson:status', { lessonId, active: !!lesson.live.active });
      }
    }).catch(() => {});
  });

  // teacher toggles live state for a lesson
  socket.on('lesson:toggle', async ({ lessonId, active }) => {
    if (!lessonId) return;
    try {
      // persist new active state
      const updated = await Lesson.findByIdAndUpdate(lessonId, { 'live.active': !!active }, { new: true });
      const payload = { lessonId, active: !!active, meetingUrl: updated && updated.live ? updated.live.meetingUrl : null };
      // broadcast to all clients in lesson room
      io.to(`lesson-${lessonId}`).emit('lesson:status', payload);
      // also emit to the requesting socket in case it hasn't joined the room
      socket.emit('lesson:status', payload);
    } catch (err) {
      console.error('Error toggling lesson live state:', err);
      socket.emit('lesson:toggle:error', { message: 'Could not update lesson state' });
    }
  });

  socket.on('disconnect', () => {
    // nothing for now
  });
});

server.listen(PORT, () => console.log(`🚀 EduBridge Kids running on http://localhost:${PORT}`));
