/**
 * Backend для Gemini Gemma 27B
 * POST /api/chat
 * Body: { messages: [{role, content}, ...] }
 * Возвращает: { reply: "текст ответа модели" }
 */

const express = require('express');
const fetch = require('node-fetch');
const cors = require('cors');
require('dotenv').config();

const app = express();
app.use(cors({ origin: '*'}));
app.use(express.json({ limit: '8mb' }));

app.get('/health', (req,res)=>res.json({status:'ok'}));

const GEMINI_KEY = process.env.GEMINI_API_KEY;

if (!GEMINI_KEY) {
  console.warn('⚠️ GEMINI_API_KEY не найден. Сервер будет работать в демонстрационном режиме.');
}

app.post('/api/chat', async (req, res) => {
  try {
    const { messages } = req.body || {};
    if (!messages || !Array.isArray(messages)) return res.status(400).json({ error: 'messages array required' });

    if (!GEMINI_KEY) {
      // Demo fallback: эхо-бот
      const last = messages.slice().reverse().find(m => m.role === 'user');
      const txt = last ? `Демо-ответ: я получил ваше сообщение — "${String(last.content).slice(0, 400)}"` : 'Демо-ответ: нет сообщений.';
      return res.json({ reply: txt });
    }

    // Преобразуем frontend-сообщения в формат Gemini
    const geminiMessages = messages.map(m => ({
      author: m.role === 'user' ? 'user' : 'assistant',
      content: m.content
    }));

    // POST-запрос к Gemini Responses API
    const response = await fetch('https://generativelanguage.googleapis.com/v1beta/models/gemma-3-27b:generateMessage', {
      method: 'POST',
      headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${GEMINI_KEY}`
      },
      body: JSON.stringify({
      prompt: {
        messages: geminiMessages
      },
      temperature: 0.7,
      maxOutputTokens: 1000
      })
    });

    if (!response.ok) {
      const text = await response.text();
      return res.status(response.status).send(text);
    }

    const data = await response.json();
    // Предполагаем, что ответ в data.candidates[0].content[0].text
    const reply = data?.candidates?.[0]?.content?.[0]?.text || 'Ошибка: пустой ответ от модели.';
    res.json({ reply });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

const port = process.env.PORT || 3000;
app.listen(port, () => console.log(`✅ Backend Gemini Gemma 27B слушает порт ${port}`));
