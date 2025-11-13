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

// Initialize app
const app = express();

// ==========================
// Database Connection
// ==========================
mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true
})
  .then(() => console.log('✅ MongoDB Atlas Connected'))
  .catch(err => console.error('❌ Mongo Connection Error:', err));

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
// Start Server
// ==========================
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`🚀 EduBridge Kids running on http://localhost:${PORT}`));
