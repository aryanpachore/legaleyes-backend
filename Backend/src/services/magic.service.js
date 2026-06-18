import Groq from 'groq-sdk';
import Document from '../models/Document.js';
import dotenv from 'dotenv';

dotenv.config();

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });
const MODEL = "llama-3.3-70b-versatile";

// 1. Smart Rewrite
export const rewriteText = async (text, instruction) => {
  const prompt = `
    You are an expert legal editor.
    Task: Rewrite the following legal text based on this instruction: "${instruction}".
    
    Rules:
    - Maintain the legal validity and original meaning.
    - Output ONLY the rewritten text. Do not add quotes or conversational filler.
    
    Original Text:
    "${text}"
  `;

  const completion = await groq.chat.completions.create({
    messages: [{ role: "user", content: prompt }],
    model: MODEL,
    temperature: 0.2,
  });

  return completion.choices[0]?.message?.content || "Could not rewrite text.";
};

// 2. Clause Generator
export const generateClause = async (clauseType, context) => {
  const prompt = `
    You are a senior corporate lawyer.
    Task: Draft a standard, legally robust "${clauseType}" clause.
    Context/Details: "${context || 'Standard terms'}".
    
    Rules:
    - Output ONLY the clause text.
    - Use clear, professional legal language.
  `;

  const completion = await groq.chat.completions.create({
    messages: [{ role: "user", content: prompt }],
    model: MODEL,
    temperature: 0.3,
  });

  return completion.choices[0]?.message?.content || "Could not generate clause.";
};

// 3. Document Health Check (Analysis)
export const analyzeDocument = async (documentId) => {
  // Fetch text from DB
  const doc = await Document.findByPk(documentId);
  if (!doc || !doc.extractedText) {
    throw new Error('Document not found or text not extracted.');
  }

  const prompt = `
    You are a legal risk auditor.
    Task: Analyze the provided legal document text and identify 3-5 specific weaknesses, risks, or missing elements.
    
    IMPORTANT: Return the result as a strict JSON array of objects.
    Format:
    [
      { "severity": "High|Medium|Low", "issue": "Short title", "suggestion": "How to fix it" }
    ]

    Document Text (truncated):
    "${doc.extractedText.substring(0, 20000)}"
  `;

  const completion = await groq.chat.completions.create({
    messages: [{ role: "user", content: prompt }],
    model: MODEL,
    temperature: 0.1, // Strict JSON
  });

  // Clean and parse JSON
  let cleanJson = completion.choices[0]?.message?.content || "[]";
  cleanJson = cleanJson.replace(/```json|```/g, '').trim();
  
  try {
    return JSON.parse(cleanJson);
  } catch (e) {
    return [{ severity: "Medium", issue: "Parsing Error", suggestion: "Could not parse AI analysis." }];
  }
};