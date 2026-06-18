import express from 'express';
import { rewrite, generate, analyze } from '../controllers/magic.controller.js';
import { authenticateToken } from '../middlewares/auth.middleware.js';

const router = express.Router();

// All routes protected by JWT
router.post('/rewrite', authenticateToken, rewrite);
router.post('/generate', authenticateToken, generate);
router.post('/analyze', authenticateToken, analyze);

export default router;