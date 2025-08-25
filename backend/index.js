import express from "express";
import cors from "cors";
import session from "express-session";
import bodyParser from "body-parser";
import dotenv from "dotenv";
import { GoogleGenerativeAI } from "@google/generative-ai";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// URL фронтенда
const FRONTEND_URL = "https://nokertinki-advanced-1.onrender.com";

// Инициализация клиента Google AI
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// Middleware
app.use(cors({
  origin: FRONTEND_URL,
  credentials: true
}));

app.use(bodyParser.json());

app.use(session({
  secret: process.env.SESSION_SECRET || "supersecretkey",
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: true,
    sameSite: "none",
    maxAge: 1000 * 60 * 60 * 12
  }
}));

// Авторизация
app.post("/api/login", (req, res) => {
  const { username, password } = req.body;

  if (username === "admin" && password === "admin") {
    req.session.user = { username };
    return res.json({ success: true });
  }

  res.status(401).json({ error: "Неверный логин или пароль" });
});

// Проверка авторизации
app.get("/api/check-auth", (req, res) => {
  if (req.session.user) {
    return res.json({ authenticated: true });
  }
  res.json({ authenticated: false });
});

// Чат с ИИ (Gemma 3 12B)
app.post("/api/chat", async (req, res) => {
  if (!req.session.user) {
    return res.status(401).json({ error: "Не авторизован" });
  }

  const { message } = req.body;

  try {
    const model = genAI.getGenerativeModel({ model: "gemma-3-12b-it" });

    const result = await model.generateContent(message);
    const reply = result.response.text();

    res.json({ reply });
  } catch (error) {
    console.error("Ошибка чата:", error);
    res.status(500).json({ error: "Ошибка на сервере" });
  }
});

// Выход
app.post("/api/logout", (req, res) => {
  req.session.destroy(() => {
    res.clearCookie("connect.sid");
    res.json({ success: true });
  });
});

// Старт сервера
app.listen(PORT, () => {
  console.log(`✅ Сервер запущен: http://localhost:${PORT}`);
});
