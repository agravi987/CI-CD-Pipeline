# 🗄️ Milestone 8 — Container Registry: Push to GHCR

## 🎯 Goal

CI has *built* your images — now make it *publish* them to **GHCR** (GitHub
Container Registry), tagged by commit SHA and version. This is the handoff
between the CI half and the CD half: the registry is where deployments pull
from. 🚚

---

## 🧠 GHCR vs Docker Hub

| | Docker Hub | GHCR |
|---|-----------|------|
| Where | hub.docker.com | ghcr.io (inside GitHub) |
| Auth | Docker Hub token | `GITHUB_TOKEN` (auto-generated per run) |
| Permissions | Manage separately | Managed by GitHub (packages tab) |
| Private packages | Paid plans | **Public AND private: forever free** 💸 |

For a portfolio project, GHCR is the obvious pick — no separate account, no paid
subscription, and the credentials come free from GitHub on every run.

---

## 📝 Step 1 — Understand image naming + tags

```
ghcr.io/<owner>/<image-name>:<tag>
        └──────────────┬──────────────┘
                 name + optional tag (default: latest)
```

Your images: `ghcr.io/<YOU>/cicd-backend` and `ghcr.io/<YOU>/cicd-frontend`.

The **tag** is your version story. We'll set three reliably:

| Tag | Meaning | Used for |
|-----|---------|----------|
| `sha-abc1234` | Tied to one exact commit | Precise deploys + rollback |
| `v1.2.3` | Human-meaningful release | Production promotes this |
| `latest` | The most recent `main` | Quick demos |

Never re-tag without re-building — the tag must *prove* which commit it came from.

---

## 📝 Step 2 — Write `build-and-push.yml`

Create **`.github/workflows/build-and-push.yml`**:

```yaml
name: Build & Push Images to GHCR

on:
  push:
    branches: [main]
    tags: ["v*"]
  workflow_dispatch:

env:
  REGISTRY: ghcr.io
  BACKEND_IMAGE: ghcr.io/${{ github.repository_owner }}/cicd-backend
  FRONTEND_IMAGE: ghcr.io/${{ github.repository_owner }}/cicd-frontend

jobs:
  build-push:
    name: "Build & Push to GHCR"
    runs-on: ubuntu-latest
    permissions:
      contents: read
      packages: write          # ← REQUIRED to push images
    steps:
      - uses: actions/checkout@v4
      - uses: docker/setup-buildx-action@v3

      - name: Log in to GHCR
        uses: docker/login-action@v3
        with:
          registry: ghcr.io
          username: ${{ github.actor }}
          password: ${{ secrets.GITHUB_TOKEN }}

      - name: Set image tags
        id: meta
        run: |
          SHA_SHORT="${GITHUB_SHA::7}"
          if [[ "$GITHUB_REF" == refs/tags/v* ]]; then
            TAG="${GITHUB_REF#refs/tags/}"
            BACKEND_TAGS="${BACKEND_IMAGE}:${TAG},${BACKEND_IMAGE}:sha-${SHA_SHORT},${BACKEND_IMAGE}:latest"
            FRONTEND_TAGS="${FRONTEND_IMAGE}:${TAG},${FRONTEND_IMAGE}:sha-${SHA_SHORT},${FRONTEND_IMAGE}:latest"
          else
            BACKEND_TAGS="${BACKEND_IMAGE}:sha-${SHA_SHORT},${BACKEND_IMAGE}:latest"
            FRONTEND_TAGS="${FRONTEND_IMAGE}:sha-${SHA_SHORT},${FRONTEND_IMAGE}:latest"
          fi
          echo "backend-tag=$BACKEND_TAGS" >> "$GITHUB_OUTPUT"
          echo "frontend-tag=$FRONTEND_TAGS" >> "$GITHUB_OUTPUT"
```

### Two things to notice

- `permissions: packages: write` — the pipeline asks GitHub for permission to
  write packages, using your **repository's token**. No password anywhere. 🔐
- The tag step is a plain bash script: pick tags, write them to
  `GITHUB_OUTPUT`, the next step reads them. That's the standard "compute tags
  in one step, use them in the next" pattern.

---

## 📝 Step 3 — Add the build + push steps

```yaml
      - name: Build & push backend
        uses: docker/build-push-action@v6
        with:
          context: ci-cd-pipeline-app/backend
          target: runtime
          push: true              # ← true = publish (was false in CI)
          tags: ${{ steps.meta.outputs.backend-tag }}
          cache-from: type=gha
          cache-to: type=gha,mode=max

      - name: Build & push frontend
        uses: docker/build-push-action@v6
        with:
          context: ci-cd-pipeline-app/frontend
          target: serve
          push: true
          tags: ${{ steps.meta.outputs.frontend-tag }}
          cache-from: type=gha
          cache-to: type=gha,mode=max

      - name: Print pushed images
        run: |
          echo "Backend:  ${{ steps.meta.outputs.backend-tag }}"
          echo "Frontend: ${{ steps.meta.outputs.frontend-tag }}"
```

> 🧠 Compare with Milestone 7: identical except `push: true` and real tags.
> That's the CI→registry handoff — build the same way, but *publish*.

---

## 📝 Step 4 — Make `main` and tags trigger it

Merge your PR from Milestone 1 (a `push` to `main`). Watch **Actions**: the new
workflow runs, logs in, builds, and pushes. Then open your repo →
**Packages** (or the sidebar's "Packages" link):

```
cicd-backend               cicd-frontend
  ├─ latest                  ├─ latest
  ├─ sha-abc1234             └─ sha-abc1234
  └─ (and each v-tag later)
```

> 💡 GHCR may mark newly-pushed packages as private by default. Make them
> **public** via Package → Package settings → "Change visibility" → Public —
> so the deployment servers (and your portfolio) can pull them without auth.

> 📸 **Proof of work:** saved in **`docs/screenshots/08-ghcr-images.png`** — your **Packages** page showing `cicd-backend` and `cicd-frontend` with `latest` + `sha-…` tags.
> ![Proof of work — GHCR packages](screenshots/08-ghcr-images.png)

---

## 🧯 If something breaks

| Symptom | Cause | Fix |
|---------|-------|-----|
| `denied: permission_denied ... packages` | Missing `packages: write` | Add the permissions block to the job |
| 401 during `docker login` | Old/none `GITHUB_TOKEN` | Re-run; token is per-run and fresh |
| Packages page empty | Visibility/link lag | Give it a moment, check Actions succeeded first |
| Tag is `latest` when you wanted a version | You pushed a branch, not a tag | `git tag v0.1.0 && git push origin v0.1.0` |

---

## ✅ Checkpoint

```
[ ] ✔️ build-and-push.yml exists and is committed
[ ] ✔️ Push to main produces ghcr.io images tagged sha-<short> + latest
[ ] ✔️ Packages visible (made public) for both images
[ ] ✔️ You can explain why tags = traceability
[ ] ✔️ Screenshot saved as docs/screenshots/08-ghcr-images.png
```

---

➡️ **Next:** [Milestone 9 — Environments, Secrets & Variables](09-environments-secrets-and-variables.md)