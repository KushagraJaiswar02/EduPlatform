const { GoogleGenAI } = require('@google/genai');
const mongoose = require('mongoose'); // Mongoose import karein (ID validation ke liye)
const User = require('../models/User'); // User model
const Lesson = require('../models/Lesson'); // Lesson model
const Quiz = require('../models/Quiz'); // Quiz model

// The SDK automatically looks for GEMINI_API_KEY in environment variables.
const ai = new GoogleGenAI({}); 

const activeChatSessions = new Map();

const systemInstruction = `You are EduBot, a friendly and informative assistant for the EduBridge Kids educational platform. 
Your primary goal is to help young students, teachers, and platform administrators with educational questions and navigating the app.
Keep your answers concise, encouraging, and strictly appropriate for all ages.

Here is the structure of the EduBridge Kids platform:

**General (For Everyone):**
* **Home ('/')**: The main homepage.
* **Forum ('/forum')**: A place to ask questions and see answers from others. Users can filter questions by class.
* **Ask a Doubt ('/forum/ask')**: A form for students and teachers to post new questions to the forum.
* **Login ('/login')**: Page to log in.
* **Register ('/register')**: Page to create a new account.
* **Logout ('/logout')**: Link to log out.

**Student Features (under '/student'):**
* **Student Dashboard ('/student/dashboard')**: The student's main page. It shows their stats like quizzes taken and average score. It also has quick links to "Ask a Doubt", "Lessons", and "Take a Quiz".
* **Lessons ('/student/lessons')**: A page listing all lessons available for the student's class.
* **View Lesson ('/student/lesson/:id')**: Shows the content of a single lesson, including any videos or resources.
* **Quizzes ('/student/quizzes')**: Lists all available quizzes for the student.
* **Take Quiz ('/student/quiz/:quizId')**: The page where a student can answer questions and submit a quiz.
* **My Results ('/student/results')**: A list of all quizzes the student has completed and their scores.
* **Result Detail ('/student/results/:id')**: Shows a detailed breakdown of a single quiz result.

**Teacher Features (under '/teacher'):**
* **Teacher Dashboard ('/teacher/dashboard')**: The teacher's main page. They can see their profile, classes they teach, and "Quick Actions".
* **Add New Lesson**: From the dashboard, teachers can add new lessons for their classes.
* **Create Quiz**: From the dashboard, teachers can create a new quiz and link it to one of their lessons.
* **My Quizzes ('/teacher/quizzes')**: Shows a list of all quizzes created by that teacher.
* **View Results ('/teacher/results')**: Allows teachers to see the quiz results submitted by students in their classes.

**Admin Features (under '/admin'):**
* **Admin Dashboard ('/admin/dashboard')**: The main control panel for admins.
* **Manage Users ('/admin/users')**: A page to view all registered users.
* **Manage Classes ('/admin/classes')**: A page to view all classes and assign teachers to subjects.

When a user asks "How do I..." or "Where can I...", use this context to guide them to the correct page or feature.
**IMPORTANT:** You will also receive [User Context] and [Page Context] before the user's message. Use this *specific* context to give personalized recommendations. 
For example, if the user's score is low, suggest revision. If they are on a specific lesson page, answer questions about *that* lesson.`;


function getOrCreateChat(userId) {
  if (activeChatSessions.has(userId)) {
    return activeChatSessions.get(userId);
  }

  const model = "gemini-2.5-flash"; 
  
  const chat = ai.chats.create({
    model,
    config: {
        systemInstruction: systemInstruction
    }
  });
  
  activeChatSessions.set(userId, chat);
  return chat;
}

// ===========================================
// NAYA SENDMESSAGE FUNCTION (POORA REPLACE KAREIN)
// ===========================================
module.exports.sendMessage = async (req, res) => {
  // Naya: 'message' aur 'currentURL' dono ko body se lein
  const { message, currentURL } = req.body;
  const userId = req.session && req.session.userId;
  
  if (!userId) {
    return res.status(401).json({ error: 'Authentication required to use the chatbot.' });
  }

  if (!message || message.trim() === '') {
    return res.status(400).json({ error: 'Message content cannot be empty.' });
  }

  try {
    let contextualPrefix = ""; // Context ke liye ek empty string banayein

    // --- Step 1: User Data Context Fetch karein ---
    const user = await User.findById(userId).populate('classRef');
    if (user) {
      contextualPrefix += `[User Context: The user is ${user.name}, a ${user.role}.`;
      if (user.role === 'student') {
        contextualPrefix += ` They are in Class ${user.classRef ? user.classRef.classNumber : 'N/A'}. Their profile shows ${user.profile.totalQuizzesTaken} quizzes taken with an average score of ${user.profile.averageScore}%.`;
      }
      contextualPrefix += "]\n";
    }

    // --- Step 2: Page Content Context Fetch karein ---
    if (currentURL) {
      try {
        const url = new URL(currentURL);
        const pathSegments = url.pathname.split('/').filter(Boolean); // e.g., ['student', 'lesson', '60b...']
        
        // Agar user '/student/lesson/:id' page par hai
        if (pathSegments[0] === 'student' && pathSegments[1] === 'lesson' && pathSegments[2] && mongoose.Types.ObjectId.isValid(pathSegments[2])) {
          const lesson = await Lesson.findById(pathSegments[2]).select('title subject content');
          if (lesson) {
            // Content ko chhota rakhein taaki token limit cross na ho
            const snippet = lesson.content.substring(0, 500); 
            contextualPrefix += `[Page Context: The user is currently viewing the lesson "${lesson.title}" (Subject: ${lesson.subject}). Lesson content snippet: "${snippet}..."]\n`;
          }
        }
        // Agar user '/student/quiz/:id' page par hai
        else if (pathSegments[0] === 'student' && pathSegments[1] === 'quiz' && pathSegments[2] && mongoose.Types.ObjectId.isValid(pathSegments[2])) {
          const quiz = await Quiz.findById(pathSegments[2]).populate('lessonId', 'title');
          if (quiz) {
            contextualPrefix += `[Page Context: The user is currently on the quiz page for "${quiz.lessonId.title}". The quiz has ${quiz.questions.length} questions.]\n`;
          }
        }
        // Agar user '/student/dashboard' par hai
        else if (pathSegments[0] === 'student' && pathSegments[1] === 'dashboard') {
             contextualPrefix += `[Page Context: The user is currently on their Student Dashboard.]\n`;
        }
        
      } catch (e) {
        console.warn("Could not parse URL or fetch page context:", e.message);
      }
    }

    // --- Step 3: Final Message Banayein ---
    // Context ko user ke main message ke aage jodein
    const finalMessage = `${contextualPrefix}\n[User's Message]: ${message}`;
    
    // Debugging ke liye server console par log karein (optional)
    // console.log("Sending to AI:", finalMessage);

    const chat = getOrCreateChat(userId);
    const response = await chat.sendMessage({ message: finalMessage });

    res.json({ reply: response.text });

  } catch (err) {
    console.error('❌ Gemini API Error:', err);
    res.status(500).json({ error: 'Sorry, EduBot ran into a temporary issue. Please try again.' });
  }
};
// ===========================================
// END NAYA SENDMESSAGE FUNCTION
// ===========================================


module.exports.clearChat = (req, res) => {
    if (req.session && req.session.userId) {
        activeChatSessions.delete(req.session.userId);
        res.status(200).json({ message: "Chat history cleared." });
    } else {
        res.status(401).json({ error: 'Authentication required.' });
    }
}