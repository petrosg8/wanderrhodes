import chatHandler from '../backend/chatHandler.js';

// Vercel style serverless function entry
export default async function handler(req, res) {
  await chatHandler(req, res);
}
