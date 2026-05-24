export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { prompt, temperature = 0.75, apiKey, provider = 'gemini' } = req.body;
  if (!prompt) return res.status(400).json({ error: 'Prompt required' });
  if (!apiKey)  return res.status(400).json({ error: 'API key required' });

  try {
    let text = '', tokens = 0;

    if (provider === 'openai') {
      // ── OpenAI ──────────────────────────────────────
      const r = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${apiKey}` },
        body: JSON.stringify({
          model: 'gpt-4o-mini',
          messages: [{ role: 'user', content: prompt }],
          max_tokens: 4000,
          temperature,
        }),
      });
      const d = await r.json();
      if (!r.ok) return res.status(r.status).json({ error: d.error?.message || 'OpenAI Error' });
      text   = d.choices?.[0]?.message?.content || '';
      tokens = d.usage?.total_tokens || 0;

    } else {
      // ── Gemini ──────────────────────────────────────
      const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`;
      const r = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: { temperature, maxOutputTokens: 8192 },
          safetySettings: [
            { category: 'HARM_CATEGORY_HARASSMENT',        threshold: 'BLOCK_NONE' },
            { category: 'HARM_CATEGORY_HATE_SPEECH',       threshold: 'BLOCK_NONE' },
            { category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT', threshold: 'BLOCK_NONE' },
            { category: 'HARM_CATEGORY_DANGEROUS_CONTENT', threshold: 'BLOCK_NONE' },
          ],
        }),
      });
      const d = await r.json();
      if (!r.ok) return res.status(r.status).json({ error: d.error?.message || 'Gemini Error' });
      text   = d.candidates?.[0]?.content?.parts?.[0]?.text || '';
      tokens = d.usageMetadata?.totalTokenCount || 0;
    }

    return res.status(200).json({ text, tokens });

  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
}
