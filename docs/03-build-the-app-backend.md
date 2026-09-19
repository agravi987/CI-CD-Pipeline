# 🐘 Milestone 3 — Build the Backend & Database

## 🎯 Goal (plain English)

Build the **API + database** the frontend talks to: an Express server on port
3000, backed by PostgreSQL. When you finish you can POST a message with `curl`,
GET it back, and see it appear in the frontend from Milestone 2.

> 🛣️ **Which path?** This is **Option 2 — build the app yourself**. On
> Option 1? Skip to [Milestone 5 — Make the App Testable](05-make-the-app-testable.md).
> Files in `ci-cd-pipeline-app/backend/` are your **spec and answer key**.

---

## 📝 Step 1 — Initialize the package

```powershell
cd ci-cd-pipeline-app
mkdir backend
cd backend
npm init -y
npm install express cors dotenv pg
npm install -D nodemon
```

Set `"type": "module"` and scripts in **`package.json`**:

```json
{
  "name": "backend",
  "version": "1.0.0",
  "type": "module",               // ← so we can use `import` / `export`
  "scripts": {
    "start": "node src/index.js",     // used in production / Docker
    "dev": "nodemon src/index.js",    // auto-restarts on save (dev)
    "test": "node --test src/*.test.js" // ← Milestone 5 uses this!
  }
}
```

> Use **ES modules** (`import`/`export`) everywhere — Milestone 5's tests
> depend on files exporting pieces.

---

## 📝 Step 2 — The database layer (`backend/src/db.js`)

One module owns the connection pool and the schema. The important habit:
**every DB setting comes from an environment variable**, never hardcoded. That
is the single decision that lets the same code run on your laptop, in CI, and
inside a container.

```js
import pg from "pg";

const config = {
  host: process.env.DB_HOST,      // in Docker: 'db' (the compose service name)
  port: process.env.DB_PORT,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  max: 10,                        // up to 10 connections pooled
  idleTimeoutMillis: 30000,       // close idle ones after 30s
};

export const pool = new pg.Pool(config);   // the shared connection pool

export async function initDb() {           // create table on startup
  await pool.query(`
    CREATE TABLE IF NOT EXISTS messages (
      id SERIAL PRIMARY KEY,
      name VARCHAR(100) NOT NULL,
      message TEXT NOT NULL,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `);
  console.log('✅ Database ready (table "messages" verified)');
}
```

The matching bootstrap SQL for Docker lives in **`database/init.sql`** — same
table, same columns.

---

## 📝 Step 3 — The app, separated from the server (`backend/src/app.js`)

This is the **single most important structural decision** for your future
pipeline:

> `createApp()` **builds and returns** the Express app. The server that
> *listens* lives elsewhere (index.js). Why? Because Milestone 5's tests can
> build the app, pick a random port, and test it — **without ever starting your
> real server.**

```js
import express from "express";
import cors from "cors";
import { pool } from "./db.js";

export function createApp() {
  const app = express();
  app.use(cors());                 // allow browser requests from another origin
  app.use(express.json());         // read JSON bodies

  app.get("/api/health", (req, res) => {
    res.json({ status: "ok", uptime: process.uptime() });   // "am I alive?"
  });

  app.get("/api/messages", async (req, res) => {
    try {
      const result = await pool.query(
        "SELECT id, name, message, created_at FROM messages ORDER BY created_at DESC LIMIT 50",
      );
      res.json(result.rows);
    } catch (err) {
      res.status(500).json({ error: "Database error" });
    }
  });

  app.post("/api/messages", async (req, res) => {
    const { name, message } = req.body ?? {};
    if (!name || !message) return res.status(400).json({ error: "name and message are required" });

    try {
      const result = await pool.query(
        "INSERT INTO messages (name, message) VALUES ($1, $2) RETURNING *",
        [name, message],              // $1/$2 = safe placeholder values
      );
      res.status(201).json(result.rows[0]);
    } catch (err) {
      res.status(500).json({ error: "Database error" });
    }
  });

  return app;                        // hand the app to whoever calls us
}
```

### Line-by-line cheat sheet

| Block | What it does |
|-------|--------------|
| `import { pool } from "./db.js"` | Reuse the shared connection pool |
| `export function createApp()` | **The testability trick** — the app is a product, not a process |
| `app.use(cors())` / `app.use(express.json())` | Middleware: allow cross-origin calls, parse JSON bodies |
| `GET /api/health` | Tiny "service is alive" answer — **the pipeline health-checks this exact endpoint** |
| `GET /api/messages` | Newest 50 messages from Postgres |
| `POST /api/messages` | Validate → insert → return the saved row (status 201) |
| `$1, $2` placeholders | **Never concatenate user input into SQL.** The driver fills these in safely → no SQL injection |

---

## 📝 Step 4 — The entry point (`backend/src/index.js`)

`index.js` is the **only file you never export** — it's the "turn on the
server" process:

```js
import { initDb } from "./db.js";
import { createApp } from "./app.js";

const PORT = process.env.PORT || 3000;

async function start() {
  try {
    await initDb();                        // 1) make sure the table exists
    const app = createApp();               // 2) build the app
    app.listen(PORT, "0.0.0.0", () => {    // 3) start listening
      console.log(`✅ Backend listening on 0.0.0.0:${PORT}`);
    });
  } catch (err) {
    console.error("❌ Startup failed (is the database up?):", err.message);
    process.exit(1);                       // fail FAST — don't serve a broken API
  }
}

start();
```

Note `initDb()` runs **before** the server starts — if the table can't be
created, the process exits loudly instead of silently serving errors.

---

## 📝 Step 5 — Run it for real (Postgres + curl)

Start a throwaway Postgres for local development:

```powershell
docker run -d --name app-db `
  -e POSTGRES_USER=appuser -e POSTGRES_PASSWORD=devpass -e POSTGRES_DB=appdb `
  -p 5432:5432 postgres:16-alpine
```

Tell the backend where the DB is, then start it:

```powershell
cd backend
$env:DB_HOST="localhost"; $env:DB_PORT="5432"
$env:DB_USER="appuser";   $env:DB_PASSWORD="devpass"; $env:DB_NAME="appdb"
npm run dev
```

In a second terminal, prove the full round-trip:

```powershell
curl http://localhost:3000/api/health
# {"status":"ok","uptime":...}

curl -X POST http://localhost:3000/api/messages `
  -H "Content-Type: application/json" `
  -d '{"name":"Ravi","message":"first message 💌"}'
# {"id":1,"name":"Ravi","message":"first message 💌","created_at":"..."}

curl http://localhost:3000/api/messages
# [{"id":1,"name":"Ravi","message":"first message 💌",...}]
```

Now go back to the frontend from Milestone 2 — with the dev proxy running, the
**wall comes alive**: refresh http://localhost:5173 and your message appears.

> 📸 **Proof of work:** save **`docs/screenshots/03-build-backend.png`** — a
> terminal showing `npm run dev`, the health `curl`, and the POST + GET
> round-trip.

---

## 🧯 If something breaks

| Symptom | Cause | Fix |
|---------|-------|-----|
| `ECONNREFUSED` on start | Postgres not running | `docker ps`, wait a few seconds, retry |
| `no pg_hba.conf entry` | DB credentials mismatch | Make `POSTGRES_*` vars match your `DB_*` env vars |
| 500 on `/api/messages` | Table missing | Did `initDb()` run before `listen`? |
| `curl` not found | Windows 10+ needs it separately | Use `Invoke-RestMethod http://localhost:3000/api/health` |

---

## ✅ Checkpoint

```
[ ] ✔️ package.json has "type": "module" + start/dev/test scripts
[ ] ✔️ db.js reads ALL DB settings from env vars (never hardcoded)
[ ] ✔️ app.js EXPORTS createApp(); index.js starts the server
[ ] ✔️ POST + GET round-trip works via curl against a Postgres container
[ ] ✔️ The frontend from Milestone 2 shows posted messages (proxy works)
[ ] ✔️ Screenshot saved as docs/screenshots/03-build-backend.png
[ ] ✔️ You can explain WHY createApp() is a separate function
```

---

➡️ **Next:** [Milestone 4 — Containerize & Orchestrate with Docker Compose](04-containerize-with-docker.md)