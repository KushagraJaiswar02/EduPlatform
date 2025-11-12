// const mongoose = require('mongoose');
// const dotenv = require('dotenv');
// const User = require('./models/User'); // User model ko import karein

// // --- APNI DETAILS YAHAN BADLEIN ---
// const ADMIN_EMAIL = 'yashpouranik124@gmail.com';
// const ADMIN_PASSWORD = '121212';
// const ADMIN_NAME = 'Yash Pouranik';
// // --------------------------   --------

// // .env file se configuration load karein
// dotenv.config();

// // Database connection function
// async function connectDB() {
//   const dbURI = process.env.MONGO_URI;
//   if (!dbURI) {
//     console.error('Error: MONGODB_URI environment variable not found.');
//     console.log('Please make sure you have a .env file with MONGODB_URI set.');
//     process.exit(1);
//   }

//   try {
//     await mongoose.connect(dbURI);
//     console.log('MongoDB se successfully connect ho gaye...');
//   } catch (err) {
//     console.error('MongoDB connection error:', err.message);
//     process.exit(1);
//   }
// }

// // Admin user banane ka main function
// async function createAdmin() {
//   try {
//     // 1. Database se connect karein
//     await connectDB();

//     // 2. Check karein ki user pehle se hai ya nahi
//     const existingAdmin = await User.findOne({ email: ADMIN_EMAIL });
//     if (existingAdmin) {
//       console.log(`User with email ${ADMIN_EMAIL} pehle se maujood hai.`);
//       return;
//     }

//     // 3. Naya admin user banayein
//     console.log('Naya admin user banaya ja raha hai...');
//     await User.create({
//       name: ADMIN_NAME,
//       email: ADMIN_EMAIL,
//       password: ADMIN_PASSWORD,
//       role: 'admin' // Role 'admin' set karein
//     });
    
//     // User.create() aapke User model ke 'pre-save' hook ko trigger kar dega
//     // aur password automatically hash ho jayega.

//     console.log('-----------------------------------');
//     console.log(`Admin user ${ADMIN_EMAIL} safaltapoorvak ban gaya!`);
//     console.log('-----------------------------------');

//   } catch (error) {
//     console.error('Admin user banane mein error:', error.message);
//   } finally {
//     // 4. Connection band karein
//     await mongoose.disconnect();
//     console.log('MongoDB connection band kar diya gaya.');
//   }
// }

// // Script ko run karein
// createAdmin();