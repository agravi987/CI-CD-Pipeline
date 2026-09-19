# ⚙️ Milestone 6 — Your First Workflow

## 🎯 Goal (plain English)

Take Milestone 5's tests and make **GitHub run them for you** on every push and
every pull request. This is your first taste of the CI half of CI/CD.

---

## 🤔 GitHub Actions — the 4-layer anatomy

Imagine a factory. Four nested boxes:

```text
WORKFLOW  = one file per pipeline          (.github/workflows/ci.yml)
  └─ JOB  = one "worker" = one fresh VM      (name: "Backend — Test")
       └─ STEP = one command in a to-do list  (name: "Run tests")
            └─ ACTION = reusable machinery     (uses: actions/checkout@v4)
```

Plus the two glue pieces everyone quotes:

| Piece | Plain words |
|-------|-------------|
| `on:` | **When** does the pipeline wake up? (`push`, `pull_request`, …) |
| `runs-on:` | **Where** does it run? (a free `ubuntu-latest` VM per job) |

That's the whole idea: every job boots a fresh virtual computer, runs your
steps top to bottom, reports the result, then gets thrown away.

---

## 📝 Step 1 — Pick your triggers

The file starts with **two `on:` triggers** — this is how your pipeline hooks
the branching model from Milestone 1:

```yaml
on:
  push:
    branches: [main, "feature/**", "dev/**"]
  pull_request:
    branches: [main]
```

Why both?

- A **`pull_request`** run becomes a *check* GitHub attaches to the PR — and
  later (Milestone 13) it can block the merge button if it fails.
- A **`push`** run covers branches that don't have a PR open.

---

## 📝 Step 2 — Read the first half of `ci.yml`

> 📖 **Open the real file → `ci-cd-pipeline-app/.github/workflows/ci.yml`.
> Every single line has a plain-English `#` comment.** Read it along with this
> table — the file is the line-by-line tutorial.

The first job:

```yaml
  backend-tests:
    name: "Backend — Test"
    runs-on: ubuntu-latest
    services:                        # helper containers THIS job gets
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
    env:                             # env vars for this job's shell
      DB_HOST: localhost
      DB_PORT: 5432
      DB_USER: appuser
      DB_PASSWORD: testpass
      DB_NAME: appdb
    steps:
      - uses: actions/checkout@v4           # download the repo
      - uses: actions/setup-node@v4         # install Node.js
        with:
          node-version: 22
          cache: npm
          cache-dependency-path: ci-cd-pipeline-app/backend/package-lock.json
      - name: Install dependencies
        run: npm ci                         # clean install
        working-directory: ci-cd-pipeline-app/backend
      - name: Run unit + integration tests
        run: npm test                       # ← Milestone 5's tests!
        working-directory: ci-cd-pipeline-app/backend
```

### The three clever parts

| Line | What it does |
|------|--------------|
| `services: postgres:` | Boots a **Postgres container on the runner** (like your `docker run` in M5) |
| `env: DB_HOST: localhost` | Points the tests at that Postgres — now the DB tests are **not** skipped |
| `cache: npm` | Reuses npm's cache between runs → each run gets faster |

That whole `services:` block is how your Milestone 5 integration tests end up
running for real, automatically, on every push, forever. 🤖

---

## 📝 Step 3 — Add the frontend job

Append a second job under `jobs:` (its own runner — jobs run **in parallel**):

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

Two jobs, two VMs, at the same time. If either fails → the whole run is red 🔴.

---

## 📝 Step 4 — Watch it run

```powershell
git add .github
git commit -m "ci: first workflow — lint, test, build"
git push
```

Open your repo → **Actions** → the run goes from yellow ⏳ to green ✅.

Then open the PR you left hanging in Milestone 1 — **CI is attached to it**,
running right there. Push to the branch and watch it start again.

> 📸 **Proof of work:** save **`docs/screenshots/06-first-workflow.png`** — the
> Actions page with both jobs **green**: "Backend — Test" and
> "Frontend — Lint & Build".

---

## 🧯 If something breaks

| Symptom | Cause | Fix |
|---------|-------|-----|
| Job fails: `npm ci` not found in dir | Wrong `working-directory` | Check it points at `ci-cd-pipeline-app/backend` |
| "Event not allowed to run" | `on:` typo | `on` must use a valid event: `push` / `pull_request` |
| Run is a **ghost** (never triggered) | You pushed before adding the file, or branch isn't in `branches:` | Re-push after `git add .github`, or widen `branches:` |
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