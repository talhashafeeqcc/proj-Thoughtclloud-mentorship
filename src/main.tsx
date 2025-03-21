import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import App from './App'
import { AuthProvider } from './context/AuthContext'
import { MentorProvider } from './context/MentorContext'
import { SessionProvider } from './context/SessionContext'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <MentorProvider>
          <SessionProvider>
            <App />
          </SessionProvider>
        </MentorProvider>
      </AuthProvider>
    </BrowserRouter>
  </React.StrictMode>,
)
