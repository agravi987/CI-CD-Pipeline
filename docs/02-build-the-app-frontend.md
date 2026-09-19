# 🎨 Milestone 2 — Build the Frontend (React)

## 🎯 Goal (plain English)

Build the **message-wall UI** — the React app this whole pipeline will lint,
build, serve, and ship. When you finish, the frontend runs locally at
`http://localhost:5173`.

> 🛣️ **Which path?** This is **Option 2 — build the app yourself**. On
> Option 1? Skip to [Milestone 5 — Make the App Testable](05-make-the-app-testable.md).
> The files in `ci-cd-pipeline-app/frontend/` are your **spec and answer key** —
> type them yourself to learn, then compare.

---

## 📝 Step 0 — What you need

| Tool | Why |
|------|-----|
| Node.js **22+** | Vite and React need a modern runtime |
| npm (comes with Node) | Install packages + run scripts |

Check:

```powershell
node --version   # v22.x or newer
npm --version
```

---

## 📝 Step 1 — Scaffold the project

`npm create vite` gives you a known-good React skeleton instantly:

```powershell
cd ci-cd-pipeline-app
npm create vite@latest frontend -- --template react
cd frontend
npm install
npm run dev -- --host 0.0.0.0
```

Open **http://localhost:5173** → the default Vite counter page. Now strip it
down to just what we need. Our frontend is deliberately minimal — two runtime
packages (`react`, `react-dom`) plus dev tooling:

```powershell
npm uninstall @vitejs/plugin-react eslint eslint-plugin-react-hooks eslint-plugin-react-refresh globals
npm install react react-dom
npm install -D @vitejs/plugin-react @types/react @types/react-dom eslint eslint-plugin-react-hooks eslint-plugin-react-refresh globals vite
```

---

## 📝 Step 2 — Wire the `/api` proxy

In development, the frontend calls `fetch("/api/messages")`. Without a proxy,
that would hit Vite's own port (5173) and find nothing — the backend lives on
port **3000**. So we teach Vite: *"any `/api/*` request → forward it to port
3000."*

Replace **`frontend/vite.config.js`**:

```js
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/api': {                                        // any request starting with /api ...
        target: process.env.VITE_API_PROXY_TARGET || 'http://localhost:3000',  // goes here
        changeOrigin: true,
      },
    },
  },
})
```

| Key line | What it does | 
|----------|--------------|
| `plugins: [react()]` | Enables React/JSX support in Vite |
| `proxy: { '/api': ... }` | "Forward `/api/*` requests to the backend" |
| `target: ... :3000` | The backend's address (overridable via env var) |
| `changeOrigin: true` | Rewrites the `Host` header to the target |

> 🧠 **Dev-only!** This proxy only exists while developing. In production
> (Milestone 4) Nginx does the same forwarding with
> `frontend/nginx.conf`.

---

## 📝 Step 3 — The page shell

**`frontend/index.html`** — the single HTML entry. It just points at `#root`
and loads `main.jsx`.

**`frontend/src/main.jsx`** — the tiny bootstrap that draws `<App/>` into the
`#root` div (fully commented in the repo).

---

## 📝 Step 4 — The message wall (`frontend/src/App.jsx`)

The component does **three jobs**, each backed by an API call the backend will
serve in Milestone 3:

| Job | API call | UI piece |
|-----|----------|----------|
| Tell the user the stack is alive | `GET /api/health` | the status pills in the header |
| List the messages | `GET /api/messages` | the feed on page load |
| Send a new message | `POST /api/messages` | the compose form |

The core React pattern (this is the important mental model):

```jsx
export default function App() {
  const [messages, setMessages] = useState([]);   // UI data lives in "state"
  const [name, setName] = useState("");           // one state per form field
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Runs ONCE when the page first appears:
  useEffect(() => {
    fetch("/api/health").then(...);   // update the status pills
    fetch("/api/messages").then(...); // load the feed
  }, []);

  async function handleSubmit(e) {    // pressed "Post":
    e.preventDefault();
    await fetch("/api/messages", { method: "POST", body: JSON.stringify({ name, message }) });
    loadMessages();                   // refresh the feed
  }
  // ...render: header + pills + form + feed
}
```

| Concept | Plain words |
|---------|-------------|
| `useState` | Memory the component keeps between renders |
| `useEffect` | "Do this after the page shows up" (loading data = a side effect) |
| `render` | React redrawing the screen from the current state |

The complete component (header, status pills, form, feed, avatars, empty/error
states) is **`frontend/src/App.jsx`** — fully commented. Styling is split into
`src/index.css` (base) and `src/App.css` (components), same as the repo.

---

## 📝 Step 5 — Lint config + run it

**`frontend/eslint.config.js`** uses ESLint 9/10's flat config with the React
hooks + refresh plugins, so linting actually catches broken patterns.

Now prove the app works:

```powershell
npm run lint    # zero errors expected
npm run build   # compiles the app → dist/
npm run dev -- --host 0.0.0.0
```

Open http://localhost:5173 — you'll see the hero and the empty feed
("No messages yet"). Empty is correct: the backend (Milestone 3) isn't running
yet.

> 📸 **Proof of work:** save **`docs/screenshots/02-build-frontend.png`** — the
> app rendering at `localhost:5173`, hero + status pills + empty state visible.

---

## 🧯 If something breaks

| Symptom | Cause | Fix |
|---------|-------|-----|
| `npm create vite` fails | Old npm / no network | Retry with the `@latest` command above |
| Blank page, no errors | `main.jsx` missing / `#root` mismatch | Check `index.html` has `<div id="root">` |
| `GET /api/...` network error | No backend running yet | Expected until Milestone 3 — the app shows a friendly banner |
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