import OpenAI from "openai";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).end("Method Not Allowed");
  }
  
  const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  const { history = [], prompt } = req.body;

  // your strict Rhodes system prompt
  const systemPrompt = {
    role: "system",
    content: `
You are Wander Rhodes, Rhodes’s official luxury AI concierge.
Ask the user where on Rhodes they’re staying, then ask 1–3 preference questions (beach vs sights, foodie vs fine dining, etc.).
Once you have location & preferences, give a 2–3 sentence recommendation + one “Pro tip.”
If off-topic, reply: “I’m sorry, I can only provide information about Rhodes Island.”
    `.trim()
  };

  const messages = [ systemPrompt, ...history, { role: "user", content: prompt } ];

  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages,
      max_tokens: 150,
      temperature: 0.6
    });

    const reply = completion.choices[0].message.content.trim();
    return res.status(200).json({ reply });

  } catch (err) {
    console.error("OpenAI error:", err);
    return res.status(500).json({ error: "OpenAI request failed" });
  }
}
