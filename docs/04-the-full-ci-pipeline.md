# 🏗️ Milestone 4 — The Full CI Pipeline

## 🎯 Goal

Turn CI from "tests pass" into a real gate: **build the Docker images**, scan
them for vulnerabilities with **Trivy**, and produce **SBOMs** — proof of what's
inside every image. If a critical vulnerability is found, the pipeline fails.

---

## 🧠 The shape of proven code

By the end of this milestone CI proves all of these before anyone can merge:

| Stage | Proves | Tool |
|-------|--------|------|
| Lint | code style is consistent | ESLint |
| Unit tests | the logic works (no DB) | `node --test` |
| Integration tests | it works with a real DB | `node --test` + Postgres service |
| Frontend build | the SPA actually compiles | Vite |
| **Docker build** | **the images are buildable** | Buildx |
| **Security scan** | **no critical/high vulnerabilities** | Trivy |
| **SBOM** | **a full inventory of every package** | Trivy (CycloneDX) |

The last three are what "production-ready pipeline" means. Let's add them.

---

## 📝 Step 1 — Add the third job to `ci.yml`

Append a third job. It **depends on** the first two (`needs:`), so images are
only built after tests and builds pass — no point scanning a broken artifact:

```yaml
  docker-build-scan:
    name: "Docker — Build & Security Scan"
    runs-on: ubuntu-latest
    needs: [backend-tests, frontend-lint-build]
    permissions:
      contents: read
      security-events: write
    steps:
      - uses: actions/checkout@v4

      - name: Set up Docker Buildx
        uses: docker/setup-buildx-action@v3

      - name: Build backend image
        uses: docker/build-push-action@v6
        with:
          context: ci-cd-pipeline-app/backend
          target: runtime
          load: true
          tags: cicd-backend:ci
          cache-from: type=gha
          cache-to: type=gha,mode=max

      - name: Build frontend image
        uses: docker/build-push-action@v6
        with:
          context: ci-cd-pipeline-app/frontend
          target: serve
          load: true
          tags: cicd-frontend:ci
          cache-from: type=gha
          cache-to: type=gha,mode=max
```

### Decoding the action

| Option | Meaning |
|--------|---------|
| `context:` | Where the Dockerfile lives (`backend/`, `frontend/`) |
| `target: runtime` / `serve` | The exact production stages from Project 2 🐳 |
| `load: true` | Load the image into the runner so Trivy can scan it |
| `cache-from/to: type=gha` | Share image layers across runs via GitHub Actions cache → your second run is 5–10× faster ⚡ |

---

## 📝 Step 2 — Scan the images with Trivy

```yaml
      - name: Trivy scan — backend
        uses: aquasecurity/trivy-action@0.28.0
        with:
          image-ref: cicd-backend:ci
          format: table
          severity: CRITICAL,HIGH
          exit-code: 1
          ignore-unfixed: true

      - name: Trivy scan — frontend
        uses: aquasecurity/trivy-action@0.28.0
        with:
          image-ref: cicd-frontend:ci
          format: table
          severity: CRITICAL,HIGH
          exit-code: 1
          ignore-unfixed: true
```

### Why these settings

| Setting | What it does | Why |
|---------|--------------|-----|
| `severity: CRITICAL,HIGH` | Only fail on the worst classes | Medium/low: log for review, don't block |
| `exit-code: 1` | **Fail the job if vulns found** | The gate — red build = don't merge |
| `ignore-unfixed: true` | Ignore CVEs with no fix yet | Don't block on things nobody can patch |

> 🧠 A Trivy scan of a Node image checks the **OS packages AND all your npm
> dependencies** against vulnerability databases — it finds the same holes
> `npm audit` finds, plus OS-level ones.

---

## 📝 Step 3 — Save SBOMs and upload them as artifacts

```yaml
      - name: Save Trivy SBOM — backend
        uses: aquasecurity/trivy-action@0.28.0
        with:
          image-ref: cicd-backend:ci
          format: cyclonedx
          output: sbom-backend.json

      - name: Save Trivy SBOM — frontend
        uses: aquasecurity/trivy-action@0.28.0
        with:
          image-ref: cicd-frontend:ci
          format: cyclonedx
          output: sbom-frontend.json

      - name: Upload SBOMs as artifacts
        uses: actions/upload-artifact@v4
        with:
          name: sboms
          path: sbom-*.json
```

> **SBOM = Software Bill of Materials.** A machine-readable inventory of every
> package inside each image. Regulators, auditors and security teams ask for
> these. You'll have them, auto-generated, on every run. 📋

---

## 📝 Step 4 — A summary job so "green" is one glance

```yaml
  ci-complete:
    name: "CI Passed"
    runs-on: ubuntu-latest
    needs: [backend-tests, frontend-lint-build, docker-build-scan]
    steps:
      - name: All checks passed
        run: echo "✅ CI pipeline completed successfully — lint, tests, build, security scan all green."
```

This job can't run until *every other job* succeeds — it's your pipeline's
"all green" crown. When it's green, the code is ready to ship. 🎖️

---

## 📝 Step 5 — Push and inspect

```powershell
git add .github/workflows/ci.yml
git commit -m "ci: full pipeline — docker build, trivy scan, SBOM"
git push
```

On the Actions page now:

```
✓ Backend — Test                  (services: postgres ran too)
✓ Frontend — Lint & Build
✓ Docker — Build & Security Scan   (see the Trivy table in the logs)
✓ CI Passed
```

In the run's **Artifacts** tab you'll find `sboms` (two `.json` files). Download
one and peek — every dependency, with versions. That's your audit trail.

> 📸 **Proof of work:** saved in **`docs/screenshots/04-ci-pipeline.png`** — the Actions run showing all **4 jobs green**, with the logs of the Docker job visible in the background.
> ![Proof of work — full CI pipeline green](screenshots/04-ci-pipeline.png)

---

## 🧯 If something breaks

| Symptom | Cause | Fix |
|---------|-------|-----|
| Trivy exits 1 + red step "with issues" | A real CRITICAL/HIGH CVE was found | Fix the dependency (`npm update pkg`) or add an exception with a comment — but then the *gate* is doing its job ✅ |
| `docker: command not found` | Forgot `setup-buildx` step | The `docker/build-push-action` needs Buildx first |
| Cached, stale build | `cache-from: type=gha` reused old layers | Normal — that's the point; force with `--no-cache` rarely |
| SBOMs missing in artifacts | `output:` path wrong | Filenames must match `path: sbom-*.json` in upload step |

---

## ✅ Checkpoint

```
[ ] ✔️ ci.yml has 4 jobs: tests, frontend, docker-scan, summary
[ ] ✔️ needs: starts the docker job only after the first two pass
[ ] ✔️ Trivy scan output is visible in the run logs
[ ] ✔️ SBOM artifacts downloadable from the run
[ ] ✔️ Whole pipeline green on your branch + on the open PR
[ ] ✔️ Screenshot saved as docs/screenshots/04-ci-pipeline.png
```

---

➡️ **Next:** [Milestone 5 — Container Registry: Push to GHCR](05-container-registry-push-to-ghcr.md)