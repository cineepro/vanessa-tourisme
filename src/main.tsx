// src/main.tsx — Vanessa Tourisme
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'

import '@fontsource-variable/bricolage-grotesque'
import '@fontsource-variable/figtree'
import './styles/tokens.css'
import './index.css'

import App from './App'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)