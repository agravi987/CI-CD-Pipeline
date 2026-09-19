# 🗄️ Milestone 8 — Container Registry: Push to GHCR

## 🎯 Goal (plain English)

CI has *built* your images — now make it *publish* them to **GHCR** (GitHub
Container Registry), labeled by commit and version. The registry is the
handoff point between CI and CD: it's where the deployment servers will *pull*
from. 🚚

---

## 🤔 GHCR vs Docker Hub

| | Docker Hub | GHCR |
|---|-----------|------|
| Where | hub.docker.com | ghcr.io (inside GitHub) |
| Auth | Docker Hub token | `GITHUB_TOKEN` (auto-created per run) |
| Private packages | Paid plans | **Public AND private: forever free** 💸 |

For a portfolio project GHCR wins: no extra account, no paid plan, and every
run already has the credentials — no password stored anywhere.

---

## 📝 Step 1 — Image names and tags

```
ghcr.io/<owner>/<image-name>:<tag>
              └──── name + optional tag (default: latest) ────┘
```

Your two images: `ghcr.io/<YOU>/cicd-backend` and `ghcr.io/<YOU>/cicd-frontend`.

The **tag** is your version story. We set three kinds:

| Tag | Meaning | Used for |
|-----|---------|----------|
| `sha-abc1234` | Tied to one exact commit | Precise deploys + rollback |
| `v1.2.3` | Human-meaningful release | Production promotes this |
| `latest` | The newest thing on `main` | Quick demos |

Never re-tag without re-building — the tag must **prove** which commit it came
from.

---

## 📝 Step 2 — Write `build-and-push.yml`

> 📖 **Open `ci-cd-pipeline-app/.github/workflows/build-and-push.yml` — fully
> commented line by line.** The steps that matter:

```yaml
permissions:
  contents: read
  packages: write          # ← REQUIRED to push images to GHCR

- name: Log in to GHCR
  uses: docker/login-action@v3
  with:
    registry: ghcr.io
    username: ${{ github.actor }}
    password: ${{ secrets.GITHUB_TOKEN }}    # auto token — no stored password
```

Two things to notice:

- **`packages: write`** — the pipeline asks GitHub for permission to write
  packages *for this repo only*. No Docker Hub password anywhere.
- The **tag step** is a plain bash script that computes the tags and writes them
  to `GITHUB_OUTPUT`; the next step reads them via
  `${{ steps.meta.outputs.backend-tag }}`. That is the standard *"compute in one
  step, use in the next"* pattern.

The bash tag logic, decoded:

```bash
SHA_SHORT="${GITHUB_SHA::7}"                     # first 7 chars of the commit
if [[ "$GITHUB_REF" == refs/tags/v* ]]; then     # triggered by a version tag?
  TAG="${GITHUB_REF#refs/tags/}"                 # "refs/tags/v1.2.3" → "v1.2.3"
  # a release gets THREE labels: v1.2.3, sha-hash, latest
else
  # a plain push to main gets TWO: sha-hash, latest
fi
echo "backend-tag=$BACKEND_TAGS" >> "$GITHUB_OUTPUT"   # save for later steps
```

### Line-by-line cheat sheet

| Line | What it does |
|------|--------------|
| `id: meta` | Names the step so others can read `steps.meta.outputs.*` |
| `$GITHUB_SHA::7` | The short commit hash (traceability!) |
| `GITHUB_REF#refs/tags/` | Bash trick: strips the prefix, leaving the version name |
| `>> "$GITHUB_OUTPUT"` | Saves a value to the run-wide "output file" |
| `${{ steps.meta.outputs.backend-tag }}` | Reads that saved value in a later step |

---

## 📝 Step 3 — Add the build + push steps

```yaml
- name: Build & push backend
  uses: docker/build-push-action@v6
  with:
    context: ci-cd-pipeline-app/backend
    target: runtime
    push: true                # ← push:true = UPLOAD to GHCR (was false in CI)
    tags: ${{ steps.meta.outputs.backend-tag }}
    cache-from: type=gha
    cache-to: type=gha,mode=max
```

> 🧠 Compare with Milestone 7: identical except **`push: true`** and real tags.
> That's the CI→registry handoff — build the same way, but *publish*.

---

## 📝 Step 4 — Make `main` and tags trigger it

Merge your PR from Milestone 1 (a `push` to `main`). Watch **Actions**: the
workflow runs, logs in, builds, and pushes. Then open the repo → **Packages:**

```
cicd-backend               cicd-frontend
  ├─ latest                  ├─ latest
  ├─ sha-abc1234             └─ sha-abc1234
  └─ (and each v-tag later)
```

> 💡 GHCR marks new packages **private** by default. Make them **public**
> (Package → Package settings → Change visibility → Public) so your servers —
> and your portfolio viewers — can pull them.

> 📸 **Proof of work:** save **`docs/screenshots/08-ghcr-images.png`** — your
> **Packages** page showing `cicd-backend` + `cicd-frontend` with `latest`
> and `sha-…` tags.

---

## 🧯 If something breaks

| Symptom | Cause | Fix |
|---------|-------|-----|
| `denied: permission_denied ... packages` | Missing `packages: write` | Add the permissions block to the job |
| 401 during `docker login` | Old/none `GITHUB_TOKEN` | Re-run; the token is fresh per run |
| Packages page empty | Visibility/link lag | Wait a moment; confirm Actions succeeded first |
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