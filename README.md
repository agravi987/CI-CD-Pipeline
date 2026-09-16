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

## 📚 The 11 Milestones

Follow them **in order**. Each one builds on the previous, has runnable commands, and ends with a checkpoint.

| # | 🏁 Milestone | ⏱️ |
|---|--------------|-----|
| 1 | [Setup, Git Branching & Pull Requests](docs/01-setup-git-branching-and-pull-requests.md) | ~30 min |
| 2 | [Make the App Testable](docs/02-make-the-app-testable.md) | ~35 min |
| 3 | [Your First Workflow](docs/03-your-first-workflow.md) | ~40 min |
| 4 | [The Full CI Pipeline — Build & Security Scan](docs/04-the-full-ci-pipeline.md) | ~40 min |
| 5 | [Container Registry — Push Images to GHCR](docs/05-container-registry-push-to-ghcr.md) | ~30 min |
| 6 | [Environments, Secrets & Variables](docs/06-environments-secrets-and-variables.md) | ~30 min |
| 7 | [Deploy to Staging (CD)](docs/07-deploy-to-staging.md) | ~45 min |
| 8 | [Deploy to Production](docs/08-deploy-to-production.md) | ~40 min |
| 9 | [Rollback & Deployment Strategies](docs/09-rollback-and-deployment-strategies.md) | ~35 min |
| 10 | [Quality Gates — Branch Protection, Badges & Alerts](docs/10-quality-gates-branch-protection.md) | ~30 min |
| 11 | [The Final Pipeline & Portfolio Story](docs/11-final-pipeline-and-portfolio-story.md) | ~25 min |

**Total: ~6 hours** of hands-on building. Every milestone ends with a checkpoint and a screenshot.

> 📸 **Proof of Work:** each milestone has a screenshot placeholder embedded
> inline at the step it proves, in [`docs/screenshots/`](docs/screenshots/).
> Do the milestone → replace the placeholder with your real screenshot → your
> repo proves you built it.

---

## 🚀 Quick Start (After Milestone 3)

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
#    (Milestone 3 explains every colored box you'll see)
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
├── docs/                      ← The 11-part step-by-step milestone guide
│   └── screenshots/           ← Replace placeholder images with proof
└── ci-cd-pipeline-app/        ← The app + the pipeline that ships it
    ├── .github/workflows/     ← THE PIPELINE (all YAML)
    │   ├── ci.yml                 lint + test + build app/images + Trivy
    │   ├── build-and-push.yml     tags + pushes images to GHCR
    │   ├── deploy-staging.yml     SSH deploy to staging + health check
    │   ├── deploy-production.yml  SSH deploy to prod (approval-gated)
    │   └── rollback.yml           one-click rollback to any image tag
    ├── backend/               ← Express API (reused from Project 2) + tests
    │   └── src/
    │       ├── app.js         ← the Express app (exported for tests)
    │       ├── index.js       ← entry point (starts the server)
    │       ├── db.js
    │       ├── app.test.js    ← unit tests (no database needed)
    │       └── db.test.js     ← integration tests (use Postgres)
    ├── frontend/              ← React + Nginx (reused from Project 2)
    ├── database/
    │   └── init.sql
    ├── deploy/                ← what runs ON the servers
    │   ├── docker-compose.prod.yml   ← pulls images from GHCR
    │   └── deploy.sh                 ← pull → up → health check → prune
    ├── docker-compose.yml
    ├── docker-compose.dev.yml
    └── .env.example
```

---

## 🎓 What You Will Be Able To Say After This

> *"I automated the delivery pipeline for a full-stack app with GitHub Actions:
> every push runs lint, unit and database tests, builds Docker images, scans
> them with Trivy, pushes them to GHCR, and deploys them to staging and
> production environments — production gated behind a release tag and a manual
> approval — with health-checked deployments and one-tap rollback."*

That sentence is exactly what a DevOps / Platform / Release Engineer interview loves. 🚀