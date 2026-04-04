import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './app/App'
import { AuthProvider } from './features/auth/context/AuthContext'
import './index.css'

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
  <React.StrictMode>
    <AuthProvider>
      <App />
    </AuthProvider>
  </React.StrictMode>
)