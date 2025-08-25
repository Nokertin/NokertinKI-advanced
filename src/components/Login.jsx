import React, {useState} from 'react'
export default function Login({onLogin}){
  const [email, setEmail] = useState('')
  const [pass, setPass] = useState('')
  function submit(e){
    e.preventDefault()
    if(!email.includes('@') || pass.length < 4){
      alert('Введите корректную почту и пароль минимум 4 символа.')
      return
    }
    onLogin(email)
  }
  return (
    <div className="min-h-screen flex items-center justify-center p-6">
      <div className="bg-[#111216] max-w-md w-full p-6 rounded-2xl border border-white/5 shadow-lg">
        <h1 className="text-2xl font-semibold mb-2">AI Chat</h1>
        <p className="text-sm text-gray-400 mb-4">Войдите, чтобы продолжить. Тестовый вход: любая почта и пароль ≥4 символов</p>
        <form onSubmit={submit} className="flex flex-col gap-3">
          <input className="bg-transparent border border-white/6 rounded-lg px-3 py-2 outline-none" placeholder="you@example.com" value={email} onChange={e=>setEmail(e.target.value)} />
          <input className="bg-transparent border border-white/6 rounded-lg px-3 py-2 outline-none" placeholder="Пароль" type="password" value={pass} onChange={e=>setPass(e.target.value)} />
          <button className="mt-2 bg-gradient-to-b from-gray-700 to-gray-900 px-4 py-2 rounded-lg font-semibold">Войти</button>
        </form>
        <p className="text-xs text-gray-500 mt-3">Демо: все данные хранятся локально (localStorage).</p>
      </div>
    </div>
  )
}
