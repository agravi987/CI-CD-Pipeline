# ⏪ Milestone 9 — Rollback & Deployment Strategies

## 🎯 Goal

Learn the deployment strategies teams actually use, and build the pipeline's
safety valve: **rollback** — redeploy any older image tag in one click when
something goes wrong. 🧯

---

## 🧠 Deployment strategies (interview gold — know this table)

| Strategy | How it works | Zero downtime? | You used it |
|----------|--------------|:--------------:|-------------|
| **Recreate** | Stop old containers → start new | ❌ brief downtime | Your `docker compose up -d` replaces containers (fine for this project) |
| **Rolling** | Replace instances one-by-one | ✅ | What Kubernetes / managed platforms do by default |
| **Rolling update** (compose v2) | `up -d` without `--remove-orphans` replaces in place, container by container | ✅ | Easy upgrade path later |
| **Blue/green** | Two full stacks; switch traffic | ✅ | Classic enterprise — flip a load balancer |
| **Canary** | Ship to 5% → watch → 100% | ✅ | Google/Netflix style, safest of all |

The pipeline here is effectively **recreate** (stop/start the exact new tag) —
the simplest honest baseline. Understanding the others is what separates
"deployed something" from "knows deployment." You'll see blue/green and canary
in every interview. 🎤

### When real teams rollback

Production is broken → the fastest fix is to **serve the last-known-good
version**, not to untangle today's broken commit.

```
v1.0.0 (good)  ←  v1.0.1 (broken in prod)
                     │
                     ▼  rollback = redeploy v1.0.0's images
v1.0.0 (live again) ✅   v1.0.1 stays in GHCR (investigate + fix later)
```

Rollback isn't "undo git" — it's **redeploy a known-good artifact tag**. That's
why you tagged everything by SHA and version in Milestone 5. 🏷️

---

## 📝 Step 1 — Read `rollback.yml`

```yaml
name: Rollback Deployment

on:
  workflow_dispatch:
    inputs:
      environment:
        description: "Target environment to rollback"
        required: true
        type: choice
        options: [staging, production]
      version:
        description: "Image tag to rollback to (e.g. v1.2.2, sha-abc1234)"
        required: true

jobs:
  rollback-staging:
    if: github.event.inputs.environment == 'staging'
    runs-on: ubuntu-latest
    environment: staging
    steps:
      - uses: actions/checkout@v4
      - name: Rollback via SSH
        uses: appleboy/ssh-action@v1
        with:
          host: ${{ secrets.STAGING_HOST }}
          username: deploy
          key: ${{ secrets.STAGING_SSH_KEY }}
          script: |
            set -e
            echo "${{ secrets.GITHUB_TOKEN }}" | docker login ghcr.io -u ${{ github.actor }} --password-stdin
            cd /opt/cicd-staging
            export GHCR_OWNER=${{ github.repository_owner }}
            export BACKEND_IMAGE_TAG=${{ github.event.inputs.version }}
            export FRONTEND_IMAGE_TAG=${{ github.event.inputs.version }}
            docker compose -f docker-compose.prod.yml pull
            docker compose -f docker-compose.prod.yml up -d --remove-orphans
            sleep 10
            curl -sf http://localhost:8080/api/health || { echo "❌ Health check failed"; exit 1; }
            echo "✅ Staging rolled back to ${{ github.event.inputs.version }}"
```

It's just a **deploy with an explicit tag**. `rollback-production` is identical
with `PROD_*` secrets and `/opt/cicd-production`. Two jobs, each `if:`-gated to
its environment. Read the `.env` from into the compose file has already been
done in M7/M8 — nothing else to change.

---

## 📝 Step 2 — Simulate a broken deploy

Deploy a version that *will* crash, so the rollback is real:

```powershell
# 1. From main, deploy to staging as normal
gh workflow run deploy-staging.yml

# 2. "Break" staging: deploy a nonexistent tag
gh workflow run deploy-staging.yml
# then force it by editing... no — simplest:
#   docker compose exec <backend> sh -c "echo something"   ← don't
```

Cleaner simulation: deploy tag `sha-0000000` (never built). The compose
`pull` will fail → GitHub shows 🚫 → staging is *still on the old image*
(`up -d` never ran). That's the pipeline *refusing* a bad deploy. Then fix it
with the real rollback:

---

## 📝 Step 3 — Run the rollback

From GitHub Actions → **Rollback Deployment** → pick `staging`, version
`sha-<whatever-was-live-before>` (or the earlier `v1.0.0`) → Run workflow.

The SSH output should end:

```
✅ Staging rolled back to <your-tag>
```

Check the health endpoint once more:

```powershell
curl http://<STAGING_IP>:8080/api/health     # {"status":"ok",...}
```

You just performed a production-grade recovery with one click. 🧯✨

> 📸 **Proof of work:** saved in **`docs/screenshots/09-rollback.png`** — the Rollback run green, showing `✅ ... rolled back to <tag>`, with the `/api/health` JSON next to it.
> ![Proof of work — rollback succeeded](screenshots/09-rollback.png)

---

## 🧯 If something breaks

| Symptom | Cause | Fix |
|---------|-------|-----|
| `manifest unknown` on pull | Typos/tag doesn't exist in GHCR | Use exactly the tags from Milestone 5 screenshot |
| Rollback job never runs | `if:` environment mismatch (`staging` vs `production`) | Check the dropdown value matches an option |
| Health check fails after rollback | Old image also depended on DB state | On the server: `docker compose logs --tail 50`, check `.env` |
| Approvals slow you down | prod rollback requires review | Expect it — that's the point of protection 🧑‍✈️ |

---

## ✅ Checkpoint

```
[ ] ✔️ You can explain the 5 deployment strategies from memory + downtime column
[ ] ✔️ rollback.yml committed (both jobs)
[ ] ✔️ You simulated a failed deploy (staging refused the bad tag)
[ ] ✔️ One-click rollback to a known-good tag succeeded
[ ] ✔️ Health endpoint verified after rollback
[ ] ✔️ Screenshot saved as docs/screenshots/09-rollback.png
```

---

➡️ **Next:** [Milestone 10 — Quality Gates: Branch Protection](10-quality-gates-branch-protection.md)