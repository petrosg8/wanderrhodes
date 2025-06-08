# WanderRhodes

This project provides a small React frontend and an OpenAI-backed API that acts as a concierge for visitors to Rhodes.

## Development

### Frontend

Run the Vite dev server:

```bash
npm run dev
```

### API

For local development, start the Express API which mirrors the serverless function:

```bash
npm run start-api
```

Both the local server and the Vercel serverless function use the same handler located at `backend/chatHandler.js`.

Ensure that the environment variable `OPENAI_API_KEY` is set before starting the API.
