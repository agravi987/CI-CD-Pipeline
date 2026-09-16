# 🎨 Milestone 2 — Build the Frontend (React)

## 🎯 Goal

Build the **message-wall React app** — the UI this whole pipeline will lint,
build, serve, and ship. When you finish this milestone you can run the frontend
locally and see it render.

> 🛣️ **Which path are you on?** This milestone is part of **Option 2 — build
> the app yourself**. If you're using the app that comes with this repo
> (Option 1), skip forward to [Milestone 5 — Make the App Testable](05-make-the-app-testable.md).
> The files already in `ci-cd-pipeline-app/frontend/` are your **spec and answer
> key** — type them yourself to learn, compare when stuck.

---

## 📝 Step 0 — What you need

| Tool | Why |
|------|-----|
| Node.js **22+** | Vite 8 and React 19 need a modern runtime |
| npm (ships with Node) | Install + script the frontend |

Check:

```powershell
node --version   # v22.x or newer
npm --version
```

---

## 📝 Step 1 — Scaffold the Vite + React project

`npm create vite` gives you a known-good React skeleton in seconds:

```powershell
cd ci-cd-pipeline-app
npm create vite@latest frontend -- --template react
cd frontend
npm install
npm run dev -- --host 0.0.0.0
```

Open **http://localhost:5173** — you'll see the default Vite counter page. Now
strip it down and add only what our app needs.

### Trim the dependencies

Our frontend is deliberately minimal — two runtime packages, dev tooling only:

```powershell
npm uninstall @vitejs/plugin-react eslint eslint-plugin-react-hooks eslint-plugin-react-refresh globals  # re-added as devDeps below
npm install react react-dom
npm install -D @vitejs/plugin-react @types/react @types/react-dom eslint eslint-plugin-react-hooks eslint-plugin-react-refresh globals vite
```

---

## 📝 Step 2 — Wire the `/api` proxy

In development the Vite server (port `5173`) must forward `/api/*` to the
backend (port `3000`) — otherwise `fetch("/api/messages")` would hit nowhere.
Replace **`vite.config.js`**:

```js
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/api': {
        target: process.env.VITE_API_PROXY_TARGET || 'http://localhost:3000',
        changeOrigin: true,
      },
    },
  },
})
```

> 🧠 **Keep this in your head:** the proxy is a **dev-time only** convenience.
> In production (Milestone 4) the same `/api` forwarding is done by **Nginx**,
> not Vite.

---

## 📝 Step 3 — The page shell

**`index.html`** — the single HTML entry:

```html
<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <link rel="icon" type="image/svg+xml" href="/favicon.svg" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <meta name="description" content="A full-stack message wall running React, Node.js and PostgreSQL — all in Docker containers." />
    <title>🐳 Container Inbox — Full-Stack in Docker</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.jsx"></script>
  </body>
</html>
```

**`src/main.jsx`** — mounts React into `<div id="root">`:

```jsx
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
```

---

## 📝 Step 4 — The message wall (`src/App.jsx`)

The component does **three jobs** — each maps to an API call the backend will
serve in Milestone 3:

| Job | API call | UI piece |
|-----|----------|----------|
| Tell the user the stack is alive | `GET /api/health` | the status pills in the hero |
| List the messages | `GET /api/messages` | the feed on page load |
| Send a new message | `POST /api/messages` | the compose form |

The interesting logic, in skeleton form:

```jsx
export default function App() {
  const [messages, setMessages] = useState([]);   // feed items
  const [name, setName] = useState("");           // form field
  const [message, setMessage] = useState("");     // form field
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [apiStatus, setApiStatus] = useState("checking");

  const loadMessages = async () => {              // GET /api/messages
    try {
      const res = await fetch("/api/messages");
      if (!res.ok) throw new Error(`API returned ${res.status}`);
      setMessages(await res.json());
      setError("");
    } catch {
      setError("Could not reach the API. Is the backend running?");
    }
  };

  useEffect(() => {                               // load once on mount
    fetch("/api/health").then(...);               // → apiStatus
    loadMessages();
  }, []);

  async function handleSubmit(e) {                // POST /api/messages
    e.preventDefault();
    const res = await fetch("/api/messages", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, message }),
    });
    if (res.ok) { setName(""); setMessage(""); await loadMessages(); }
  }
  // ...render: header + status pills + form + feed
}
```

> 🧠 **Why this shape?** `useState` holds UI state, `useEffect` runs side effects
> (the fetch on mount), and every render is a *function of state*. This pattern
> is the same for any React app — a pipelined app is just a React app with
> friends (CI/CD).

Build the complete component with the header, status pills, form, feed, avatars,
and empty/error states — the full **~290-line answer is `src/App.jsx` in the
repo**. Split the styling into **`src/index.css`** (base/reset) and
**`src/App.css`** (components), and keep the placeholder **`src/assets/`** files
needed by the build.

---

## 📝 Step 5 — Lint config + run it

**`eslint.config.js`** uses the flat config format shipped with ESLint 9/10,
with the React hooks + refresh plugins so lint actually catches broken patterns.

Now prove the app works:

```powershell
npm run lint     # zero errors expected
npm run build    # produces dist/
npm run dev -- --host 0.0.0.0
```

Open http://localhost:5173 — you'll see the hero and the empty feed state
("No messages yet") because the backend from Milestone 3 isn't running.
That's expected and correct. 🎯

> 📸 **Proof of work:** saved in **`docs/screenshots/02-build-frontend.png`** — the app rendering in the browser at `localhost:5173`, with the hero + status pills + empty state visible.
> ![Proof of work — frontend renders](screenshots/02-build-frontend.png)

---

## 🧯 If something breaks

| Symptom | Cause | Fix |
|---------|-------|-----|
| `npm create vite` fails | Old npm / no network | `npm create vite@latest frontend -- --template react` with fresh npm |
| Blank page, no errors | `main.jsx` missing `createRoot` | Check `#root` in `index.html` matches your mount point |
| `GET /api/...` network error | No backend running yet | Expected until Milestone 3; the app shows the friendly error banner |
| Port 5173 busy | Another dev server | Add `--port 5174` |

---

## ✅ Checkpoint

```
[ ] ✔️ `npm create vite` scaffolded the React app
[ ] ✔️ vite.config.js proxies /api → localhost:3000
[ ] ✔️ App.jsx renders hero, status pills, form and feed
[ ] ✔️ npm run lint passes with zero errors
[ ] ✔️ npm run build produces dist/
[ ] ✔️ Screenshot saved as docs/screenshots/02-build-frontend.png
[ ] ✔️ You can explain: what the Vite dev proxy is FOR
```

---

➡️ **Next:** [Milestone 3 — Build the Backend & Database](03-build-the-app-backend.md)