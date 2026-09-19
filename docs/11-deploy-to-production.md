# 🔴 Milestone 11 — Deploy to Production

## 🎯 Goal (plain English)

Ship to a **real production server** — but only from a versioned **release
tag**, and only after a human **approves**. Staging is automatic; production is
deliberate. That contrast is the whole point. 🧑‍✈️

---

## 🤔 Why production needs a different path

| | Staging (M10) | Production (here) |
|---|---|---|
| Trust | Experimental | Real users |
| Trigger | any merge to `main` | only a `v1.2.3` release tag |
| Human | nobody | **explicit approval required** |
| Failure cost | "oh well" | outage + rollback scramble |

The pipeline enforces it with three layers:

1. **The trigger** — production deploys from release tags only (branch = the gate).
2. **The environment** — `environment: production` with *Required reviewers* (Milestone 9).
3. **The tag you type** — production deploys the tagged image, not "whatever main has right now."

---

## 📝 Step 1 — Prepare the production server

Repeat Milestone 10 Step 1 on the prod server (install Docker, `deploy` user,
`/opt/cicd-production`), then copy the deploy files:

```powershell
scp -i ~/.ssh/cicd_deploy deploy/docker-compose.prod.yml deploy/deploy.sh `
    deploy@<PROD_IP>:/opt/cicd-production/
scp -i ~/.ssh/cicd_deploy -r database `
    deploy@<PROD_IP>:/opt/cicd-production/
```

Create prod `.env` on the server too — and use **different, strong DB
credentials** than staging. 🔐

> 💡 **One server for both?** Totally fine: use `/opt/cicd-staging` (:8080) and
> `/opt/cicd-production` (:8081). Same machine, same deploy user. Just set
> `STAGING_HOST` and `PROD_HOST` to the same IP. The *pipeline* stays honest.

---

## 📝 Step 2 — Read `deploy-production.yml`

> 📖 **Open `ci-cd-pipeline-app/.github/workflows/deploy-production.yml` —
> fully commented.** Key parts:

```yaml
on:
  workflow_dispatch:
    inputs:
      version:                      # a box to type which version to deploy
        description: "Image tag to deploy (e.g. v1.2.3, sha-abc1234, latest)"
        required: false
        default: latest

jobs:
  deploy-production:
    runs-on: ubuntu-latest
    environment: production        # ← ⭐ the approval gate comes from HERE
    steps:
      - name: Set image tags
        id: tags
        run: |
          if [ "${{ github.event.inputs.version }}" != "" ] && \
             [ "${{ github.event.inputs.version }}" != "latest" ]; then
            echo "backend=${{ github.event.inputs.version }}" >> "$GITHUB_OUTPUT"   # 1. typed version wins
            echo "frontend=${{ github.event.inputs.version }}" >> "$GITHUB_OUTPUT"
          elif [[ "${GITHUB_REF}" == refs/tags/v* ]]; then
            TAG="${GITHUB_REF#refs/tags/}"     # 2. release tag name wins
            echo "backend=${TAG}" >> "$GITHUB_OUTPUT"
            echo "frontend=${TAG}" >> "$GITHUB_OUTPUT"
          else
            SHA_SHORT="${GITHUB_SHA::7}"       # 3. otherwise deploy this commit's sha
            echo "backend=sha-${SHA_SHORT}" >> "$GITHUB_OUTPUT"
            echo "frontend=sha-${SHA_SHORT}" >> "$GITHUB_OUTPUT"
          fi
```

Then the SSH step — same shape as staging, pointing at `PROD_HOST` /
`PROD_SSH_KEY` and `/opt/cicd-production`. Two differences from staging:

1. **`environment: production`** → GitHub **pauses** the run until a reviewer
   clicks **Approve and deploy**.
2. **`workflow_dispatch.inputs.version`** → you can also say *which version* to
   deploy without moving `main` (that's your rollback primitive, M12). There's
   also a pre-deploy snapshot step that records what's running before we touch
   anything.

---

## 📝 Step 3 — Deploy, with the gate in the middle

**Option A — manual launch:**
Actions → **Deploy to Production** → Run workflow (version `latest`) → watch it
show 🔕 **"Waiting for approval"** → click the run → **Review deployments** →
**Approve and deploy** → SSH runs → ends with `✅ Production deployed
successfully`.

**Option B — release-tagged automation** (the "real" flow):
Finish CI first (merge to main → sha tags pushed), then on your laptop:

```powershell
git tag v1.0.0
git push origin v1.0.0
```

`build-and-push.yml` sees the `refs/tags/v*` push, builds + pushes `v1.0.0`
tags, then its dispatcher fires `deploy-production.yml`:

```yaml
  dispatch-deploy:
    needs: build-push
    steps:
      - name: Dispatch deploy-production
        if: startsWith(github.ref, 'refs/tags/v')
        run: |
          gh workflow run deploy-production.yml
        env:
          GH_TOKEN: ${{ secrets.GITHUB_TOKEN }}
```

…and the production deploy sits at **"Waiting for approval"** until you
approve. The `refs/tags/v*` deployment-branch rule stops anything else from
even starting. 🚦

Open `http://<PROD_IP>:8080` — your app, versioned, gated, deployed by a
pipeline. That's the "I can automate software delivery" moment. 🏆

> 📸 **Proof of work:** save **`docs/screenshots/11-production-deploy.png`** —
> the Production run showing 🔕 **Waiting for approval**, your **Approve and
> deploy** click, the green run, and the live site.

---

## 🧯 If something breaks

| Symptom | Cause | Fix |
|---------|-------|-----|
| Run says "Environment rule not satisfied" | Deploy branch rule only allows `v*` | Only launch prod deploys from tags (or adjust the rule) |
| Stuck at waiting with no reviewer UI | You're not a "required reviewer" | Re-add yourself under Environment protection rules |
| Deploys `latest` but you wanted a version | `version` input left blank | Set `version: v1.0.0` when starting the run |
| Prod down after deploy | App crashed / DB creds | Server logs: `docker compose logs --tail 50` + fix `.env` |

---

## ✅ Checkpoint

```
[ ] ✔️ Prod server has Docker + /opt/cicd-production + deploy files + .env
[ ] ✔️ Manual prod deploy shows "Waiting for approval" and completes on approval
[ ] ✔️ git tag v1.0.0 → push → prod deploy requested → approved → live
[ ] ✔️ Prod app running at http://<PROD_IP>:8080
[ ] ✔️ Screenshot saved as docs/screenshots/11-production-deploy.png
```

---

➡️ **Next:** [Milestone 12 — Rollback & Deployment Strategies](12-rollback-and-deployment-strategies.md)