import React from 'react'
import ReactDOM from 'react-dom/client'
import { DemoApp } from './ui/DemoApp'
import './ui/DemoApp.css'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <DemoApp />
  </React.StrictMode>,
)
