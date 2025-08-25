import React, { useState } from 'react'

const API_URL = 'https://nokertinki-advanced1.onrender.com';

export default function App() {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [input, setInput] = useState('')
  const [messages, setMessages] = useState([])
  const [sending, setSending] = useState(false)
  const [error, setError] = useState('')

  async function login(e) {
    e.preventDefault()
    setError('')
    try {
      const res = await fetch(`${API_URL}/api/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ username, password })
      })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data.message || 'Ошибка входа')
      }
      setIsLoggedIn(true)
    } catch (err) {
      setError(err.message)
    }
  }

  async function send() {
    if (!input.trim()) return
    const userMsg = { role: 'user', content: input }
    setMessages(prev => [...prev, userMsg])
    setInput('')
    setSending(true)
    try {
      const res = await fetch(`${API_URL}/api/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ message: userMsg.content })
      })
      const contentType = res.headers.get('content-type') || ''
      if (!res.ok) {
        const errText = contentType.includes('application/json') ? JSON.stringify(await res.json()) : await res.text()
        throw new Error(errText || `HTTP ${res.status}`)
      }
      const data = contentType.includes('application/json') ? await res.json() : { reply: await res.text() }
      setMessages(prev => [...prev, { role: 'assistant', content: data.reply }])
    } catch (err) {
      setMessages(prev => [...prev, { role: 'assistant', content: 'Ошибка: ' + err.message }])
    } finally {
      setSending(false)
    }
  }

  function onKey(e) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      send()
    }
  }

  return (
    <div className="max-w-4xl mx-auto p-4 md:p-8">
      <header className="flex items-center justify-between mb-6">
        <h1 className="text-xl md:text-2xl font-semibold tracking-tight">Чат с ИИ</h1>
        <span className="text-sm text-muted">{isLoggedIn ? 'Вход выполнен' : 'Требуется вход'}</span>
      </header>

      {!isLoggedIn ? (
        <div className="bg-card rounded-xl p-6 md:p-8 shadow border border-neutral-800 max-w-md">
          <h2 className="text-lg font-medium mb-4">Войти</h2>
          <form className="space-y-3" onSubmit={login}>
            <input className="w-full bg-neutral-900 border border-neutral-700 rounded px-3 py-2 outline-none"
              placeholder="Логин" value={username} onChange={e=>setUsername(e.target.value)} />
            <input className="w-full bg-neutral-900 border border-neutral-700 rounded px-3 py-2 outline-none"
              type="password" placeholder="Пароль" value={password} onChange={e=>setPassword(e.target.value)} />
            <button className="w-full bg-white/10 hover:bg-white/20 transition rounded px-3 py-2">Войти</button>
            {error && <p className="text-red-400 text-sm">{error}</p>}
            <p className="text-muted text-xs">Демо доступ: <b>admin / admin</b></p>
          </form>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="bg-card rounded-xl border border-neutral-800 p-4 h-[50vh] overflow-y-auto">
            {messages.length === 0 && (
              <p className="text-muted text-sm">Напишите что‑нибудь внизу…</p>
            )}
            {messages.map((m, i) => (
              <div key={i} className="mb-3">
                <div className="text-xs uppercase tracking-wide text-muted">{m.role === 'user' ? 'Вы' : 'ИИ'}</div>
                <div className="whitespace-pre-wrap">{m.content}</div>
              </div>
            ))}
            {sending && <div className="text-muted text-sm">Отправка…</div>}
          </div>

          <div className="flex gap-2">
            <textarea
              value={input}
              onChange={(e)=>setInput(e.target.value)}
              onKeyDown={onKey}
              rows={2}
              className="flex-1 bg-neutral-900 border border-neutral-700 rounded px-3 py-2 outline-none resize-none"
              placeholder="Введите сообщение и нажмите Enter"
            />
            <button onClick={send} disabled={sending}
              className="bg-white/10 hover:bg-white/20 disabled:opacity-50 transition rounded px-4">
              Отправить
            </button>
          </div>
        </div>
      )}
    </div>
  )
}