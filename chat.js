export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { prompt, temperature = 0.75, apiKey } = req.body;
  if (!prompt) return res.status(400).json({ error: 'Prompt required' });

  const key = process.env.OPENAI_API_KEY || apiKey;
  if (!key) return res.status(400).json({ error: 'API key required' });

  const r = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${key}` },
    body: JSON.stringify({
      model: 'gpt-4o-mini',
      messages: [{ role: 'user', content: prompt }],
      max_tokens: 4000,
      temperature,
    }),
  });

  const data = await r.json();
  if (!r.ok) return res.status(r.status).json({ error: data.error?.message || 'Error' });

  return res.status(200).json({
    text: data.choices?.[0]?.message?.content || '',
    tokens: data.usage?.total_tokens || 0,
  });
}
