// src/lib/openai.js
import { Configuration, OpenAIApi } from "openai";

const config = new Configuration({
  apiKey: import.meta.env.VITE_OPENAI_API_KEY,
});

export default new OpenAIApi(config);
