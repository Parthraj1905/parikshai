import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import { ThemeProvider } from './lib/ThemeContext'
import { ToastProvider } from './lib/ToastContext'
import ToastContainer from './components/Toast'
import App from './App.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <ThemeProvider>
      <ToastProvider>
        <App />
        <ToastContainer />
      </ToastProvider>
    </ThemeProvider>
  </StrictMode>,
)