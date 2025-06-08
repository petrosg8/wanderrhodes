import OpenAI from 'openai';
import { execFile } from 'child_process';
import { promisify } from 'util';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

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

  // Retrieve relevant context from the embedded knowledge base
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

  const systemPrompt = {
    role: 'system',
    content: `
You are Wander Rhodes, Rhodes’s official luxury AI concierge.
Ask the user where on Rhodes they’re staying, then ask 1–3 preference questions (beach vs sights, foodie vs fine dining, etc.).
Once you have location & preferences, give a 2–3 sentence recommendation + one “Pro tip.”
If off-topic, reply: “I’m sorry, I can only provide information about Rhodes Island.”
    `.trim()
  };

  const messages = [
    systemPrompt,
    { role: 'system', content: `Context:\n${context}` },
    ...history,
    { role: 'user', content: prompt }
  ];

  // ── DEBUG: print the assembled messages array before sending to OpenAI ──
  console.log('🔶 OpenAI prompt messages:', JSON.stringify(messages, null, 2));

  try {
    const completion = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages,
      max_tokens: 150,
      temperature: 0.6
    });

    const reply = completion.choices?.[0]?.message?.content?.trim() || '';
    if (!reply) {
      console.warn('Empty reply from OpenAI');
      return res.status(502).json({ error: 'Empty response from AI' });
    }

    return res.status(200).json({ reply });
  } catch (err) {
    console.error('OpenAI error:', err);
    return res.status(500).json({ error: 'OpenAI request failed' });
  }
}
