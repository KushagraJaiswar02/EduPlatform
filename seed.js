// Seed script to create sample data for testing
require('dotenv').config();
const mongoose = require('mongoose');

const User = require('./models/User');
const Class = require('./models/Class');
const Forum = require('./models/Forum');

const seedDB = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });
    console.log('✅ Connected to MongoDB');

    // Clear existing data (optional, comment out to keep old data)
    // await User.deleteMany({});
    // await Class.deleteMany({});
    // await Forum.deleteMany({});

    // Create Classes
    const classes = await Class.insertMany([
      { classNumber: 1, subjects: [] },
      { classNumber: 2, subjects: [] },
      { classNumber: 3, subjects: [] }
    ]);
    console.log('✅ Created classes');

    // Create Admin User
    const admin = await User.create({
      name: 'Admin User',
      email: 'admin@example.com',
      password: 'password123',
      role: 'admin'
    });
    console.log('✅ Created admin user:', admin.email);

    // Create Teacher Users
    const teacher1 = await User.create({
      name: 'Mr. Sharma',
      email: 'sharma@example.com',
      password: 'password123',
      role: 'teacher'
    });

    const teacher2 = await User.create({
      name: 'Mrs. Gupta',
      email: 'gupta@example.com',
      password: 'password123',
      role: 'teacher'
    });
    console.log('✅ Created teacher users');

    // Add subjects to classes with teachers
    await Class.findByIdAndUpdate(classes[0]._id, {
      subjects: [
        { name: 'Mathematics', teacher: teacher1._id },
        { name: 'English', teacher: teacher2._id }
      ]
    });

    await Class.findByIdAndUpdate(classes[1]._id, {
      subjects: [
        { name: 'Science', teacher: teacher1._id },
        { name: 'History', teacher: teacher2._id }
      ]
    });

    await Class.findByIdAndUpdate(classes[2]._id, {
      subjects: [
        { name: 'Computer Science', teacher: teacher1._id }
      ]
    });
    console.log('✅ Added subjects to classes');

    // Create Student Users
    const student1 = await User.create({
      name: 'Aman Kumar',
      email: 'aman@example.com',
      password: 'password123',
      role: 'student',
      classRef: classes[0]._id,
      profile: { totalQuizzesTaken: 5, averageScore: 78 }
    });

    const student2 = await User.create({
      name: 'Priya Singh',
      email: 'priya@example.com',
      password: 'password123',
      role: 'student',
      classRef: classes[1]._id,
      profile: { totalQuizzesTaken: 3, averageScore: 85 }
    });

    const student3 = await User.create({
      name: 'Raj Patel',
      email: 'raj@example.com',
      password: 'password123',
      role: 'student',
      classRef: classes[2]._id,
      profile: { totalQuizzesTaken: 7, averageScore: 92 }
    });
    console.log('✅ Created student users');

    // Create sample Forum posts
    const forum1 = await Forum.create({
      classRef: classes[0]._id,
      subject: 'How to solve quadratic equations?',
      question: 'I am struggling with solving quadratic equations. Can someone explain the factorization method?',
      tags: ['mathematics', 'algebra', 'equations'],
      askedBy: student1._id,
      answers: [
        {
          text: 'You can use the quadratic formula: x = (-b ± √(b² - 4ac)) / 2a. This works for all quadratic equations!',
          answeredBy: teacher1._id
        },
        {
          text: 'Factorization is easier when the equation can be written as (x + p)(x + q) = 0. Try finding two numbers that multiply to c and add to b.',
          answeredBy: student2._id
        }
      ]
    });

    const forum2 = await Forum.create({
      classRef: classes[1]._id,
      subject: 'What is photosynthesis?',
      question: 'Can someone explain the light-dependent and light-independent reactions in photosynthesis?',
      tags: ['science', 'biology', 'photosynthesis'],
      askedBy: student2._id,
      answers: [
        {
          text: 'Light-dependent reactions occur in the thylakoid and produce ATP and NADPH. Light-independent reactions (Calvin cycle) occur in the stroma and use ATP/NADPH to fix CO2.',
          answeredBy: teacher1._id
        }
      ]
    });

    const forum3 = await Forum.create({
      classRef: classes[2]._id,
      subject: 'How to debug JavaScript code?',
      question: 'What are the best practices and tools for debugging JavaScript applications?',
      tags: ['javascript', 'debugging', 'development'],
      askedBy: student3._id,
      answers: []
    });
    console.log('✅ Created sample forum posts');

    console.log('\n🎉 Database seeding complete!');
    console.log('\nTest credentials:');
    console.log('Admin: admin@example.com / password123');
    console.log('Teacher: sharma@example.com / password123');
    console.log('Student: aman@example.com / password123');
    console.log('Student: priya@example.com / password123');
    console.log('Student: raj@example.com / password123');

    await mongoose.connection.close();
    process.exit(0);
  } catch (err) {
    console.error('❌ Seeding error:', err);
    process.exit(1);
  }
};

seedDB();
