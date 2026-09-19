# 🏗️ Milestone 7 — The Full CI Pipeline

## 🎯 Goal (plain English)

Upgrade CI from "tests pass" to a real **gate**: build the Docker images,
security-scan them with **Trivy**, and produce **SBOMs** (a full inventory of
everything inside each image). If a critical vulnerability is found → the
pipeline **fails**.

---

## 🤔 What CI now proves (before anyone can merge)

| Stage | Proves | Tool |
|-------|--------|------|
| Lint | Code style is consistent | ESLint |
| Unit tests | The logic works (no DB) | `node --test` |
| Integration tests | It works with a real DB | `node --test` + Postgres service |
| Frontend build | The SPA actually compiles | Vite |
| **Docker build** | **The images are buildable** | Buildx |
| **Security scan** | **No critical/high vulnerabilities** | Trivy |
| **SBOM** | **A full inventory of every package** | Trivy (CycloneDX) |

The last three are what make a pipeline "production-ready."

---

## 📝 Step 1 — Add the third job to `ci.yml`

> 📖 **Open `ci-cd-pipeline-app/.github/workflows/ci.yml` — it's fully
> commented line by line.** The steps below explain the ideas behind the file.

The third job **depends on** the first two via `needs:` — images are only built
*after* tests/builds pass. No point scanning a broken artifact:

```yaml
  docker-build-scan:
    name: "Docker — Build & Security Scan"
    runs-on: ubuntu-latest
    needs: [backend-tests, frontend-lint-build]   # gate 1
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
          context: ci-cd-pipeline-app/backend      # where the Dockerfile lives
          target: runtime                          # build the "runtime" stage
          load: true                               # keep it on the runner (for scanning)
          tags: cicd-backend:ci                    # temporary name:tag
          cache-from: type=gha                     # reuse cached layers → faster runs
          cache-to: type=gha,mode=max              # store new layers in the cache
      - name: Build frontend image
        uses: docker/build-push-action@v6
        with:
          context: ci-cd-pipeline-app/frontend
          target: serve                            # the nginx "serve" stage
          load: true
          tags: cicd-frontend:ci
          cache-from: type=gha
          cache-to: type=gha,mode=max
```

### Decoding the action options

| Option | Meaning |
|--------|---------|
| `context:` | Which folder contains the Dockerfile (`backend/`, `frontend/`) |
| `target: runtime` / `serve` | Build only the production stage (from Milestone 4) |
| `load: true` | Load the image into the runner so Trivy can scan it |
| `cache-from/to: type=gha` | Share image layers across runs via GitHub cache → 2nd run is often 5–10× faster ⚡ |

---

## 📝 Step 2 — Scan the images with Trivy

```yaml
      - name: Trivy scan — backend
        uses: aquasecurity/trivy-action@0.28.0     # the security scanner
        with:
          image-ref: cicd-backend:ci               # scan the image we made
          format: table                            # print as a table
          severity: CRITICAL,HIGH                  # only the worst two levels
          exit-code: 1                             # ⛔ fail if anyone finds a problem
          ignore-unfixed: true                     # ignore CVEs with no fix yet
```

| Setting | What it does | Why |
|---------|--------------|-----|
| `severity: CRITICAL,HIGH` | Only fail on the worst classes | Medium/low → log for review, don't block |
| `exit-code: 1` | **Fail the job if vulns are found** | The gate — red build = don't merge |
| `ignore-unfixed: true` | Ignore CVEs nobody can patch yet | Don't block on things you can't fix |

> 🧠 A Trivy scan of a Node image checks **OS packages AND all your npm
> dependencies** against vulnerability databases — the same holes `npm audit`
> finds, plus OS-level ones.

---

## 📝 Step 3 — Save SBOMs and upload them

```yaml
      - name: Save Trivy SBOM — backend
        uses: aquasecurity/trivy-action@0.28.0
        with:
          image-ref: cicd-backend:ci
          format: cyclonedx                         # SBOM = package inventory
          output: sbom-backend.json                 # save to a file
      ...
      - name: Upload SBOMs as artifacts
        uses: actions/upload-artifact@v4
        with:
          name: sboms
          path: sbom-*.json
```

> **SBOM = Software Bill of Materials.** A machine-readable list of every package
> inside each image. Security teams and auditors ask for these — you'll have
> them auto-generated on every run. 📋

---

## 📝 Step 4 — A summary job so "green" is one glance

```yaml
  ci-complete:
    name: "CI Passed"
    runs-on: ubuntu-latest
    needs: [backend-tests, frontend-lint-build, docker-build-scan]
    steps:
      - name: All checks passed
        run: echo "✅ CI pipeline completed successfully"
```

This job can't run until **every other job** succeeds — it's the "all green"
crown. When it's green, the code is ready to ship.

---

## 📝 Step 5 — Push and inspect

```powershell
git add .github/workflows/ci.yml
git commit -m "ci: full pipeline — docker build, trivy scan, SBOM"
git push
```

Your Actions page now shows:

```
✓ Backend — Test                  (services: postgres ran too)
✓ Frontend — Lint & Build
✓ Docker — Build & Security Scan  (see the Trivy table in the logs)
✓ CI Passed
```

In the run's **Artifacts** tab you'll find `sboms` (two `.json` files). Download
one and peek — every dependency, with versions. That's your audit trail.

> 📸 **Proof of work:** save **`docs/screenshots/07-ci-pipeline.png`** — the
> Actions run showing **4 jobs green**, with the Docker job's logs visible.

---

## 🧯 If something breaks

| Symptom | Cause | Fix |
|---------|-------|-----|
| Trivy exits 1 + red step "with issues" | A real CRITICAL/HIGH CVE was found | Fix the dependency (`npm update <pkg>`), or add a documented exception — the gate is doing its job ✅ |
| `docker: command not found` | Forgot the `setup-buildx` step | `docker/build-push-action` needs Buildx first |
| Stale cached build | `cache-from: type=gha` reused old layers | Normal — that's the point; force with `--no-cache` rarely |
| SBOMs missing in artifacts | `output:` path wrong | Filenames must match `path: sbom-*.json` |

---

## ✅ Checkpoint

```
[ ] ✔️ ci.yml has 4 jobs: tests, frontend, docker-scan, summary
[ ] ✔️ needs: starts the docker job only after the first two pass
[ ] ✔️ Trivy scan output is visible in the run logs
[ ] ✔️ SBOM artifacts downloadable from the run
[ ] ✔️ Whole pipeline green on your branch + on the open PR
[ ] ✔️ Screenshot saved as docs/screenshots/07-ci-pipeline.png
```

---

➡️ **Next:** [Milestone 8 — Container Registry: Push to GHCR](08-container-registry-push-to-ghcr.md)