// chatHandler.js
import OpenAI from 'openai';
import { execFile } from 'child_process';
import { promisify } from 'util';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';
import { getNearbyPlaces, getTravelTime } from './tools/maps.js';

const execFileAsync = promisify(execFile);
const __dirname = dirname(fileURLToPath(import.meta.url));

export default async function chatHandler(req, res) {
  // Only POST
  if (req.method && req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).end('Method Not Allowed');
  }
  if (!process.env.OPENAI_API_KEY) {
    console.error('Missing OPENAI_API_KEY');
    return res.status(500).json({ error: 'Server misconfiguration' });
  }

  const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  const { history = [], prompt } = req.body;

  // 1) Retrieve RAG context
  let context = '';
  try {
    const { stdout } = await execFileAsync('python3', [
      join(__dirname, 'rag_retrieve.py'), prompt, '3'
    ]);
    const docs = JSON.parse(stdout);
    context = docs.map(d => d.text).join('\n---\n');
    console.log('🔍 Retrieved docs:', docs);
  } catch (err) {
    console.error('Retrieval error:', err);
  }

  // 2) Prepare system prompt and initial messages
  const systemPrompt = {
    role: 'system',
    content: `
You are RhodesGuide, an expert local concierge and travel planner for Rhodes Island.
First, gather user details via clarifying questions (dates, location, preferences).
Then, plan a personalized itinerary respecting opening hours and travel times.
You have two tools:
- getNearbyPlaces(lat, lng, radius, type)
- getTravelTime(origin, destination, mode)

Workflow:
1. Ask clarifying questions until user details are complete.
2. Think step-by-step; when live data is needed, emit a function_call.
3. Execute the tool, append results, and continue the loop.
4. Once ready, produce a final JSON answer.

Begin by asking any missing details.
    `.trim()
  };

  const messages = [
    systemPrompt,
    { role: 'system', content: `Context:\n${context}` },
    ...history,
    { role: 'user', content: prompt }
  ];

  console.log('🔶 Prompt messages:', JSON.stringify(messages, null, 2));

  // 3) Define function schemas
  const functions = [
    {
      name: 'getNearbyPlaces',
      description: 'Find nearby places by coordinates',
      parameters: { type: 'object', properties: { lat:{type:'number'}, lng:{type:'number'}, radius:{type:'integer'}, type:{type:'string'} }, required:['lat','lng'] }
    },
    {
      name: 'getTravelTime',
      description: 'Get travel time between locations',
      parameters: { type:'object', properties:{ origin:{type:'string'}, destination:{type:'string'}, mode:{type:'string'} }, required:['origin','destination'] }
    }
  ];

  let finalReply = null;
  let iteration = 0;

  // 4) Loop for function calls and reasoning
  while (iteration < 10) {
    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages,
      functions,
      function_call: 'auto',
      temperature: 0.2,
      max_tokens: 700
    });
    const msg = response.choices[0].message;

    // If requesting a tool, invoke and loop
    if (msg.function_call) {
      const { name, arguments: argsJson } = msg.function_call;
      const args = JSON.parse(argsJson);
      console.log(`🔧 Calling tool ${name}`, args);
      let toolResult = [];
      if (name === 'getNearbyPlaces') toolResult = await getNearbyPlaces(args);
      if (name === 'getTravelTime')  toolResult = await getTravelTime(args);
      console.log(`🛠️ Tool ${name} returned`, toolResult);
      messages.push(msg);
      messages.push({ role: 'function', name, content: JSON.stringify(toolResult) });
      iteration += 1;
      continue;
    }

    // Non-function reply: treat as response
    finalReply = msg.content.trim();
    break;
  }

  // 5) Determine if finalReply is JSON (final answer) or plain text (clarification)
  let output;
  if (finalReply && finalReply.startsWith('{')) {
    try {
      output = JSON.parse(finalReply);
    } catch (e) {
      console.error('JSON parse error:', e);
      output = { final_answer: finalReply };
    }
  } else {
    // Clarifying question or plain text
    output = { reply: finalReply };
  }

  // 6) Return JSON to client
  return res.status(200).json(output);
}
