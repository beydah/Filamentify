import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './ui/styles/index.css'
import App from './App.tsx'
import { installApiFetchShim } from './lib/api.ts'

installApiFetchShim()

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
