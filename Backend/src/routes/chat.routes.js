import express from 'express';
import { sendMessage, getHistory, generalChat } from '../controllers/chat.controller.js';
import { authenticateToken } from '../middlewares/auth.middleware.js';

const router = express.Router();

// --- General Text-Only Chatbot Route ---
router.post('/general', authenticateToken, generalChat);

// --- Document-specific Chat Routes ---
router.post('/', authenticateToken, sendMessage);
router.get('/:documentId', authenticateToken, getHistory);

export default router;