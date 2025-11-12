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
const i18n = require('i18n');

// ROUTES
const authRoutes = require('./routes/authRoutes');
const studentRoutes = require('./routes/studentRoutes');
const teacherRoutes = require('./routes/teacherRoutes');
const forumRoutes = require('./routes/forumRoutes');
const adminRoutes = require('./routes/adminRoutes');

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

app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(methodOverride('_method'));
app.use(compression());
app.use(express.static(path.join(__dirname, 'public')));

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
app.use((req, res, next) => {
  res.locals.success = req.flash('success');
  res.locals.error = req.flash('error');
  res.locals.__ = res.__;
  res.locals.currentUser = req.session.userId || null;
  res.locals.role = req.session.role || null;
  next();
});

// ==========================
// ROUTES
// ==========================
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
app.all('*', (req, res) => {
  res.status(404).render('error', { message: 'Page Not Found' });
});

// ==========================
// Start Server
// ==========================
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`🚀 EduBridge Kids running on http://localhost:${PORT}`));
