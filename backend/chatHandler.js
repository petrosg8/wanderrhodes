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
      join(__dirname, 'rag_retrieve.py'),
      prompt,
      '3'
    ]);
    const docs = JSON.parse(stdout);
    console.log('🔍 Retrieved docs:', docs);
    context = docs.map(d => d.text).join('\n---\n');
  } catch (err) {
    console.error('Retrieval error:', err);
  }

  // 2) Build base messages
  const systemPrompt = {
    role: 'system',
    content: `
    You are RhodesGuide, an expert local concierge for Rhodes Island.
    You know Rhodes inside out—geography, history, beaches, villages, hotels, restaurants, transport, culture, events and hidden gems.
    You can plan multi-day itineraries that respect opening hours, distances, and traveler preferences.
    
    You have two tools available:
    1. getNearbyPlaces(lat: number, lng: number, radius?: integer, type?: string)
       - Returns an array of places (name, address, rating, plus_code, place_id) near the given coordinates.
    2. getTravelTime(origin: string, destination: string, mode?: string)
       - Returns {distance_m, duration_s} between two addresses or place_ids.
    
    Whenever you need live location data (e.g. “What restaurants are within 1 km of Faliraki Beach?”), call getNearbyPlaces.  
    Whenever you need to compute travel durations or distances, call getTravelTime.
    
    Always ground your answers in the CONTEXT provided. If the CONTEXT doesn’t cover something, say “I don’t have that info.”  
    When planning, think step by step and show your chain of thought in the reasoning section.
    
    **RESPONSE FORMAT (must follow exactly):**
    1. **Clarifying questions** (or “None needed”)
    2. **Reasoning steps** (numbered)
    3. **Answer or itinerary**, referencing tool calls like [Tool: getNearbyPlaces] or [Tool: getTravelTime]
    4. **Pro tip**
    
    System will supply:
    - A “Context:” chunk from static knowledge base (if any)
    - User's final prompt
    
    User will respond with travel questions or general Rhodes queries.  
    Now, await the user's question.  
    
    `.trim()
  };

  const messages = [
    systemPrompt,
    { role: 'system', content: `Context:\n${context}` },
    ...history,
    { role: 'user', content: prompt }
  ];

  console.log('🔶 OpenAI prompt messages:', JSON.stringify(messages, null, 2));

  // 3) Define your tools for Function Calling
  const functions = [
    {
      name: 'getNearbyPlaces',
      description: 'Find places near a lat/lng on Rhodes (e.g. restaurants, hotels)',
      parameters: {
        type: 'object',
        properties: {
          lat:      { type: 'number', description: 'Latitude' },
          lng:      { type: 'number', description: 'Longitude' },
          radius:   { type: 'integer', description: 'Search radius in meters' },
          type:     { type: 'string',  description: 'Place type, e.g. restaurant, museum' }
        },
        required: ['lat', 'lng']
      }
    },
    {
      name: 'getTravelTime',
      description: 'Compute travel time between two locations',
      parameters: {
        type: 'object',
        properties: {
          origin:      { type: 'string', description: 'Address or place_id' },
          destination: { type: 'string', description: 'Address or place_id' },
          mode:        { type: 'string', description: 'driving, walking, transit, bicycling' }
        },
        required: ['origin', 'destination']
      }
    }
  ];

  // 4) First LLM call: let it decide if it needs a tool
  let response = await openai.chat.completions.create({
    model: 'gpt-4o-mini',    // or gpt-3.5-turbo-0613
    messages,
    functions,
    function_call: 'auto',
    temperature: 0.2,
    max_tokens: 500
  });

  const message = response.choices[0].message;

  // 5) If it wants a tool, invoke and then feed back
  if (message.function_call) {
    const { name, arguments: argsJson } = message.function_call;
    const args = JSON.parse(argsJson);
    let toolResult;

    if (name === 'getNearbyPlaces') {
      toolResult = await getNearbyPlaces(args);
    } else if (name === 'getTravelTime') {
      toolResult = await getTravelTime(args);
    }

    messages.push(message);
    messages.push({
      role: 'function',
      name,
      content: JSON.stringify(toolResult)
    });

    response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages,
      temperature: 0.2,
      max_tokens: 500
    });
  }

  const reply = response.choices[0].message.content.trim();
  return res.status(200).json({ reply });
}
