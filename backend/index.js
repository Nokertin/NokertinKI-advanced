const express = require('express');
const fetch = require('node-fetch');
const cors = require('cors');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json({ limit: '8mb' }));

const GEMINI_KEY = process.env.GEMINI_API_KEY;

app.post('/api/chat', async (req, res) => {
  try {
    const { messages } = req.body || {};
    if (!messages || !Array.isArray(messages)) return res.status(400).json({ error: 'messages array required' });
    if (!GEMINI_KEY) return res.json({ reply: 'Demo mode: no GEMINI_API_KEY set.' });

    const geminiMessages = messages.map(m => ({ author: m.role === 'user' ? 'user' : 'assistant', content: m.content }));

    const response = await fetch('https://gemini.api.google.com/v1beta2/models/gemma_27b:generateMessage', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${GEMINI_KEY}`
      },
      body: JSON.stringify({ prompt: { messages: geminiMessages }, temperature: 0.7, maxOutputTokens: 1000 })
    });

    if (!response.ok) {
      const text = await response.text();
      return res.status(response.status).send(text);
    }

    const data = await response.json();
    const reply = data?.candidates?.[0]?.content?.[0]?.text || 'Error: empty response';
    res.json({ reply });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

const port = process.env.PORT || 3000;
app.listen(port, () => console.log(`Backend listening on port ${port}`));