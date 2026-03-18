import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import axios from 'axios'
import { API_BASE } from './config/api'
import './index.css'
import './styles/global-redwood.css'
import App from './App.jsx'

axios.defaults.baseURL = API_BASE || undefined

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
