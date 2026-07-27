import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import Ingreso from './components/Ingreso'
import './index.css'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <Ingreso />
  </StrictMode>,
)