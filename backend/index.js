import express from "express";
import cors from "cors";
import session from "express-session";
import bodyParser from "body-parser";
import fetch from "node-fetch";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// URL фронтенда
const FRONTEND_URL = "https://nokertinki-advanced-1.onrender.com";

// Middleware
app.use(cors({
  origin: FRONTEND_URL,
  credentials: true // Разрешаем куки между фронтом и бэком
}));

app.use(bodyParser.json());

app.use(session({
  secret: "supersecretkey", // Лучше вынести в .env
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: true,         // Render работает по HTTPS → обязательно
    sameSite: "none",     // Нужно для междоменных cookie
    maxAge: 1000 * 60 * 60 * 12 // 12 часов
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

// Чат с ИИ
app.post("/api/chat", async (req, res) => {
  if (!req.session.user) {
    return res.status(401).json({ error: "Не авторизован" });
  }

  const { message } = req.body;

  try {
    // Здесь можно подключить реальную ИИ-модель
    const reply = Эхо-ответ: ${message};
    res.json({ reply });
  } catch (error) {
    console.error("Ошибка чата:", error);
    res.status(500).json({ error: "Ошибка на сервере" });
  }
});

// Выход из аккаунта
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