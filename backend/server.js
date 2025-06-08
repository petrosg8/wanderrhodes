// Local development Express server used to mirror the serverless function
import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import chatHandler from './chatHandler.js';

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

if (!process.env.OPENAI_API_KEY) {
  console.error('❌ Missing OPENAI_API_KEY');
  process.exit(1);
}

// Mount the same handler as used by the serverless function
app.post('/api/chat', chatHandler);

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`🔌 API server listening on http://localhost:${PORT}`);
});
