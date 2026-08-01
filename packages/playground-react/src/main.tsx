import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'

import App from './App'
import './index.css'

if (import.meta.env.PROD) {
  import('../../react-map-chart/dist/style.css')
  import('../../react-map-chart-lite/dist/style.css')
}

const rootEl = document.getElementById('app')
if (!rootEl) throw new Error('#app element not found')

createRoot(rootEl).render(
  <StrictMode>
    <App />
  </StrictMode>
)
