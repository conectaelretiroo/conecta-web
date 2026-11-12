import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import './index.css'
import './moderno.css'
import { quitarPantallaDeCarga } from './cargando'
import { activarBarra, activarRevelado } from './revelar'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)

quitarPantallaDeCarga()
activarRevelado()
activarBarra()
