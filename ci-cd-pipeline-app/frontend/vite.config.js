// ===========================================================================
// vite.config.js — config for Vite, the dev server + build tool
// ===========================================================================
// 🎯 WHAT THIS FILE DOES (plain English):
//   Vite is what compiles and serves this React app. The important part here
//   is the PROXY:
//
//     You (browser)  →  GET /api/health  →  Vite forwards it  →  backend :3000
//
//   That way the frontend can call `/api/...` and it magically reaches the
//   backend — no http://localhost:3000 hardcoded in the app.
//
//   🧠 DEV-ONLY: in production this same forwarding is done by Nginx (see
//   frontend/nginx.conf). Vite's proxy is just a dev-time convenience.
//
// LINE-BY-LINE: read the `//` comments below.
// ===========================================================================
import react from '@vitejs/plugin-react'   // lets Vite understand JSX/React
import { defineConfig } from 'vite'        // the config helper

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],                      // enable React support
  server: {
    proxy: {                               // forward these requests ...
      '/api': {                            //   ...any request starting with /api
        target: process.env.VITE_API_PROXY_TARGET || 'http://localhost:3000',  // ...go here
        changeOrigin: true,                //   swap the Host header to the target
      },
    },
  },
})