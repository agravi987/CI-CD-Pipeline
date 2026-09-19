// ===========================================================================
// src/main.jsx — the tiny bootstrap that mounts React into the page
// ===========================================================================
// 🎯 WHAT THIS FILE DOES (plain English):
//   Takes the <App/> component and "draws" it into the empty <div id="root">
//   that index.html provides. Everything in this project flows from here.
//
// LINE-BY-LINE: read the `//` comments below.
// ===========================================================================
import { StrictMode } from 'react'            // dev helper: double-checks your components
import { createRoot } from 'react-dom/client' // the React "painter" for the browser
import './index.css'                          // global base styles
import App from './App.jsx'                   // our main component

// Find the empty <div id="root"> from index.html and render the app inside it
createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)