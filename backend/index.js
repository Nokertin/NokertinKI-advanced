// Backend proxy for AI chat with sanitization and robust fallback
const express = require('express');
const fetch = require('node-fetch');
const cors = require('cors');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json({ limit: '20mb' }));

const OPENAI_KEY = process.env.OPENAI_API_KEY;
const PORT = process.env.PORT || 3000;
const DEFAULT_MODEL = process.env.OPENAI_MODEL || 'gpt-3.5-turbo';

app.get('/api/ping', (req, res) => {
  res.json({ ok: true, hasKey: !!OPENAI_KEY, model: DEFAULT_MODEL });
});

function sanitizeMessages(messages){
  if(!Array.isArray(messages)) return [];
  const allowedRoles = new Set(['system','user','assistant']);
  return messages.map(m=>{
    let role = (m && m.role && String(m.role)) || 'user';
    role = allowedRoles.has(role) ? role : 'user';
    let content = '';
    if(m && typeof m.content === 'string') content = m.content;
    else if(m && m.content != null) content = String(m.content);
    // remove huge base64/image data from content
    if(content.startsWith('data:')) {
      content = '[Изображение опущено]';
    }
    // truncate content to reasonable length to avoid API validation issues
    if(content.length > 30000) content = content.slice(0,30000) + '...[truncated]';
    return { role, content };
  });
}

app.post('/api/chat', async (req, res) => {
  try {
    const { messages } = req.body || {};
    if(!messages || !Array.isArray(messages)) return res.status(400).json({ error: 'messages must be an array' });

    const sanitized = sanitizeMessages(messages);

    // If no API key provided, return a local echo/fallback reply so UI always receives response
    if(!OPENAI_KEY){
      const lastUser = [...sanitized].reverse().find(m=>m.role==='user');
      const txt = lastUser ? `Демо-ответ (без ключа): ${String(lastUser.content).slice(0,1000)}` : 'Демо-ответ: нет сообщений.';
      return res.json({ reply: txt });
    }

    // Validate model name (basic whitelist-ish check)
    const model = DEFAULT_MODEL;
    if(!/^[\w\.\-]+$/.test(model)){
      console.warn('Invalid model name, falling back to gpt-3.5-turbo');
    }

    const payload = {
      model,
      messages: sanitized,
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

    if(!r.ok){
      const txt = await r.text();
      console.error('OpenAI API returned non-ok:', r.status, txt);
      // Fallback: echo last user message instead of failing
      const lastUser = [...sanitized].reverse().find(m=>m.role==='user');
      const fallback = lastUser ? `Извините, сейчас API вернул ошибку. Повторяю ваше сообщение: ${String(lastUser.content).slice(0,1000)}` : 'Извините, сейчас API вернул ошибку.';
      return res.json({ reply: fallback });
    }

    const data = await r.json();
    let reply = '';

    if(data && data.choices && data.choices.length>0 && data.choices[0].message && data.choices[0].message.content){
      reply = data.choices[0].message.content;
    } else if(data && data.output && data.output[0] && data.output[0].content){
      reply = data.output[0].content.map(c=>c.text||'').join('\n');
    } else {
      reply = JSON.stringify(data);
    }

    res.json({ reply });
  } catch (err) {
    console.error('Server error:', err && err.stack ? err.stack : err);
    // Final fallback: echo last user message to keep chat responsive
    const { messages } = req.body || {};
    const sanitized = Array.isArray(messages) ? messages.map(m => ({ role: m.role, content: (m && m.content) ? String(m.content).slice(0,1000) : '' })) : [];
    const lastUser = [...sanitized].reverse().find(m=>m.role==='user');
    const fallback = lastUser ? `Произошла внутренняя ошибка. Повторяю ваше сообщение: ${String(lastUser.content).slice(0,1000)}` : 'Произошла внутренняя ошибка на сервере.';
    res.json({ reply: fallback });
  }
});

app.listen(PORT, ()=> console.log('AI chat backend listening on port', PORT, 'hasKey=', !!OPENAI_KEY));
