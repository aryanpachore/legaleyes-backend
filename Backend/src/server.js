import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';
import path from 'path';                     // <-- ADDED: For file paths
import { fileURLToPath } from 'url';         // <-- ADDED: For ES module paths
import { connectDB, sequelize } from './config/database.js';
import authRoutes from './routes/auth.routes.js';
import documentRoutes from './routes/document.routes.js';
import chatRoutes from './routes/chat.routes.js';
import magicRoutes from './routes/magic.routes.js';

dotenv.config();

// <-- ADDED: ES Module trick to recreate __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
// 🐛 FIX: Use the web server PORT, not the database port!
const PORT = process.env.PORT || 10000;

// <-- UPDATED: Relaxed Helmet so localhost:5173 can load PDFs in an iframe
app.use(helmet({
  crossOriginResourcePolicy: false,
  contentSecurityPolicy: false, 
  frameguard: false // <-- THIS is the correct modern syntax to allow iframes!
}));

app.use(cors());
app.use(express.json());

// <-- ADDED: Serve the uploads folder publicly
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

app.use('/api/auth', authRoutes);
app.use('/api/documents', documentRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/magic', magicRoutes);

app.get('/api/health', (req, res) => {
  res.status(200).json({ status: 'ok', message: 'LegalEyes API is running' });
});

app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Something went wrong!' });
});

const startServer = async () => {
  try {
    await connectDB();
    
    await sequelize.sync();
    console.log('✅ Database Synced');

    // 🐛 FIX: Added '0.0.0.0' to explicitly bind the server for Render
    app.listen(PORT, '0.0.0.0', () => {
      console.log(`🚀 Server is running on port ${PORT}`);
    });
  } catch (error) {
    console.error('❌ Failed to start server:', error);
  }
};

startServer();