import Groq from 'groq-sdk';

// Import BOTH models directly now!
import Document from '../models/Document.js'; 
import ChatMessage from '../models/ChatMessage.js'; // <-- Check this filename!

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY
});

// ==========================================
// 1. Send Message (Document Chat)
// ==========================================
export const sendMessage = async (req, res) => {
  try {
    const { documentId, message } = req.body;
    const userId = req.user.id; 

    if (!message || !documentId) {
      return res.status(400).json({ error: "Message and documentId are required" });
    }

    // 1. Fetch the document from the database
    const document = await Document.findOne({ where: { id: documentId, userId } });

    if (!document) {
      return res.status(404).json({ error: "Document not found" });
    }

    const documentContext = document.extractedText || document.summary || "No text available for this document.";

    console.log(`Analyzing document ${documentId} for question: ${message}`);

    // 2. Call Groq
    const chatCompletion = await groq.chat.completions.create({
      messages: [
        {
          role: "system",
          content: `You are LegalEyes AI. You are assisting a user with a specific legal document. 
          Base your answers ONLY on the following document context. If the answer is not in the text, clearly state that you don't know based on the provided document.\n\n--- DOCUMENT CONTEXT ---\n${documentContext}`
        },
        {
          role: "user",
          content: message
        }
      ],
      model: "llama-3.1-8b-instant", 
      temperature: 0.2, 
      max_tokens: 1024,
    });

    const aiResponseText = chatCompletion.choices[0]?.message?.content || "Sorry, I couldn't generate a response.";

    // 3. Save the conversation to the database history (Now active!)
    await ChatMessage.create({ documentId, userId, role: 'user', content: message });
    await ChatMessage.create({ documentId, userId, role: 'ai', content: aiResponseText });

    // 4. Send back to frontend
    return res.status(200).json({ answer: aiResponseText });

  } catch (error) {
    console.error("Document Chat Error:", error);
    return res.status(500).json({ error: "Failed to process document chat" });
  }
};

// ==========================================
// 2. Get History (Document Chat)
// ==========================================
export const getHistory = async (req, res) => {
  try {
    const { documentId } = req.params;
    const userId = req.user.id;

    // Fetch previous messages for this specific document and user
    const history = await ChatMessage.findAll({
      where: { documentId, userId },
      order: [['createdAt', 'ASC']] // Oldest to newest
    });

    // Format it to match what the React frontend expects
    const formattedHistory = history.map(msg => ({
      id: msg.id,
      role: msg.role,
      content: msg.content
    }));

    return res.status(200).json(formattedHistory);
  } catch (error) {
    console.error("History Fetch Error:", error);
    return res.status(500).json({ error: "Failed to fetch chat history" });
  }
};

// ==========================================
// 3. General Chat (AI Assistant)
// ==========================================
export const generalChat = async (req, res) => {
  try {
    const userMessage = req.body.message;

    if (!userMessage) {
      return res.status(400).json({ error: "Message is required" });
    }

    console.log(`Answering text question via Groq: ${userMessage}`);
    
    const chatCompletion = await groq.chat.completions.create({
      messages: [
        {
          role: "system",
          content: "You are a helpful, professional legal AI assistant for a platform called LegalEyes. Answer general legal questions clearly and concisely. Always politely remind the user that you are an AI and this is not official legal counsel."
        },
        {
          role: "user",
          content: userMessage
        }
      ],
      model: "llama-3.1-8b-instant", 
      temperature: 0.5,
      max_tokens: 1024,
    });

    const aiResponseText = chatCompletion.choices[0]?.message?.content || "Sorry, I couldn't generate a response.";

    return res.status(200).json({ answer: aiResponseText });

  } catch (error) {
    console.error("Groq AI Error:", error);
    return res.status(500).json({ error: "Failed to process AI request" });
  }
};