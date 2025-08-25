import express from "express";
import cors from "cors";
import bodyParser from "body-parser";
import session from "express-session";
import { GoogleGenerativeAI } from "@google/genai";

const app = express();
const port = process.env.PORT || 5000;

// CORS с поддержкой сессий
app.use(cors({
  origin: true,
  credentials: true
}));
app.use(bodyParser.json());

// Сессии
app.use(session({
  secret: "supersecretkey",
  resave: false,
  saveUninitialized: false,
  cookie: { secure: false } // можно true при https
}));

const client = new GoogleGenerativeAI({
  apiKey: process.env.GEMINI_API_KEY,
});

// --- Авторизация ---
app.post("/api/login", (req, res) => {
  const { username, password } = req.body;

  if (username === "admin" && password === "admin") {
    req.session.user = "admin";
    return res.json({ success: true });
  }

  res.status(401).json({ success: false, message: "Неверный логин или пароль" });
});

// --- Проверка авторизации ---
function requireAuth(req, res, next) {
  if (req.session.user === "admin") return next();
  return res.status(401).json({ error: "Не авторизован" });
}

// --- Чат только для авторизованных ---
app.post("/api/chat", requireAuth, async (req, res) => {
  try {
    const { message, messages } = req.body;

    let text = message;
    if (!text && Array.isArray(messages) && messages.length) {
      text = messages.map(m => `${m.role}: ${m.content}`).join("\n");
    }

    if (!text) {
      return res.status(400).json({ error: "Message is required" });
    }

    const model = client.getGenerativeModel({ model: "gemma-3-12b-it" });

    const result = await model.generateContent({
      contents: [{ role: "user", parts: [{ text }] }],
    });

    const reply = result.response.text();
    res.json({ reply });

  } catch (error) {
    console.error("Gemma API error:", error);
    res.status(500).json({
      error: error.message || "Internal server error",
    });
  }
});

app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});
