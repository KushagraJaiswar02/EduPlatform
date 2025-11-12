// app.js
require('dotenv').config();
const express = require('express');
const path = require('path');
const mongoose = require('mongoose');
const ejsMate = require('ejs-mate');
const session = require('express-session');
const flash = require('connect-flash');
const methodOverride = require('method-override');
const compression = require('compression');
const i18n = require('i18n');

const app = express();

// ====== CONFIG ======
mongoose.connect(process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/edubridgeKids')
  .then(() => console.log('✅ MongoDB Connected'))
  .catch(err => console.error('❌ Mongo Error:', err));

app.engine('ejs', ejsMate);
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(methodOverride('_method'));
app.use(compression());
app.use(express.static(path.join(__dirname, 'public')));

// ====== i18n Setup ======
i18n.configure({
  locales: ['en', 'hi'],
  directory: path.join(__dirname, '/locales'),
  defaultLocale: 'en',
  cookie: 'lang'
});
app.use(i18n.init);

// ====== Session & Flash ======
const sessionConfig = {
  secret: process.env.SESSION_SECRET || 'supersecret',
  resave: false,
  saveUninitialized: false,
  cookie: { maxAge: 1000 * 60 * 60 * 24 } // 1 day
};
app.use(session(sessionConfig));
app.use(flash());

// ====== Global Middleware ======
app.use((req, res, next) => {
  res.locals.success = req.flash('success');
  res.locals.error = req.flash('error');
  res.locals.__ = res.__;
  next();
});

// ====== ROUTES ======
const authRoutes = require('./routes/authRoutes');
const studentRoutes = require('./routes/studentRoutes');
const teacherRoutes = require('./routes/teacherRoutes');
const forumRoutes = require('./routes/forumRoutes');

app.use('/', authRoutes);
app.use('/student', studentRoutes);
app.use('/teacher', teacherRoutes);
app.use('/forum', forumRoutes);

// Offline fallback
app.get('/offline', (req, res) => {
  res.render('offline');
});

// ====== ROOT ======
app.get('/', (req, res) => {
  res.render('home');
});

// ====== SERVER ======
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`🚀 Server running on http://localhost:${PORT}`));
