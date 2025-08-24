import React, { useState } from 'react';
import './App.css';

const API_URL = '/api/chat';

function App() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');

  const sendMessage = async () => {
    if (!input) return;
    const newMessages = [...messages, { role: 'user', content: input }];
    setMessages(newMessages);
    setInput('');

    const res = await fetch(API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ messages: newMessages })
    });
    const data = await res.json();
    setMessages([...newMessages, { role: 'assistant', content: data.reply }]);
  };

  return (
    <div style={{ backgroundColor: '#1e1e1e', color: '#eee', minHeight: '100vh', padding: '2rem' }}>
      <h1>AI Chat</h1>
      <div style={{ marginBottom: '1rem' }}>
        {messages.map((m, i) => (
          <div key={i} style={{ margin: '0.5rem 0' }}>
            <b>{m.role}:</b> {m.content}
          </div>
        ))}
      </div>
      <input
        style={{ width: '80%', padding: '0.5rem', marginRight: '0.5rem', borderRadius: '0.25rem' }}
        value={input}
        onChange={e => setInput(e.target.value)}
        onKeyDown={e => e.key === 'Enter' && sendMessage()}
      />
      <button onClick={sendMessage} style={{ padding: '0.5rem 1rem', borderRadius: '0.25rem' }}>Send</button>
    </div>
  );
}

export default App;