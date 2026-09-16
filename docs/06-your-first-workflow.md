# ⚙️ Milestone 6 — Your First Workflow

## 🎯 Goal

Take the tests from Milestone 5 and make **GitHub run them for you on every
push and every PR**. This is your first taste of the CI half of CI/CD.

---

## 🧠 GitHub Actions — the 4-layer anatomy

```
WORKFLOW (.github/workflows/ci.yml)   ← one file per pipeline
  └─ JOB (backend-tests)              ← one runner (a fresh virtual machine)
       └─ STEP (Run tests)            ← one command, in order
            └─ ACTION (actions/checkout@v4)  ← reusable building blocks
```

Plus two things that glue it together:

| Piece | Meaning |
|-------|---------|
| **`on:`** | Which GitHub events start the workflow (`push`, `pull_request`, …) |
| **`runs-on:`** | The runner OS (a free `ubuntu-latest` VM per job) |

Your workflow is just a YAML list of "do this, then this" — Google's servers
boot a fresh Linux VM, run your steps, report the result, and shut it down.

---

## 📝 Step 1 — Pick your triggers

`ci.yml` starts with two `on:` triggers — this is how your pipeline hooks the
branching model from Milestone 1:

```yaml
on:
  push:
    branches: [main, "feature/**", "dev/**"]
  pull_request:
    branches: [main]
```

Why both? A PR workflow run is a **"check"** GitHub attaches to the PR — it can
block the merge button later (Milestone 13). The `push` run covers branches
without a PR.

---

## 📝 Step 2 — Write the first half of `ci.yml`

Create **`.github/workflows/ci.yml`** (inside `ci-cd-pipeline-app/`):

```yaml
name: CI — Lint, Test, Build & Scan

on:
  push:
    branches: [main, "feature/**", "dev/**"]
  pull_request:
    branches: [main]

jobs:
  backend-tests:
    name: "Backend — Test"
    runs-on: ubuntu-latest
    services:
      postgres:
        image: postgres:16-alpine
        env:
          POSTGRES_USER: appuser
          POSTGRES_PASSWORD: testpass
          POSTGRES_DB: appdb
        ports:
          - 5432:5432
        options: >-
          --health-cmd "pg_isready -U appuser -d appdb"
          --health-interval 5s
          --health-timeout 5s
          --health-retries 5
    env:
      DB_HOST: localhost
      DB_PORT: 5432
      DB_USER: appuser
      DB_PASSWORD: testpass
      DB_NAME: appdb
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 22
          cache: npm
          cache-dependency-path: ci-cd-pipeline-app/backend/package-lock.json
      - name: Install dependencies
        run: npm ci
        working-directory: ci-cd-pipeline-app/backend
      - name: Run unit + integration tests
        run: npm test
        working-directory: ci-cd-pipeline-app/backend
```

### The three clever parts

| Line | What it does |
|------|--------------|
| `services: postgres:` | Boots a **Postgres container on the runner** (like your Milestone 5 docker run) |
| `env: DB_HOST: localhost` | Points your tests at that Postgres — now the DB tests are *not* skipped |
| `cache: npm` | Caches `node_modules` between runs → your pipeline gets faster each time |

That whole `services:` block is how your Milestone 5 integration tests go from
"skipped" to "running for real" — automatically, on every push, forever. 🤖

---

## 📝 Step 3 — Add the frontend job

Append a second job under `jobs:` (separate runner, separate job — they run in
*parallel*):

```yaml
  frontend-lint-build:
    name: "Frontend — Lint & Build"
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 22
          cache: npm
          cache-dependency-path: ci-cd-pipeline-app/frontend/package-lock.json
      - name: Install dependencies
        run: npm ci
        working-directory: ci-cd-pipeline-app/frontend
      - name: Lint
        run: npm run lint
        working-directory: ci-cd-pipeline-app/frontend
      - name: Build production bundle
        run: npm run build
        working-directory: ci-cd-pipeline-app/frontend
```

Two jobs, two VMs, at the same time. If either fails → the whole run is red. 🔴

---

## 📝 Step 4 — Watch it run

```powershell
git add .github
git commit -m "ci: first workflow — lint, test, build"
git push
```

Open your repo → **Actions** → you'll see the run turn from yellow ⏳ to green ✅.

Then open the PR you left open in Milestone 1 — **CI is attached to it** and
running right there. Update the PR branch and watch it start again.

> 📸 **Proof of work:** saved in **`docs/screenshots/06-first-workflow.png`** — the Actions page showing both jobs **green**: "Backend — Test" and "Frontend — Lint & Build".
> ![Proof of work — first green workflow](screenshots/06-first-workflow.png)

---

## 🧯 If something breaks

| Symptom | Cause | Fix |
|---------|-------|-----|
| Job fails: `npm ci` not found in dir | Wrong `working-directory` | Check you're in `ci-cd-pipeline-app/backend` |
| "Event not allowed to run" | `on:` typo | `on` must be a valid event: `push` / `pull_request` |
| Run is a **ghost** (not triggered) | You pushed before adding the file, or branch isn't in `branches:` | Re-push after `git add .github`, or widen `branches:` |
| "Workflow not found on branch" | `.github` not on the pushed branch | Commit + push the workflow file itself |

---

## ✅ Checkpoint

```
[ ] ✔️ .github/workflows/ci.yml exists with backend + frontend jobs
[ ] ✔️ A push to your branch triggers a green run
[ ] ✔️ Your open PR shows the CI check running + passing
[ ] ✔️ You can name: workflow, job, step, action, on, runs-on
[ ] ✔️ Screenshot saved as docs/screenshots/06-first-workflow.png
```

---

➡️ **Next:** [Milestone 7 — The Full CI Pipeline](07-the-full-ci-pipeline.md)