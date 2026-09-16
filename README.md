# 🔁 CI/CD Pipeline

> **Last Updated:** September 16, 2026
> **Portfolio Project 3 — GitHub Actions + Docker + GHCR + Automated Deploys**

---

## 🎯 Project Overview

Take the full-stack app you containerized in **Project 2** and give it a delivery pipeline:

> **Every time you push code, the pipeline automatically lints it, runs the tests, builds Docker images, security-scans them, pushes them to a registry, and deploys them — with a health check at the end.** 🔁

```text
Developer
    ↓  git push  /  open a Pull Request
GitHub  (your repo + Actions runners)
    ↓
CI Pipeline            ← lint → unit tests → build app → build Docker images →
    ↓                    security scan (Trivy) → SBOM artifacts
Container Registry     ← GHCR (ghcr.io/you/cicd-backend & .../cicd-frontend)
    ↓
CD Pipeline            ← SSH to server → docker compose pull + up
    ↓
Environments           ← staging (auto)  →  production (release + approval)
    ↓
Health Check           ← curl /api/health — it has to be UP, or the deploy fails
```

This is the moment you stop saying *"I know Docker"* and can say
*"I can automate software delivery."* ⭐

---

## 🛠️ Tech Stack

| Component | Technology | Purpose |
|-----------|-----------|---------|
| 🔁 CI/CD Engine | **GitHub Actions** | The pipeline behind GitHub |
| 🧱 Containers | Docker + Buildx (multi-arch, layer cache) | Reproducible app images |
| 🗄️ Registry | **GHCR** (GitHub Container Registry) | Stores every image version |
| 🛡️ Security | Trivy (aquasecurity/trivy-action) | Image vulnerability scan + SBOM |
| 🧪 Tests | Node.js (`node --test` + built-in fetch) | Automated unit + integration tests |
| 🌐 SSH Deploy | appleboy/ssh-action + a plain `deploy.sh` | Sends `docker compose up` to your servers |
| 🎨⚡🐘 The app | React (Nginx) + Node/Express + PostgreSQL | Reused from Project 2 — now shipped by a pipeline |

---

## 🏟️ The Three Environments

```text
🟡 DEVELOPMENT                    🟠 STAGING                        🔴 PRODUCTION
dev branch + PRs                  main branch                       v1.2.3 release tag
CI runs on every PR               CI + CD run here                  CI + CD run here
nothing deploys                   auto-deploys                      deploys ONLY with approval
(lint/test/build/scan)            (every merge to main)             (release tag + human approval)
```

- **development** — developers' sandbox. The pipeline *checks* every PR but never deploys on its own.
- **staging** — a live server that mimics production. Every merge to `main` lands here automatically.
- **production** — real users. Only a versioned **release tag** (`v1.2.3`) can deploy, and a protected environment blocks it until a human approves. 🔐

---

## ✨ What Makes This "Real World" (Not a Toy)

| Practice | Why It Matters |
|----------|----------------|
| 🚦 **CI gates your PRs** | Lint/tests/security must pass — GitHub blocks the merge button |
| 🧪 **Real tests, not "it compiles"** | Node unit tests + PostgreSQL-backed integration tests |
| 🖼️ **Images tagged by commit SHA** | Every deploy is traceable to the exact commit |
| 🔐 **GHCR + `GITHUB_TOKEN`** | Images shared without exposing your Docker Hub password |
| 🛡️ **Trivy scan fails the build** | Critical/high CVEs stop the pipeline before deploy |
| 📦 **SBOM artifacts** | You can list every package inside each image |
| 🌍 **Protected environments** | Production deploy needs approval — not just a push |
| 🏷️ **Release-tag CD** | `v1.2.3` → promote; `git push` alone never touches prod |
| 🏥 **Health-checked deploys** | The pipeline rolls nothing forward if `/api/health` is down |
| ⏪ **One-tap rollback** | Redeploy any earlier tag when something goes wrong |

---

## 📚 The 14 Milestones

Pick your path first — both start at Milestone 1 and converge at Milestone 5.

### 🅰️ Option 1 — Use the included app (fastest)

The app is already in `ci-cd-pipeline-app/` (Project 2's result). Do
**M1 → skip M2–4 → M5 … M14**. Total: **~6 hours**.

### 🅱️ Option 2 — Build the app yourself too (full journey)

Milestones **2–4** teach you to build the frontend, backend + database, and
containerize them before the CI/CD part starts. Do **M1 → M14** in order.
Total: **~8.5 hours**.

| # | 🏁 Milestone | ⏱️ | Path |
|---|--------------|-----|------|
| 1 | [Setup, Git Branching & Pull Requests](docs/01-setup-git-branching-and-pull-requests.md) | ~30 min | both |
| 2 | [Build the Frontend (React)](docs/02-build-the-app-frontend.md) | ~40 min | 🅱️ |
| 3 | [Build the Backend & Database](docs/03-build-the-app-backend.md) | ~45 min | 🅱️ |
| 4 | [Containerize & Docker Compose](docs/04-containerize-with-docker.md) | ~45 min | 🅱️ |
| 5 | [Make the App Testable](docs/05-make-the-app-testable.md) | ~35 min | both |
| 6 | [Your First Workflow](docs/06-your-first-workflow.md) | ~40 min | both |
| 7 | [The Full CI Pipeline](docs/07-the-full-ci-pipeline.md) | ~40 min | both |
| 8 | [Container Registry — Push to GHCR](docs/08-container-registry-push-to-ghcr.md) | ~30 min | both |
| 9 | [Environments, Secrets & Variables](docs/09-environments-secrets-and-variables.md) | ~30 min | both |
| 10 | [Deploy to Staging (CD)](docs/10-deploy-to-staging.md) | ~45 min | both |
| 11 | [Deploy to Production](docs/11-deploy-to-production.md) | ~40 min | both |
| 12 | [Rollback & Deployment Strategies](docs/12-rollback-and-deployment-strategies.md) | ~35 min | both |
| 13 | [Quality Gates — Branch Protection, Badges & Alerts](docs/13-quality-gates-branch-protection.md) | ~30 min | both |
| 14 | [The Final Pipeline & Portfolio Story](docs/14-final-pipeline-and-portfolio-story.md) | ~25 min | both |

Every milestone ends with a checkpoint and a screenshot.

> 📸 **Proof of Work:** each milestone has a screenshot placeholder embedded
> inline at the step it proves, in [`docs/screenshots/`](docs/screenshots/).
> Do the milestone → replace the placeholder with your real screenshot → your
> repo proves you built it.

---

## 🚀 Quick Start (After Milestone 6)

```bash
# 1. Create your GitHub repo (empty, no README)
# 2. Push this project to it
git init
git add .
git commit -m "init: CI/CD pipeline project"
git branch -M main
git remote add origin https://github.com/<YOU>/<REPO>.git
git push -u origin main

# 3. Open the repo → Actions tab → the CI run starts automatically
#    (Milestone 6 explains every colored box you'll see)
```

Watch a push become a deploy, end to end:

```text
git push → CI runs → tests pass → images build & scan → GHCR → staging → approval → production → /api/health ✅
```

---

## 📁 Project Structure

```
CI-CD Pipeline/
├── README.md                  ← You are here
├── docs/                      ← The 14-part step-by-step milestone guide (two paths inside)
│   ├── 01-…-14-….md               M1–M14: build the app (M2–M4, Option 2) → pipeline (M5–M14)
│   └── screenshots/           ← Replace placeholder images with proof
└── ci-cd-pipeline-app/        ← The app + the pipeline that ships it
    ├── .github/workflows/     ← THE PIPELINE (all YAML)
    │   ├── ci.yml                 lint + test + build app/images + Trivy       (M6, M7)
    │   ├── build-and-push.yml     tags + pushes images to GHCR                 (M8)
    │   ├── deploy-staging.yml     SSH deploy to staging + health check         (M10)
    │   ├── deploy-production.yml  SSH deploy to prod (approval-gated)          (M11)
    │   └── rollback.yml           one-click rollback to any image tag          (M12)
    ├── backend/               ← Express API (built in M3 / started from Project 2 in Option 1) + tests
    │   └── src/
    │       ├── app.js         ← the Express app (exported for tests)           (M3/M5)
    │       ├── index.js       ← entry point (starts the server)                (M3/M5)
    │       ├── db.js                                                           (M3)
    │       ├── app.test.js    ← unit tests (no database needed)                (M5)
    │       └── db.test.js     ← integration tests (use Postgres)               (M5)
    ├── frontend/              ← React + Nginx (built in M2 / reused in Option 1) (M2, M4)
    ├── database/
    │   └── init.sql                                                             (M3/M4)
    ├── deploy/                ← what runs ON the servers
    │   ├── docker-compose.prod.yml   ← pulls images from GHCR                  (M10)
    │   └── deploy.sh                 ← pull → up → health check → prune        (M10)
    ├── docker-compose.yml                                                        (M4)
    ├── docker-compose.dev.yml                                                    (M4)
    └── .env.example                                                              (M4)
```

---

## 🎓 What You Will Be Able To Say After This

> *"I automated the delivery pipeline for a full-stack app with GitHub Actions:
> every push runs lint, unit and database tests, builds Docker images, scans
> them with Trivy, pushes them to GHCR, and deploys them to staging and
> production environments — production gated behind a release tag and a manual
> approval — with health-checked deployments and one-tap rollback."*

That sentence is exactly what a DevOps / Platform / Release Engineer interview loves. 🚀