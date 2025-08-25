import React, {useEffect, useState, useRef} from 'react'

function uid(){ return 'id-'+Math.random().toString(36).slice(2,9) }

const API_URL = (
  (typeof import !== 'undefined' && import.meta && import.meta.env && import.meta.env.VITE_API_URL) ||
  (typeof window !== 'undefined' && window.location.hostname === 'localhost' ? 'http://localhost:5000' : '')
).replace(/\/$/, '') || '';

export default function ChatApp({user, onLogout}){
  const [convos, setConvos] = useState([]) // {id, title, messages:[{role,content,attachments}]}
  const [activeId, setActiveId] = useState(null)
  const [input, setInput] = useState('')
  const [sending, setSending] = useState(false)
  const fileRef = useRef()

  useEffect(()=>{
    const saved = localStorage.getItem('aichat_convos')
    if(saved) try{ setConvos(JSON.parse(saved)) }catch(e){ setConvos([]) }
  },[])

  useEffect(()=>{
    localStorage.setItem('aichat_convos', JSON.stringify(convos))
  },[convos])

  useEffect(()=>{
    if(convos.length && !activeId) setActiveId(convos[0].id)
  },[convos, activeId])

  function createNew(){
    const c = { id: uid(), title: 'Новый чат', messages: [] }
    setConvos(prev=>[c, ...prev])
    setActiveId(c.id)
  }

  function deleteConvo(id){
    if(!confirm('Удалить беседу?')) return
    setConvos(prev=>prev.filter(c=>c.id!==id))
    if(activeId===id) setActiveId(null)
  }

  function appendMessageToActive(msg){
    setConvos(prev=> prev.map(c=> c.id===activeId ? {...c, messages:[...c.messages, msg]} : c ))
  }

  async function sendMessage(text, files){
    if(!activeId) createNew()
    setSending(true)
    const attachments = []
    if(files && files.length){
      for(const f of files){
        attachments.push(await toDataURL(f))
      }
    }
    // add user message locally
    const userMsg = { role:'user', content:text, attachments }
    appendMessageToActive(userMsg)
    setInput('')
    fileRef.current.value = ''

    // send to backend /api/chat
    try{
      const conv = convos.find(c=> c.id===activeId) || {messages:[]}
      const messagesForApi = [ ...conv.messages, userMsg ].map(m=> ({role:m.role, content: m.content}) )
      const res = await fetch(`${API_URL}/api/chat`, {
        method:'POST',
        headers:{ 'Content-Type':'application/json' },
        body: JSON.stringify({ messages: messagesForApi })
      })
      const contentType = res.headers.get('content-type') || ''
      if(!res.ok){
        const errText = contentType.includes('application/json') ? JSON.stringify(await res.json()) : await res.text()
        throw new Error(`HTTP ${res.status}: ${errText.slice(0,200)}`)
      }
      const data = contentType.includes('application/json') ? await res.json() : { reply: await res.text() }
      const botText = data?.reply || 'Ошибка: нет ответа.'
      const botMsg = { role:'assistant', content: botText, attachments: [] }
      appendMessageToActive(botMsg)
    }catch(e){
      appendMessageToActive({role:'assistant', content: 'Ошибка при отправке: '+ e.message, attachments:[]})
    } finally{ setSending(false) }
  }

  function toDataURL(file){
    return new Promise((res,rej)=>{
      const reader = new FileReader()
      reader.onload = ()=> res(reader.result)
      reader.onerror = ()=> rej()
      reader.readAsDataURL(file)
    })
  }

  const active = convos.find(c=> c.id===activeId)

  return (
    <div className="flex h-screen">
      <aside className="w-72 bg-[#0f1113] border-r border-white/6 p-4 flex flex-col">
        <div className="flex items-center justify-between mb-4">
          <div className="text-lg font-semibold">AI Chat</div>
          <button className="text-sm text-gray-400" onClick={onLogout}>Выйти</button>
        </div>
        <div className="flex gap-2 mb-3">
          <button onClick={createNew} className="flex-1 bg-white/3 rounded-md py-2 text-sm">Новый чат</button>
          <button onClick={()=>{ setConvos([]); setActiveId(null); localStorage.removeItem('aichat_convos') }} className="px-3 bg-transparent border border-white/5 rounded-md text-sm">Очистить</button>
        </div>
        <div className="flex-1 overflow-auto scrollbar pr-2">
          {convos.length===0 && <div className="text-gray-500 text-sm">Нет бесед. Нажмите «Новый чат».</div>}
          <ul className="mt-2 space-y-2">
            {convos.map(c=>(
              <li key={c.id} className={`p-2 rounded-md cursor-pointer ${c.id===activeId ? 'bg-white/5' : 'hover:bg-white/2'}`}>
                <div className="flex justify-between items-center" onClick={()=> setActiveId(c.id)}>
                  <div className="text-sm font-medium">{c.title || 'Чат'}</div>
                  <div className="flex gap-2 items-center">
                    <button title="Удалить" onClick={(e)=>{ e.stopPropagation(); deleteConvo(c.id) }} className="text-xs text-gray-400">Удалить</button>
                  </div>
                </div>
                <div className="text-xs text-gray-400 mt-1">{c.messages.length} сообщений</div>
              </li>
            ))}
          </ul>
        </div>
      </aside>

      <main className="flex-1 flex flex-col">
        <header className="p-4 border-b border-white/6 flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold">{active ? (active.title || 'Чат') : 'Выберите беседу'}</h2>
            <div className="text-xs text-gray-400">Пользователь: {user.email}</div>
          </div>
          <div>
            <button className="text-sm text-gray-400" onClick={()=>{
              if(!active) return alert('Нет активной беседы.')
              const title = prompt('Новое имя беседы:', active.title)
              if(title !== null) setConvos(prev=> prev.map(c=> c.id===active.id ? {...c, title} : c ))
            }}>Переименовать</button>
          </div>
        </header>

        <section className="flex-1 p-4 overflow-auto" id="messages" style={{background:'linear-gradient(180deg, rgba(255,255,255,0.01), rgba(255,255,255,0.007))'}}>
          {!active && <div className="text-gray-500">Выберите беседу слева или создайте новую.</div>}
          {active && active.messages.map((m,idx)=> (
            <div key={idx} className={`mb-4 ${m.role==='user' ? 'text-right' : 'text-left'}`}>
              <div className={`inline-block p-3 rounded-xl ${m.role==='user' ? 'bg-gray-800' : 'bg-[#0b1220]'} max-w-[70%]`}>
                <div className="whitespace-pre-wrap">{m.content}</div>
                {m.attachments && m.attachments.length>0 && (
                  <div className="mt-2 flex gap-2 flex-wrap">
                    {m.attachments.map((a,i)=>(<img key={i} src={a} alt="attachment" className="w-40 rounded-md border border-white/6" />))}
                  </div>
                )}
              </div>
            </div>
          ))}
        </section>

        <footer className="p-4 border-t border-white/6">
          <form onSubmit={e=>{ e.preventDefault(); if(sending) return; const files = fileRef.current.files; sendMessage(input, files) }} className="flex gap-3 items-center">
            <label className="p-2 border border-white/6 rounded-md cursor-pointer">📎<input ref={fileRef} type="file" accept="image/*" className="hidden" /></label>
            <input value={input} onChange={e=>setInput(e.target.value)} className="flex-1 bg-transparent border border-white/6 rounded-lg px-3 py-2 outline-none" placeholder="Напишите сообщение..." />
            <button type="submit" className="bg-gradient-to-b from-gray-700 to-gray-900 px-4 py-2 rounded-lg font-semibold">{sending ? 'Отправка...' : 'Отправить'}</button>
          </form>
        </footer>
      </main>
    </div>
  )
}
