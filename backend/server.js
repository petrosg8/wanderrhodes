// Local development Express server used to mirror the serverless function
import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import chatHandler from './chatHandler.js';
import { getPlacePhoto } from './tools/google.js';

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

app.get('/api/place-photo', async (req, res) => {
  const { query } = req.query;

  if (!query) {
    return res.status(400).json({ error: 'Query parameter is required' });
  }

  try {
    const placeData = await getPlacePhoto(query);
    if (placeData) {
      res.json(placeData);
    } else {
      res.status(404).json({ error: 'Photo not found for the given query' });
    }
  } catch (error) {
    console.error('Error fetching place photo:', error);
    res.status(500).json({ error: 'Failed to fetch place photo' });
  }
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`🔌 API server listening on http://localhost:${PORT}`);
});
