# 🔁 CI/CD Pipeline Project

> **Last Updated:** September 19, 2026
> **Beginner-friendly walkthrough of a real CI/CD pipeline.**

---

## 🤔 What is this? (plain English)

You know that boring, scary part of your job where you push code... and then
*hope* nothing breaks in production?

This project automates all of it. **Every time you push code**, GitHub
automatically:

```text
checks your code (lint + tests)   →  builds Docker images   →  security-scans them
→  saves images in a registry   →  puts them on a staging server   →  (with your
approval) puts them on the production server   →  checks the site is alive
```

That whole chain is called **CI/CD**:

- **CI** = *Continuous Integration* — "prove the code works before it ships."
- **CD** = *Continuous Delivery / Deployment* — "ship the proven code automatically."

The picture below is the whole project. If you understand this one diagram, you
understand the repo:

```text
You (developer)
   ↓  git push / open a Pull Request
GitHub Actions (your pipeline)
   ↓
CI checks        lint → tests → build app → build Docker images → Trivy scan
   ↓  (everything passed?)
Container Registry (GHCR)   ← images live here, labeled by commit
   ↓
CD deploys       SSH → pull images → docker compose up → health check
   ↓
Staging (automatic)  →  Production (only from release tag + human approval)
   ↓
Health check      curl /api/health — if "down", the deploy FAILS (no silent breaks)
```

---

## 🗺️ Where to start (5 different places to look)

| You want to… | Go to |
|---|---|
| Start learning from zero, step by step | [`docs/`](docs/) → **Milestone 1** |
| See just the pipeline files, line by line | [`ci-cd-pipeline-app/.github/workflows/`](ci-cd-pipeline-app/.github/workflows/) (every file has a comment per line) |
| Deploy manually / see how a server deploys | [`ci-cd-pipeline-app/deploy/`](ci-cd-pipeline-app/deploy/) |
| Understand the app being shipped | [`ci-cd-pipeline-app/backend/`](ci-cd-pipeline-app/backend/) + [`frontend/`](ci-cd-pipeline-app/frontend/) |
| See a 2-minute overview | Read the [`docs/README.md`](docs/README.md) |

---

## 📚 The 14-milestone learning path

The step-by-step guide lives in [`docs/`](docs/). It was written for **complete
beginners** — each milestone ends with a checklist and a screenshot to prove
you did it.

Pick your path:

- **🅰️ Fastest — use the included app** (recommended): do **Milestone 1**, skip
  2–4, continue at **Milestone 5**. Total ≈ **6 hours**.
- **🅱️ Full journey — build the app yourself too**: do **Milestones 1–14** in
  order. Total ≈ **8.5 hours**.

| # | Milestone | What you do | ⏱️ | Path |
|---|-----------|-------------|-----|------|
| 1 | [Setup, Git & Pull Requests](docs/01-setup-git-branching-and-pull-requests.md) | Repo, branches, PRs — the flow pipelines hook into | 30 min | both |
| 2 | [Build the Frontend (React)](docs/02-build-the-app-frontend.md) | Vite + React message-wall UI | 40 min | 🅱️ |
| 3 | [Build the Backend & Database](docs/03-build-the-app-backend.md) | Express API + PostgreSQL | 45 min | 🅱️ |
| 4 | [Containerize with Docker Compose](docs/04-containerize-with-docker.md) | Dockerfiles + `docker compose up` | 45 min | 🅱️ |
| 5 | [Make the App Testable](docs/05-make-the-app-testable.md) | Unit + integration tests | 35 min | both |
| 6 | [Your First Workflow](docs/06-your-first-workflow.md) | The anatomy of GitHub Actions + first CI | 40 min | both |
| 7 | [The Full CI Pipeline](docs/07-the-full-ci-pipeline.md) | Docker builds, Trivy scan, SBOMs | 40 min | both |
| 8 | [Container Registry — Push to GHCR](docs/08-container-registry-push-to-ghcr.md) | Publish images to GitHub's registry | 30 min | both |
| 9 | [Environments, Secrets & Variables](docs/09-environments-secrets-and-variables.md) | Staging vs prod, approvals | 30 min | both |
| 10 | [Deploy to Staging (CD)](docs/10-deploy-to-staging.md) | SSH deploy + health check | 45 min | both |
| 11 | [Deploy to Production](docs/11-deploy-to-production.md) | Release tags + approval gate | 40 min | both |
| 12 | [Rollback & Deployment Strategies](docs/12-rollback-and-deployment-strategies.md) | One-click undo for bad deploys | 35 min | both |
| 13 | [Quality Gates & Branch Protection](docs/13-quality-gates-branch-protection.md) | Can't merge broken code, badges, Dependabot | 30 min | both |
| 14 | [The Final Pipeline & Portfolio Story](docs/14-final-pipeline-and-portfolio-story.md) | One push → live, end to end | 25 min | both |

---

## ⚡ Quick start (only after Milestone 6)

```bash
# 1. Create an EMPTY GitHub repo (no README, no .gitignore)
# 2. Push this project to it
git init
git add .
git commit -m "init: CI/CD pipeline project"
git branch -M main
git remote add origin https://github.com/<YOU>/<REPO>.git
git push -u origin main

# 3. Open GitHub → Actions tab → the CI run starts automatically
```

That's it — a push becomes a deploy:

```text
git push → tests pass → images build & scan → GHCR → staging → approval → production → /api/health ✅
```

---

## 📁 Project structure (what lives where)

```
CI-CD Pipeline/
├── README.md                       ← you are here (the big picture)
├── docs/                           ← the 14-step beginner guide
│   ├── 01-…-14-….md                    M1–M14, each with screenshots to prove the work
│   └── screenshots/                    replace placeholders with your real proof
└── ci-cd-pipeline-app/             ← the app AND the pipeline that ships it
    ├── .github/workflows/              ← THE PIPELINE (all commented, line by line)
    │   ├── ci.yml                          CI: lint, test, build, Trivy scan   (M6, M7)
    │   ├── build-and-push.yml              build + upload images to GHCR        (M8)
    │   ├── deploy-staging.yml              SSH deploy to staging + health check (M10)
    │   ├── deploy-production.yml           SSH deploy to prod (approval-gated)  (M11)
    │   └── rollback.yml                    one-click rollback to any tag         (M12)
    ├── backend/                     ← Express API + tests (commented in-code)
    │   └── src/
    │       ├── app.js                     builds the app (exported for tests)
    │       ├── index.js                   entry point: starts the server
    │       ├── db.js                      PostgreSQL connection + table setup
    │       ├── app.test.js                unit tests (no DB)
    │       └── db.test.js                 integration tests (need Postgres)
    ├── frontend/                    ← React + Nginx (commented in-code)
    ├── database/
    │   └── init.sql                       creates the table on DB first boot
    ├── deploy/                      ← what runs ON the servers
    │   ├── docker-compose.prod.yml        compose file that pulls from GHCR
    │   └── deploy.sh                      manual deploy recipe (pull → up → check)
    ├── docker-compose.yml             ← local dev stack (builds locally)
    ├── docker-compose.dev.yml          ← dev extras (hot reload) on top of the above
    └── .env.example                    ← copy to .env, fill in your values
```

> 💡 **Every YAML, shell, and code file in `ci-cd-pipeline-app/` has beginner
> comments right beside the line it explains.** Open them before you read the
> docs — the files themselves are the line-by-line tutorial.

---

## 🎓 What you can honestly say after this project

> *"I built a CI/CD pipeline on GitHub Actions: every push runs lint, unit and
> database tests, builds Docker images, scans them with Trivy, pushes them to
> GHCR, and deploys them to staging and production — production gated behind a
> release tag and a human approval — with health-checked deployments and
> one-click rollback."*

That sentence is exactly what DevOps / Platform / Release interviewers want to
hear. 🚀

➡️ **Start here:** [docs/](docs/) → [**Milestone 1**](docs/01-setup-git-branching-and-pull-requests.md)