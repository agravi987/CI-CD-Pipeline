# 🧪 Milestone 5 — Make the App Testable

## 🎯 Goal

A pipeline has to *check* something, or it's theater. Give the backend real
**unit tests** (no database) and **integration tests** (with a database), and
run them locally. This is the code that CI will run on every push from now on.

---

## 🧠 Why tests come first

CI without tests is just "it downloaded dependencies." The whole point of
Continuous Integration is:

> *"the pipeline proves the code works — so reviewers don't have to."*

You're testing the Express API from Project 2. Plan:

| Test file | Kind | Needs a database? |
|-----------|------|-------------------|
| `backend/src/app.test.js` | Unit — health endpoint, input validation | ❌ No |
| `backend/src/db.test.js` | Integration — table creation, write + read round-trip | ✅ Yes |

The integration tests **skip automatically** when no database is configured —
so they pass locally *and* in CI (where CI spins up Postgres). One file, two modes. 🎩

---

## 📝 Step 1 — Install and run the current tests

```powershell
cd ci-cd-pipeline-app\backend
npm ci
npm test
```

Expected output (no database configured yet):

```
✔ GET /api/health returns ok
✔ POST /api/messages without body returns 400
✔ POST /api/messages with missing fields returns 400
﹣ 3 tests skipped           ← the DB ones, because DB_HOST is not set
ℹ pass 3  fail 0  skipped 3
```

That's it — **3 real tests pass**, 3 integration tests waiting for a database.

---

## 📝 Step 2 — Look at the two key files

### `src/app.js` — the app, separated from the server

```js
export function createApp() {
  const app = express();
  // ... routes ...
  return app;
}
```

This tiny refactor is what makes testing possible: the tests can build the app
and start it on a **random port** for themselves. `src/index.js` just calls
`createApp()` and listens — unchanged behavior in production.

### `src/app.test.js` — unit tests, using built-in `node:test`

```js
import { test } from "node:test";
import assert from "node:assert/strict";
import { createApp } from "./app.js";

const app = createApp();
const server = app.listen(0, "127.0.0.1");     // port 0 = "pick a free one"
await new Promise((r) => server.once("listening", r));

test("GET /api/health returns ok", async () => {
  const res = await fetch(`${baseUrl()}/api/health`);
  assert.equal(res.status, 200);
  const body = await res.json();
  assert.equal(body.status, "ok");
});
```

No Jest, no Mocha, no Chai — **Node 22 ships its own test runner and `fetch`**.
Zero new dependencies. That's how the whole pipeline stays lean.

---

## 📝 Step 3 — Run the integration tests for real

The 3 skipped tests need PostgreSQL. Run them with a throwaway container:

```powershell
docker run -d --name test-all-db `
  -e POSTGRES_USER=appuser -e POSTGRES_PASSWORD=testpass -e POSTGRES_DB=appdb `
  -p 5432:5432 postgres:16-alpine

$env:DB_HOST="localhost"; $env:DB_PORT="5432"
$env:DB_USER="appuser";  $env:DB_PASSWORD="testpass"; $env:DB_NAME="appdb"

npm test    # NOW all 6 run: 3 unit + 3 integration

# cleanup
Remove-Item Env:DB_HOST, Env:DB_PORT, Env:DB_USER, Env:DB_PASSWORD, Env:DB_NAME
docker rm -f test-all-db
```

```
✔ GET /api/health returns ok
✔ POST /api/messages without body returns 400
✔ POST /api/messages with missing fields returns 400
✔ initDb creates messages table
✔ GET /api/messages returns empty array when no rows
✔ POST + GET round-trip
ℹ pass 6  fail 0  skipped 0
```

The integration tests prove the whole stack: **API → route → query → Postgres → back**.

> 📸 **Proof of work:** saved in **`docs/screenshots/05-local-tests.png`** — terminal showing `npm test` with **6 pass, 0 fail** against the Postgres container.
> ![Proof of work — all tests passing](screenshots/05-local-tests.png)

---

## 🧯 If something breaks

| Symptom | Cause | Fix |
|---------|-------|-----|
| Integration tests all fail, unit tests pass | No DB reachable at `localhost:5432` | Start Postgres in Docker first (Step 3) |
| `ECONNREFUSED` | The container isn't up yet | Wait 5s, or check `docker ps` |
| `passenger not listening` | Leftover env vars | `Remove-Item Env:DB_*` then re-run |
| Port 5432 already in use | Another Postgres is running | Use `-p 5433:5432` and `DB_PORT=5433` |

---

## ✅ Checkpoint

```
[ ] ✔️ npm test passes 3 unit tests locally (no DB)
[ ] ✔️ npm test passes all 6 tests against a Postgres container
[ ] ✔️ You can explain: app.js vs index.js (why both exist)
[ ] ✔️ You can explain: why DB tests skip when DB_HOST is unset
[ ] ✔️ Screenshot saved as docs/screenshots/05-local-tests.png
```

---

➡️ **Next:** [Milestone 6 — Your First Workflow](06-your-first-workflow.md)