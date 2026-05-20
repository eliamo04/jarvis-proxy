// api/chat.js — Vercel Serverless Function
// هاد السيرفر يستقبل طلباتك ويرسلها لـ OpenAI بدلاً عنك
// يشتغل من أي دولة بدون حجب

export default async function handler(req, res) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { prompt, temperature = 0.75, apiKey } = req.body;

  if (!prompt) {
    return res.status(400).json({ error: 'Prompt is required' });
  }

  // استخدم المفتاح من البيئة أو من الطلب
  const key = process.env.OPENAI_API_KEY || apiKey;

  if (!key) {
    return res.status(400).json({ error: 'API key required' });
  }

  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${key}`,
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [{ role: 'user', content: prompt }],
        max_tokens: 4000,
        temperature,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      return res.status(response.status).json({ error: error.error?.message || 'API Error' });
    }

    const data = await response.json();
    const text = data.choices?.[0]?.message?.content || '';
    const tokens = data.usage?.total_tokens || 0;

    return res.status(200).json({ text, tokens });

  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
}
