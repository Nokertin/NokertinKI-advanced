import React, { useState } from "react";

export default function App() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [message, setMessage] = useState("");
  const [chat, setChat] = useState([]);
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();
    const res = await fetch("/api/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, password }),
      credentials: "include"
    });
    if (res.ok) {
      setIsLoggedIn(true);
    } else {
      alert("Неверный логин или пароль");
    }
  };

  const sendMessage = async (e) => {
    e.preventDefault();
    if (!message.trim()) return;
    setLoading(true);
    const res = await fetch("/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message }),
      credentials: "include"
    });
    const data = await res.json();
    setChat([...chat, { role: "user", text: message }, { role: "bot", text: data.reply }]);
    setMessage("");
    setLoading(false);
  };

  if (!isLoggedIn) {
    return (
      <div style={{ maxWidth: 400, margin: "50px auto", padding: 20, border: "1px solid #ccc" }}>
        <h2>Вход</h2>
        <form onSubmit={handleLogin}>
          <input
            placeholder="Логин"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            style={{ width: "100%", marginBottom: 10 }}
          />
          <input
            placeholder="Пароль"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            style={{ width: "100%", marginBottom: 10 }}
          />
          <button type="submit">Войти</button>
        </form>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: 600, margin: "20px auto" }}>
      <h1>Чат с ИИ</h1>
      <div style={{ border: "1px solid #ccc", padding: 10, minHeight: 300, marginBottom: 10 }}>
        {chat.map((c, i) => (
          <p key={i}><b>{c.role}:</b> {c.text}</p>
        ))}
      </div>
      <form onSubmit={sendMessage}>
        <input
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="Введите сообщение"
          style={{ width: "80%" }}
        />
        <button type="submit" disabled={loading}>
          {loading ? "Отправка..." : "Отправить"}
        </button>
      </form>
    </div>
  );
}