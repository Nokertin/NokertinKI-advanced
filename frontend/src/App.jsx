import React, {useEffect, useState} from 'react'
import ChatApp from './components/ChatApp'
import Login from './components/Login'

export default function App(){
  const [user, setUser] = useState(null)
  useEffect(()=>{
    const email = localStorage.getItem('aichat_user_email')
    const logged = localStorage.getItem('aichat_logged_in') === '1'
    if(logged && email) setUser({email})
  },[])

  function handleLogin(email){
    localStorage.setItem('aichat_logged_in','1')
    localStorage.setItem('aichat_user_email', email)
    setUser({email})
  }

  function handleLogout(){
    localStorage.removeItem('aichat_logged_in')
    localStorage.removeItem('aichat_user_email')
    setUser(null)
  }

  return user ? <ChatApp user={user} onLogout={handleLogout} /> : <Login onLogin={handleLogin} />
}
