// Backend proxy for AI chat
// Usage:
// - create .env with OPENAI_API_KEY=sk-...
// - npm install
// - npm start
//
// Receives POST /api/chat with JSON { messages: [{role:'user'|'assistant'|'system', content: '...'}, ...] }
// Returns JSON { reply: 'assistant text' }
// If OPENAI_API_KEY is missing, returns a demo echo response.

const express = require('express');
const fetch = require('node-fetch');
const cors = require('cors');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json({ limit: '10mb' }));

const OPENAI_KEY = process.env.OPENAI_API_KEY;
const PORT = process.env.PORT || 3000;

app.get('/api/ping', (req, res) => {
  res.json({ ok: true, hasKey: !!OPENAI_KEY });
});

app.post('/api/chat', async (req, res) => {
  try {
    const { messages } = req.body || {};
    if (!messages || !Array.isArray(messages)) {
      return res.status(400).json({ error: 'Invalid request: messages must be an array.' });
    }

    // If no API key provided, return a simple local demo reply (keeps UI unchanged)
    if (!OPENAI_KEY) {
      const lastUser = messages.slice().reverse().find(m => m.role === 'user');
      const txt = lastUser ? `Демо-ответ (без ключа): ${String(lastUser.content).slice(0, 1000)}` : 'Демо-ответ: нет сообщений.';
      return res.json({ reply: txt });
    }

    // Prepare the payload for OpenAI Chat Completions
    const payload = {
      model: process.env.OPENAI_MODEL || 'gpt-3.5-turbo',
      messages: messages.map(m => {
        // ensure content is a string
        return { role: m.role, content: (typeof m.content === 'string') ? m.content : JSON.stringify(m.content) };
      }),
      // safety: limit tokens to prevent surprises; you can tune.
      max_tokens: 1000,
      temperature: 0.7,
    };

    const r = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENAI_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    if (!r.ok) {
      const txt = await r.text();
      console.error('OpenAI API error', r.status, txt);
      // try to return the body text for debugging
      return res.status(r.status).json({ error: txt });
    }

    const data = await r.json();

    // Extract assistant reply robustly
    let reply = '';
    if (data.choices && data.choices.length > 0 && data.choices[0].message && data.choices[0].message.content) {
      reply = data.choices[0].message.content;
    } else if (data.output && data.output[0] && data.output[0].content) {
      // backup parsing for different APIs
      reply = data.output[0].content.map(c => c.text || '').join('\n');
    } else {
      reply = JSON.stringify(data);
    }

    res.json({ reply });
  } catch (err) {
    console.error('Server error', err);
    res.status(500).json({ error: err.message || String(err) });
  }
});

app.listen(PORT, () => {
  console.log(`AI chat backend listening on port ${PORT} (OPENAI_KEY=${!!OPENAI_KEY})`);
});
