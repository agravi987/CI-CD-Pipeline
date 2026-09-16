# 🐘 Milestone 3 — Build the Backend & Database

## 🎯 Goal

Build the **Express API + PostgreSQL persistence** that the frontend talks to.
When you finish you can start Postgres in Docker, run the API locally, and
`curl` a real message round-trip.

> 🛣️ **Which path are you on?** This is **Option 2 — build the app yourself**.
> Option 1 builders: jump straight to [Milestone 5 — Make the App Testable](05-make-the-app-testable.md).
> The files in `ci-cd-pipeline-app/backend/` are your **spec and answer key**.

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

Then set `"type": "module"` and the scripts in **`package.json`**:

```json
{
  "name": "backend",
  "version": "1.0.0",
  "type": "module",
  "scripts": {
    "start": "node src/index.js",
    "dev": "nodemon src/index.js",
    "test": "node --test src/*.test.js"
  }
}
```

> Use **ES modules** (`import`/`export`) everywhere — the repo is, and your tests
> in Milestone 5 will rely on `export`ed pieces.

---

## 📝 Step 2 — The database layer (`src/db.js`)

One module owns the connection pool and the schema. Everything reads the DB
settings from **environment variables** — that's what lets the same code run on
your laptop, in CI, and in a container later:

```js
import pg from "pg";

const config = {
  host: process.env.DB_HOST,      // in Docker: 'db' (the service name)
  port: process.env.DB_PORT,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  max: 10,
  idleTimeoutMillis: 30000,
};

export const pool = new pg.Pool(config);

// Create the table on startup so the app is self-bootstrapping
export async function initDb() {
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

The matching bootstrap SQL also lives (for Docker) in
**`ci-cd-pipeline-app/database/init.sql`** — same table, same columns.

---

## 📝 Step 3 — The app, separated from the server (`src/app.js`)

This is the **single most important structural decision** for your future
pipeline: the Express app is **built by a function and returned**, and the
server is started *elsewhere*. Why? Because Milestone 5's tests can then create
the app, listen on a random port, and test against it — without ever starting
your real server.

```js
import express from "express";
import cors from "cors";
import { pool } from "./db.js";

export function createApp() {
  const app = express();
  app.use(cors());
  app.use(express.json());

  app.get("/api/health", (req, res) => {
    res.json({ status: "ok", uptime: process.uptime() });
  });

  app.get("/api/messages", async (req, res) => {
    try {
      const result = await pool.query(
        "SELECT id, name, message, created_at FROM messages ORDER BY created_at DESC LIMIT 50",
      );
      res.json(result.rows);
    } catch (err) {
      console.error("GET /api/messages failed:", err.message);
      res.status(500).json({ error: "Database error" });
    }
  });

  app.post("/api/messages", async (req, res) => {
    const { name, message } = req.body ?? {};

    if (!name || !message) {
      return res.status(400).json({ error: "name and message are required" });
    }

    try {
      const result = await pool.query(
        "INSERT INTO messages (name, message) VALUES ($1, $2) RETURNING *",
        [name, message],
      );
      res.status(201).json(result.rows[0]);
    } catch (err) {
      console.error("POST /api/messages failed:", err.message);
      res.status(500).json({ error: "Database error" });
    }
  });

  return app;
}
```

> 🧠 **Parameterized queries** (`$1, $2`) — never concatenate user input into
> SQL. `$1`/`$2` are placeholders the driver binds separately. This is the #1
> way to stay safe from SQL injection while you build this.

---

## 📝 Step 4 — The entry point (`src/index.js`)

`index.js` is the **only file you never export** — it's the process that boots:

```js
import { initDb } from "./db.js";
import { createApp } from "./app.js";

const PORT = process.env.PORT || 3000;

async function start() {
  try {
    await initDb();
    const app = createApp();
    app.listen(PORT, "0.0.0.0", () => {
      console.log(`✅ Backend listening on 0.0.0.0:${PORT}`);
    });
  } catch (err) {
    console.error("❌ Startup failed (is the database up?):", err.message);
    process.exit(1);
  }
}

start();
```

Note `initDb()` runs **before** the server starts — if `CREATE TABLE` fails, the
process exits loudly instead of serving a broken API. Fail fast at boot, not in
a request. 🎯

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
wall **comes alive**: refresh http://localhost:5173 and your message appears. 🎉

> 📸 **Proof of work:** saved in **`docs/screenshots/03-build-backend.png`** — the terminal showing `npm run dev`, the health `curl`, and the POST + GET round-trip returning your message.
> ![Proof of work — API round-trip](screenshots/03-build-backend.png)

---

## 🧯 If something breaks

| Symptom | Cause | Fix |
|---------|-------|-----|
| `ECONNREFUSED` on start | Postgres not running / not healthy | `docker ps`, wait 5s and retry |
| `no pg_hba.conf entry` | Wrong DB creds | Match `POSTGRES_USER/PASSWORD` vars to your `DB_*` env vars |
| 500 on `/api/messages` | Table missing | `initDb()` error? Check it ran before `listen` |
| `curl` not found | Windows 10+ needs it separately | Use `Invoke-RestMethod http://localhost:3000/api/health` |

---

## ✅ Checkpoint

```
[ ] ✔️ npm install works, package.json has "type": "module" + start/dev/test
[ ] ✔️ db.js reads ALL DB settings from env vars (never hardcoded)
[ ] ✔️ app.js EXPORTS createApp(); index.js starts the server
[ ] ✔️ POST + GET round-trip works via curl against a Postgres container
[ ] ✔️ The frontend from Milestone 2 shows posted messages (proxy works)
[ ] ✔️ Screenshot saved as docs/screenshots/03-build-backend.png
[ ] ✔️ You can explain WHY createApp() is a separate function
```

---

➡️ **Next:** [Milestone 4 — Containerize & Orchestrate with Docker Compose](04-containerize-with-docker.md)