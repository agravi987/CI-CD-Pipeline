# 🔁 CI/CD Pipeline — Learning Guide

Learn CI/CD end-to-end: **make an app testable → gate every PR with automated checks → build & security-scan Docker images → push to a registry → deploy to staging and production → rollback when needed**. 🚀

---

## 🗺️ The Journey (11 Milestones)

| # | 🏁 Milestone | What you do | ⏱️ Time |
|---|-----------|-------------|------|
| 1 | [🌿 Setup, Git Branching & Pull Requests](01-setup-git-branching-and-pull-requests.md) | Repo, feature branches, the PR flow that pipelines hook into | 30 min |
| 2 | [🧪 Make the App Testable](02-make-the-app-testable.md) | Write unit + integration tests, run them locally | 35 min |
| 3 | [⚙️ Your First Workflow](03-your-first-workflow.md) | GitHub Actions anatomy + CI that runs on every PR | 40 min |
| 4 | [🏗️ The Full CI Pipeline](04-the-full-ci-pipeline.md) | Docker builds, Trivy security scan, SBOM artifacts | 40 min |
| 5 | [🗄️ Container Registry — Push to GHCR](05-container-registry-push-to-ghcr.md) | Sign in, tag by SHA/version, publish your images | 30 min |
| 6 | [🔐 Environments, Secrets & Variables](06-environments-secrets-and-variables.md) | staging vs production, secrets, protected environments | 30 min |
| 7 | [🟠 Deploy to Staging (CD)](07-deploy-to-staging.md) | SSH to a server, pull + compose up, health check | 45 min |
| 8 | [🔴 Deploy to Production](08-deploy-to-production.md) | Release tags, approval gate, promote staging → prod | 40 min |
| 9 | [⏪ Rollback & Deployment Strategies](09-rollback-and-deployment-strategies.md) | Redeploy any version, blue-green / rolling concepts | 35 min |
| 10 | [🛡️ Quality Gates & Branch Protection](10-quality-gates-branch-protection.md) | Protected branches, badges, notifications, Dependabot | 30 min |
| 11 | [🏁 The Final Pipeline & Portfolio Story](11-final-pipeline-and-portfolio-story.md) | One push → live from scratch, cleanup, interview pitch | 25 min |

**Total: ~6 hours.**

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
├── 02-local-tests.png          ← "N tests passed / skipped" locally  (M2)
├── 03-first-workflow.png       ← your first green Actions run        (M3)
├── 04-ci-pipeline.png          ← all CI jobs green + scan tab clean? (M4)
├── 05-ghcr-images.png          ← your packages listed on GHCR        (M5)
├── 06-environments-secrets.png ← Environments page with staging/prod (M6)
├── 07-staging-deploy.png       ← staging server shows the new commit  (M7)
├── 08-production-deploy.png    ← workflow run with "Approval" step + live prod (M8)
├── 09-rollback.png             ← rollback run finished green          (M9)
├── 10-branch-protection.png    ← branch protection rules on main      (M10)
└── 11-final-pipeline.png       ← THE money shot: one push → live      (M11)
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

1. Do the milestones **in order** — each one builds on the last.
2. Run **every command**. Don't skip the checkpoints.
3. Red/error output is not always failure — the guide says when.
4. GitHub UI changes slightly over time — the *concepts* here don't. If a button moved, look for the equivalent one.
5. Milestones 1–6 are all free with a **free GitHub account** — GitHub Actions gives you 2,000 minutes/month. Milestones 7–8 need two cheap servers (or one server running both envs — the guide shows both).

---

## 🧭 CI vs CD — the two halves (get this right up front)

| | 🔨 CI (Continuous Integration) | 🚀 CD (Continuous Deployment/Delivery) |
|---|------------------------------|---------------------------------------|
| **Runs on** | every push + every PR | specific events (merge to main, release tag) |
| **Job** | Lint, test, build, scan | Deploy the verified artifact |
| **Catches** | "code is broken" before it's merged | "deploy broke the site" after a merge |
| **Blocked by** | a failing test | a failed CI **or** a human approval gate |
| **Keyword** | "prove it works" | "ship the thing you proved" |

You cannot have good CD without good CI — that's why Milestones 2–5 (all CI)
come before Milestones 7–8 (all CD).

---

## 📁 The Pipeline's File Structure

```
ci-cd-pipeline-app/
├── .github/workflows/
│   ├── ci.yml                 ← CI: lint, test, build, scan        (M3, M4)
│   ├── build-and-push.yml     ← publish images to GHCR             (M5)
│   ├── deploy-staging.yml     ← auto-deploy main → staging         (M7)
│   ├── deploy-production.yml  ← release tag + approval → prod      (M8)
│   └── rollback.yml           ← redeploy any old tag (SSH)         (M9)
├── backend/
│   └── src/
│       ├── app.js             ← the Express app (exported!)        (M2)
│       ├── index.js           ← entry point (starts the server)    (M2)
│       ├── app.test.js        ← unit tests, no DB                  (M2)
│       └── db.test.js         ← integration tests, needs Postgres  (M2)
├── frontend/                  ← React + Nginx (lint + build in CI)
├── deploy/
│   ├── docker-compose.prod.yml ← compose file that LIVES on servers (M7)
│   └── deploy.sh               ← pull → up → health check → prune    (M7)
└── docker-compose.yml
```

---

## 🎓 What you'll be able to say at the end

> 💬 *"I built a CI/CD pipeline on GitHub Actions that tests, builds, scans, and
> deploys a full-stack application to staging and production — automatically,
> with health checks and rollback."*

---

🚀 **Start here:** [Milestone 1 — Setup, Git Branching & Pull Requests](01-setup-git-branching-and-pull-requests.md)