/**
 * main.tsx — Application entry point.
 *
 * Security note:
 *  - StrictMode enabled to catch unsafe patterns during development
 *  - No sensitive data is logged at this level
 */

import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App'
import './index.css'

const rootElement = document.getElementById('root')
if (!rootElement) throw new Error('Root element not found')

createRoot(rootElement).render(
  <StrictMode>
    <App />
  </StrictMode>
)
