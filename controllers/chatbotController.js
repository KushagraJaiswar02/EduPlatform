const { GoogleGenAI } = require('@google/genai');

// The SDK automatically looks for GEMINI_API_KEY in environment variables.
// Ensure you have run 'npm install @google/genai' and added GEMINI_API_KEY to .env
const ai = new GoogleGenAI({}); 

const activeChatSessions = new Map();

const systemInstruction = `You are EduBot, a friendly and informative assistant for the EduBridge Kids educational platform. 
Your primary goal is to help young students, teachers, and platform administrators with educational questions, 
platform queries, or fun facts. Keep your answers concise, encouraging, and strictly appropriate for all ages.`;

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

// Ensure the functions are exported using module.exports.functionName
module.exports.sendMessage = async (req, res) => {
  const { message } = req.body;
  const userId = req.session && req.session.userId;
  
  if (!userId) {
    return res.status(401).json({ error: 'Authentication required to use the chatbot.' });
  }

  if (!message || message.trim() === '') {
    return res.status(400).json({ error: 'Message content cannot be empty.' });
  }

  try {
    const chat = getOrCreateChat(userId);

    const response = await chat.sendMessage({ message });

    res.json({ reply: response.text });
  } catch (err) {
    console.error('❌ Gemini API Error:', err);
    res.status(500).json({ error: 'Sorry, EduBot ran into a temporary issue. Please try again.' });
  }
};

module.exports.clearChat = (req, res) => {
    if (req.session && req.session.userId) {
        activeChatSessions.delete(req.session.userId);
        res.status(200).json({ message: "Chat history cleared." });
    } else {
        res.status(401).json({ error: 'Authentication required.' });
    }
}