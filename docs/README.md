# 🔁 CI/CD Pipeline — Learning Guide

A plain-English, step-by-step path from **"I know Docker"** to
**"I automate software delivery"**. 14 milestones, each with a checkpoint and a
screenshot to prove the work.

---

## ⏱️ How this guide reads

Every milestone follows the same simple shape:

1. **Goal** — one sentence: what you'll have when you finish.
2. **Plain-English story** — an analogy before any jargon.
3. **Steps** — numbered, copy-pasteable commands.
4. **Line-by-line** — when a file is important, a table explains each block
   (and the actual files in `ci-cd-pipeline-app/` have a `#` comment on every
   line, too).
5. **If something breaks** — the most common errors and their fixes.
6. **Checkpoint** — tick boxes proving you did it.

---

## 🧭 Choose your path

Two ways through, depending on whether you want to build the app yourself:

### 🅰️ Option 1 — use the included app (fastest, recommended)

The full app (React + Nginx, Node/Express, PostgreSQL — containerized) is
**already in this repo**. You don't build it — you automate it.

> Do **Milestone 1** → skip Milestones 2–4 → continue at **Milestone 5**.
> Total ≈ **6 hours**.

### 🅱️ Option 2 — build the app yourself too (full journey)

Milestones 2–4 walk you through creating the frontend, backend + database, and
containers from scratch — then the pipeline milestones start. Ideal if you want
to *really* understand what you're shipping.

> Follow **Milestones 1–14 in order**. Total ≈ **8.5 hours**.

---

## 🗺️ The 14 milestones

| # | 🏁 Milestone | What you do | ⏱️ | Path |
|---|-----------|-------------|------|------|
| 1 | [🌿 Setup, Git Branching & Pull Requests](01-setup-git-branching-and-pull-requests.md) | Repo, feature branches, the PR flow pipelines hook into | 30 min | both |
| 2 | [🎨 Build the Frontend (React)](02-build-the-app-frontend.md) | Vite + React message wall, dev proxy to the API | 40 min | 🅱️ |
| 3 | [🐘 Build the Backend & Database](03-build-the-app-backend.md) | Express API, PostgreSQL table, curl round-trip | 45 min | 🅱️ |
| 4 | [🐳 Containerize & Docker Compose](04-containerize-with-docker.md) | Multi-stage Dockerfiles, Nginx, one-command stack | 45 min | 🅱️ |
| 5 | [🧪 Make the App Testable](05-make-the-app-testable.md) | Unit + integration tests, run them locally | 35 min | both |
| 6 | [⚙️ Your First Workflow](06-your-first-workflow.md) | GitHub Actions anatomy + CI that runs on every PR | 40 min | both |
| 7 | [🏗️ The Full CI Pipeline](07-the-full-ci-pipeline.md) | Docker builds, Trivy security scan, SBOM artifacts | 40 min | both |
| 8 | [🗄️ Container Registry — Push to GHCR](08-container-registry-push-to-ghcr.md) | Sign in, tag by SHA/version, publish your images | 30 min | both |
| 9 | [🔐 Environments, Secrets & Variables](09-environments-secrets-and-variables.md) | staging vs production, secrets, protected environments | 30 min | both |
| 10 | [🟠 Deploy to Staging (CD)](10-deploy-to-staging.md) | SSH to a server, pull + compose up, health check | 45 min | both |
| 11 | [🔴 Deploy to Production](11-deploy-to-production.md) | Release tags, approval gate, promote staging → prod | 40 min | both |
| 12 | [⏪ Rollback & Deployment Strategies](12-rollback-and-deployment-strategies.md) | Redeploy any version, blue-green / rolling concepts | 35 min | both |
| 13 | [🛡️ Quality Gates & Branch Protection](13-quality-gates-branch-protection.md) | Protected branches, badges, notifications, Dependabot | 30 min | both |
| 14 | [🏁 The Final Pipeline & Portfolio Story](14-final-pipeline-and-portfolio-story.md) | One push → live from scratch, cleanup, interview pitch | 25 min | both |

---

## 📸 Proof of work (your screenshot evidence)

Each milestone has exactly **one screenshot placeholder** embedded at the step
where the proof matters. What you do at every checkpoint:

1. Run the milestone's commands ✅
2. Take the suggested screenshot 🖼️
3. Overwrite the placeholder in **`docs/screenshots/`** with your real image
4. Commit — your repo now *shows* you did it 🏆

```
docs/screenshots/
├── 01-git-branching.png        ← git graph showing branches + PR (M1)
├── 02-build-frontend.png       ← the React app rendering (M2)          🅱️
├── 03-build-backend.png        ← curl POST+GET round-trip (M3)         🅱️
├── 04-docker-up.png            ← compose ps: all 3 healthy (M4)        🅱️
├── 05-local-tests.png          ← "N tests passed / skipped" locally  (M5)
├── 06-first-workflow.png       ← your first green Actions run        (M6)
├── 07-ci-pipeline.png          ← all CI jobs green + scan tab clean? (M7)
├── 08-ghcr-images.png          ← your packages listed on GHCR        (M8)
├── 09-environments-secrets.png ← Environments page with staging/prod (M9)
├── 10-staging-deploy.png       ← staging server shows the new commit  (M10)
├── 11-production-deploy.png    ← workflow run with "Approval" step + live prod (M11)
├── 12-rollback.png             ← rollback run finished green          (M12)
├── 13-branch-protection.png    ← branch protection rules on main      (M13)
└── 14-final-pipeline.png       ← THE money shot: one push → live      (M14)
```

---

## 🎬 The story in 1 minute

```
THE OLD WAY:
  you (manually):  build image → push to Docker Hub → ssh to server
                   → compose up → pray it works 😬

THE PIPELINE WAY (this project):
  you push ──▶ GitHub Actions ──▶ CI checks ──▶ registry ──▶ CD deploy ──▶ verified
  the pipeline does EVERYTHING between the push and the live site.
```

In more detail:

```text
git push
   │
   ▼
CI — checks your work
   ├─ lint the code 🧹
   ├─ run unit tests 🧪
   ├─ run DB integration tests 🗄️
   ├─ build the app 🏗️
   ├─ build Docker images 🐳
   └─ scan for vulnerabilities 🛡️
   │
   ▼   (only if everything is green)
Container Registry (GHCR) 🗄️
   │
   ▼   (CD — the deployment part)
Environments
   ├─ staging (every merge to main) 🟠
   └─ production (release tags + approval) 🔴
   │
   ▼
Health Check — curl /api/health 🏥
   └─ up? ✅ done | down? ❌ fail loudly
```

---

## 🧭 CI vs CD — the two halves (get this right first)

| | 🔨 CI (Continuous Integration) | 🚀 CD (Continuous Deployment/Delivery) |
|---|------------------------------|---------------------------------------|
| **Runs on** | every push + every PR | specific events (merge to main, release tag) |
| **Job** | Lint, test, build, scan | Deploy the verified artifact |
| **Catches** | "code is broken" before merge | "deploy broke the site" after merge |
| **Blocked by** | a failing test | a failed CI **or** a human approval gate |
| **Keywords** | "prove it works" | "ship what you proved" |

Good CD is impossible without good CI — that's why the CI milestones (5–8)
come before the CD milestones (10–11).

---

## 📁 The pipeline's file structure

```
ci-cd-pipeline-app/
├── .github/workflows/
│   ├── ci.yml                 ← CI: lint, test, build, scan (M6, M7)
│   ├── build-and-push.yml     ← publish images to GHCR (M8)
│   ├── deploy-staging.yml     ← auto-deploy main → staging (M10)
│   ├── deploy-production.yml  ← release tag + approval → prod (M11)
│   └── rollback.yml           ← redeploy any old tag (M12)
├── backend/
│   └── src/
│       ├── app.js             ← the Express app (exported!) (M3/M5)
│       ├── index.js           ← entry point (starts the server) (M3/M5)
│       ├── app.test.js        ← unit tests, no DB (M5)
│       └── db.test.js         ← integration tests, needs Postgres (M5)
├── frontend/                  ← React + Nginx (M2)
├── deploy/
│   ├── docker-compose.prod.yml ← compose file that LIVES on servers (M10)
│   └── deploy.sh               ← pull → up → health check → prune (M10)
└── docker-compose.yml         ← db + backend + frontend (M4)
```

> 💡 Every file above is **annotated line-by-line with beginner comments** —
> open them as you read the milestones.

---

## ⚡ Rules for following this guide

1. Do the **non-skipped** milestones **in order** — each builds on the last.
2. Run **every command** — don't skip checkpoints.
3. Red/error output isn't always failure — some milestones *expect* an error and
   the guide says when.
4. GitHub's UI changes over time — the *concepts* don't. If a button moved, look
   for the equivalent one.
5. Milestones 1 and 5–9 are all free on a **free GitHub account** (GitHub
   Actions: 2,000 minutes/month). Milestones 10–11 need one or two cheap
   servers (one server can run both environments — the guide shows how).
6. On **Option 2**, the committed app files are your reference answer — build
   yours, then compare.

---

## 🎓 What you'll be able to say at the end

> 💬 *"I built a CI/CD pipeline on GitHub Actions that tests, builds, scans, and
> deploys a full-stack application to staging and production — automatically,
> with health checks and rollback."*

---

🚀 **Start here:** [Milestone 1 — Setup, Git Branching & Pull Requests](01-setup-git-branching-and-pull-requests.md) → both options start the same way.