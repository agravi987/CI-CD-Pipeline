# ⏪ Milestone 12 — Rollback & Deployment Strategies

## 🎯 Goal (plain English)

Learn the deployment strategies teams actually use, then build the pipeline's
safety valve: **rollback** — redeploy any older image tag in one click when
something goes wrong. 🧯

---

## 🤔 Deployment strategies (interview gold — know this table)

| Strategy | How it works | Zero downtime? | You used it |
|----------|--------------|:--------------:|-------------|
| **Recreate** | Stop old containers → start new | ❌ brief downtime | Your `docker compose up -d` replaces containers (fine here) |
| **Rolling** | Replace instances one-by-one | ✅ | What Kubernetes / managed platforms do by default |
| **Rolling update** (compose v2) | `up -d` without `--remove-orphans` replaces container-by-container | ✅ | Easy upgrade path later |
| **Blue/green** | Two full stacks; switch traffic | ✅ | Classic enterprise — flip a load balancer |
| **Canary** | Ship to 5% → watch → 100% | ✅ | Google/Netflix style, safest of all |

This project is effectively **recreate** — the simplest honest baseline.
Understanding the others is what separates "deployed something" from "knows
deployment." Blue/green and canary show up in every interview. 🎤

### When real teams roll back

Production is broken → the fastest fix is to **serve the last-known-good
version**, not untangle today's broken commit.

```text
v1.0.0 (good)  ←  v1.0.1 (broken in prod)
                     │
                     ▼  rollback = redeploy v1.0.0's images
v1.0.0 (live again) ✅   v1.0.1 stays in GHCR (investigate + fix later)
```

**Rollback is not "undo git" — it's redeploy a known-good artifact tag.** That's
why you tagged everything by SHA + version in Milestone 8. 🏷️

---

## 📝 Step 1 — Read `rollback.yml`

> 📖 **Open `ci-cd-pipeline-app/.github/workflows/rollback.yml` — fully
> commented.** The idea:

```yaml
name: Rollback Deployment
on:
  workflow_dispatch:                    # humans only — never automatic
    inputs:                             # the form you fill in
      environment:                      #   dropdown: staging / production
        type: choice
        options: [staging, production]
      version:                          #   box: which tag to go back to
        required: true

jobs:
  rollback-staging:
    if: github.event.inputs.environment == 'staging'   # ← the `if:` filter
    runs-on: ubuntu-latest
    environment: staging
    steps:
      - uses: actions/checkout@v4
      - name: Rollback via SSH
        uses: appleboy/ssh-action@v1
        with:
          host: ${{ secrets.STAGING_HOST }}
          key: ${{ secrets.STAGING_SSH_KEY }}
          script: |
            set -e
            echo "${{ secrets.GITHUB_TOKEN }}" | docker login ghcr.io ...
            cd /opt/cicd-staging
            export BACKEND_IMAGE_TAG=${{ github.event.inputs.version }}    # ← chosen tag
            export FRONTEND_IMAGE_TAG=${{ github.event.inputs.version }}
            docker compose -f docker-compose.prod.yml pull
            docker compose -f docker-compose.prod.yml up -d --remove-orphans
            sleep 10
            curl -sf http://localhost:8080/api/health || exit 1            # health check
            echo "✅ Staging rolled back to ${{ github.event.inputs.version }}"
```

It's just a **deploy with an explicit tag** instead of the commit SHA.
`rollback-production` is identical, using `PROD_*` secrets and
`/opt/cicd-production`. Two jobs, each `if:`-gated to its environment. A
`summary` job always reports what happened.

| Concept | Plain words |
|---------|-------------|
| `if: github.event.inputs.environment == 'staging'` | "Run this job only when the dropdown said staging" |
| `environment:` (staging/production) | Rollbacks still obey each env's protection rules — including prod approval |
| `github.event.inputs.version` | The tag the human typed in the form |

---

## 📝 Step 2 — Simulate a broken deploy

To feel why rollback exists, ship a version that *will* fail. Cleanest trick:
**deploy a tag that was never built**. Use version `sha-0000000` with
`deploy-staging.yml`. The `docker compose pull` fails → GitHub shows 🚫 →
staging stays on the old image (because `up -d` never ran). That's the pipeline
*refusing* a bad deploy — exactly what you want. Then fix it with the real
rollback in Step 3.

---

## 📝 Step 3 — Run the rollback

GitHub Actions → **Rollback Deployment** → pick `staging`, version
`sha-<whatever-was-live-before>` (or the earlier `v1.0.0`) → Run workflow.

The SSH output should end:

```text
✅ Staging rolled back to <your-tag>
```

Check the health endpoint once more:

```powershell
curl http://<STAGING_IP>:8080/api/health     # {"status":"ok",...}
```

You just performed a production-grade recovery with one click. 🧯✨

> 📸 **Proof of work:** save **`docs/screenshots/12-rollback.png`** — the
> Rollback run green, ending `✅ ... rolled back to <tag>`, with the
> `/api/health` JSON beside it.

---

## 🧯 If something breaks

| Symptom | Cause | Fix |
|---------|-------|-----|
| `manifest unknown` on pull | Typos / tag doesn't exist in GHCR | Use exactly the tags from the M8 screenshot |
| Rollback job never runs | `if:` mismatch (`staging` vs `production`) | Check the dropdown matches an option |
| Health check fails after rollback | The old image depended on different DB state | Server: `docker compose logs --tail 50`, check `.env` |
| Approvals slow you down | prod rollback requires review | Expected — protection working as designed 🧑‍✈️ |

---

## ✅ Checkpoint

```
[ ] ✔️ You can explain the 5 deployment strategies + downtime column
[ ] ✔️ rollback.yml committed (both jobs)
[ ] ✔️ You simulated a failed deploy (staging refused the bad tag)
[ ] ✔️ One-click rollback to a known-good tag succeeded
[ ] ✔️ Health endpoint verified after rollback
[ ] ✔️ Screenshot saved as docs/screenshots/12-rollback.png
```

---

➡️ **Next:** [Milestone 13 — Quality Gates: Branch Protection](13-quality-gates-branch-protection.md)