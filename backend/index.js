import express from "express";
import cors from "cors";
import bodyParser from "body-parser";
import session from "express-session";
import dotenv from "dotenv";
import { GoogleGenerativeAI } from "@google/generative-ai";

dotenv.config();

const app = express();
const port = process.env.PORT || 5000;

app.use(cors({
  origin: true,
  credentials: true
}));
app.use(bodyParser.json());
app.use(session({
  secret: "supersecretkey",
  resave: false,
  saveUninitialized: false,
  cookie: { secure: false }
}));

const client = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// Авторизация
app.post("/api/login", (req, res) => {
  const { username, password } = req.body;
  if (username === "admin" && password === "admin") {
    req.session.user = "admin";
    return res.json({ success: true });
  }
  res.status(401).json({ success: false, message: "Неверный логин или пароль" });
});

// Middleware проверки авторизации
function requireAuth(req, res, next) {
  if (req.session.user === "admin") return next();
  return res.status(401).json({ error: "Не авторизован" });
}

// Обработка чата
app.post("/api/chat", requireAuth, async (req, res) => {
  try {
    const { message } = req.body;
    if (!message) {
      return res.status(400).json({ error: "Message is required" });
    }

    const model = client.getGenerativeModel({ model: "gemma-3-12b-it" });

    const result = await model.generateContent({
      contents: [{ role: "user", parts: [{ text: message }] }]
    });

    res.json({ reply: result.response.text() });
  } catch (error) {
    console.error("Gemma API error:", error);
    res.status(500).json({ error: error.message || "Internal server error" });
  }
});

app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});