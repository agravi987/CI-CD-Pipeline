# 🔁 CI/CD Pipeline — Learning Guide

Learn CI/CD end-to-end: **make an app testable → gate every PR with automated checks → build & security-scan Docker images → push to a registry → deploy to staging and production → rollback when needed**. 🚀

---

## 🧭 Choose Your Path

This guide serves **two kinds of learners**. Pick the one that matches you:

### 🅰️ Option 1 — "I already have / want to use the app" (recommended, fastest)

The full-stack app (React + Nginx, Node/Express, PostgreSQL — containerized) is
**already in this repo**. You don't build it; you **automate it**.

```text
Follow Milestone 1 (git setup) ──▶ jump to Milestone 5 (make it testable) ──▶
continue through Milestone 14.  Total: ~6 hours. ⏱️
```

| Skip 💨 | Do from 💪 |
|---------|-----------|
| Milestones 2–4 (building the app by hand) | [M1 → Setup](01-setup-git-branching-and-pull-requests.md) → [M5 → Make it Testable](05-make-the-app-testable.md) → … → [M14 → Final Pipeline](14-final-pipeline-and-portfolio-story.md) |

> ✅ The app files in `ci-cd-pipeline-app/` are *your starting point*, not the answer key —
> it's a known-good Project 2 result for you to run and improve.

### 🅱️ Option 2 — "I want to build the app myself too" (full journey)

Follow every milestone **in order**. Milestones 2–4 walk you through building
the frontend, backend + database, and containerizing it with Docker Compose —
the same app that Option 1 starts with. Then the pipeline milestones kick in.

```text
Follow Milestones 1 through 14, straight through.  Total: ~8.5 hours. ⏱️
```

| Step | What you build |
|------|----------------|
| [M2 → Build the Frontend](02-build-the-app-frontend.md) | React + Vite message-wall UI |
| [M3 → Build the Backend & Database](03-build-the-app-backend.md) | Express API + PostgreSQL |
| [M4 → Containerize & Docker Compose](04-containerize-with-docker.md) | Dockerfiles + compose → `docker compose up` |

> 💡 The completed files already in the repo are your **spec AND answer key** —
> type the code yourself to learn, then compare when you're stuck.

---

## 🗺️ The Journey (14 Milestones)

| # | 🏁 Milestone | What you do | ⏱️ | Path |
|---|-----------|-------------|------|------|
| 1 | [🌿 Setup, Git Branching & Pull Requests](01-setup-git-branching-and-pull-requests.md) | Repo, feature branches, the PR flow pipelines hook into | 30 min | 🅰️+🅱️ |
| 2 | [🎨 Build the Frontend (React)](02-build-the-app-frontend.md) | Vite + React message wall, dev proxy to the API | 40 min | 🅱️ |
| 3 | [🐘 Build the Backend & Database](03-build-the-app-backend.md) | Express API, PostgreSQL table, curl round-trip | 45 min | 🅱️ |
| 4 | [🐳 Containerize & Docker Compose](04-containerize-with-docker.md) | Multi-stage Dockerfiles, Nginx, one-command stack | 45 min | 🅱️ |
| 5 | [🧪 Make the App Testable](05-make-the-app-testable.md) | Unit + integration tests, run them locally | 35 min | 🅰️+🅱️ |
| 6 | [⚙️ Your First Workflow](06-your-first-workflow.md) | GitHub Actions anatomy + CI that runs on every PR | 40 min | 🅰️+🅱️ |
| 7 | [🏗️ The Full CI Pipeline](07-the-full-ci-pipeline.md) | Docker builds, Trivy security scan, SBOM artifacts | 40 min | 🅰️+🅱️ |
| 8 | [🗄️ Container Registry — Push to GHCR](08-container-registry-push-to-ghcr.md) | Sign in, tag by SHA/version, publish your images | 30 min | 🅰️+🅱️ |
| 9 | [🔐 Environments, Secrets & Variables](09-environments-secrets-and-variables.md) | staging vs production, secrets, protected environments | 30 min | 🅰️+🅱️ |
| 10 | [🟠 Deploy to Staging (CD)](10-deploy-to-staging.md) | SSH to a server, pull + compose up, health check | 45 min | 🅰️+🅱️ |
| 11 | [🔴 Deploy to Production](11-deploy-to-production.md) | Release tags, approval gate, promote staging → prod | 40 min | 🅰️+🅱️ |
| 12 | [⏪ Rollback & Deployment Strategies](12-rollback-and-deployment-strategies.md) | Redeploy any version, blue-green / rolling concepts | 35 min | 🅰️+🅱️ |
| 13 | [🛡️ Quality Gates & Branch Protection](13-quality-gates-branch-protection.md) | Protected branches, badges, notifications, Dependabot | 30 min | 🅰️+🅱️ |
| 14 | [🏁 The Final Pipeline & Portfolio Story](14-final-pipeline-and-portfolio-story.md) | One push → live from scratch, cleanup, interview pitch | 25 min | 🅰️+🅱️ |

- **🅰️ Option 1 total: ~6 hours** (Skip M2–4.)
- **🅱️ Option 2 total: ~8.5 hours** (All 14.)

---

## 📸 Proof of Work (Evidence of Your Build)

Every milestone contains **exactly one screenshot placeholder**, embedded
inline at the step where the proof matters. Your job at each checkpoint:

1. Run the commands in that milestone ✅
2. Take the suggested screenshot 🖼️
3. Overwrite the placeholder in **`docs/screenshots/`** with your real image
4. Commit — your repo now *shows* you actually did it 🏆

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

The image sits right at the command it proves. Replace the placeholder, keep
the filename, commit. Done. 🏆

---

## 🎬 The Simple Story (2 minute read)

```
THE OLD WAY (Project 2)
  you:      build image → push to Docker Hub → ssh to server → compose up → pray
  react to: "it works on my machine" 😬

THE PIPELINE WAY (this project)
  you push ──▶ GitHub Actions ──▶ staged checks ──▶ registry ──▶ auto deploy ──▶ verified
  and the pipeline does EVERYTHING between the push and the live site.
```

The same app you containerized in Project 2 — now with a machine doing the boring,
error-prone, repeatable part:

```
git push
   │
   ▼
CI (checks your work)
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

## ⚡ Rules for following this guide

1. Do the **non-skipped** milestones **in order** — each one builds on the last.
2. Run **every command**. Don't skip the checkpoints.
3. Red/error output is not always failure — the guide says when.
4. GitHub UI changes slightly over time — the *concepts* here don't. If a button moved, look for the equivalent one.
5. Milestones 1 and 5–9 are all free with a **free GitHub account** — GitHub Actions gives you 2,000 minutes/month. Milestones 10–11 need two cheap servers (or one server running both envs — the guide shows both).
6. On **Option 2**, the committed app files are your reference answer — build yours, then compare.

---

## 🧭 CI vs CD — the two halves (get this right up front)

| | 🔨 CI (Continuous Integration) | 🚀 CD (Continuous Deployment/Delivery) |
|---|------------------------------|---------------------------------------|
| **Runs on** | every push + every PR | specific events (merge to main, release tag) |
| **Job** | Lint, test, build, scan | Deploy the verified artifact |
| **Catches** | "code is broken" before it's merged | "deploy broke the site" after a merge |
| **Blocked by** | a failing test | a failed CI **or** a human approval gate |
| **Keyword** | "prove it works" | "ship the thing you proved" |

You cannot have good CD without good CI — that's why Milestones 5–8 (all CI)
come before Milestones 10–11 (all CD).

---

## 📁 The Pipeline's File Structure

```
ci-cd-pipeline-app/
├── .github/workflows/
│   ├── ci.yml                 ← CI: lint, test, build, scan        (M6, M7)
│   ├── build-and-push.yml     ← publish images to GHCR             (M8)
│   ├── deploy-staging.yml     ← auto-deploy main → staging         (M10)
│   ├── deploy-production.yml  ← release tag + approval → prod      (M11)
│   └── rollback.yml           ← redeploy any old tag (SSH)         (M12)
├── backend/
│   └── src/
│       ├── app.js             ← the Express app (exported!)        (M3/M5)
│       ├── index.js           ← entry point (starts the server)    (M3/M5)
│       ├── app.test.js        ← unit tests, no DB                  (M5)
│       └── db.test.js         ← integration tests, needs Postgres  (M5)
├── frontend/                  ← React + Nginx (lint + build in CI) (M2)
├── deploy/
│   ├── docker-compose.prod.yml ← compose file that LIVES on servers (M10)
│   └── deploy.sh               ← pull → up → health check → prune    (M10)
└── docker-compose.yml         ← db + backend + frontend             (M4)
```

---

## 🎓 What you'll be able to say at the end

> 💬 *"I built a CI/CD pipeline on GitHub Actions that tests, builds, scans, and
> deploys a full-stack application to staging and production — automatically,
> with health checks and rollback."*

---

🚀 **Start here:** [Milestone 1 — Setup, Git Branching & Pull Requests](01-setup-git-branching-and-pull-requests.md) (both options start the same way)