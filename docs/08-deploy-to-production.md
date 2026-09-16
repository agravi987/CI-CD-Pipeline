# 🔴 Milestone 8 — Deploy to Production

## 🎯 Goal

Ship to a **real production server** — but only via a versioned **release tag**,
and only after a human **approves** the deployment. Staging is automatic;
production is deliberate. That contrast is the whole point. 🧑‍✈️

---

## 🧠 Why production needs a different path

| | Staging (M7) | Production (you are here) |
|---|---|---|
| Trust | Experimental | Real users |
| Trigger | any merge to `main` | only a `v1.2.3` release tag |
| Human | nobody | **explicit approval required** |
| Failure cost | "oh well" | outage + rollback scramble |

The pipeline enforces this with:

1. **The trigger** — production deploys from release tags only (branch = the gate).
2. **The environment** — `environment: production` with *Required reviewers* (Milestone 6).
3. **The tag you type** — production deploys the tagged image, not "whatever main has now."

---

## 📝 Step 1 — Prepare the production server

Repeat Milestone 7 Step 1 on the prod server (install Docker, `deploy` user,
`/opt/cicd-production`), and copy the deploy files there:

```powershell
scp -i ~/.ssh/cicd_deploy deploy/docker-compose.prod.yml deploy/deploy.sh `
    deploy@<PROD_IP>:/opt/cicd-production/
scp -i ~/.ssh/cicd_deploy -r database `
    deploy@<PROD_IP>:/opt/cicd-production/
```

Create prod `.env` on the server too — and use **different, strong DB
credentials** than staging. 🔐

> 💡 **One server for both?** Totally fine for a portfolio: use
> `/opt/cicd-staging` (:8080) and `/opt/cicd-production` (:8081). Same machine,
> same deploy user, same secrets logic. The workflow's `STAGING_HOST` and
> `PROD_HOST` can be the same IP. The *pipeline* stays honest either way.

---

## 📝 Step 2 — Read `deploy-production.yml`

```yaml
on:
  workflow_dispatch:
    inputs:
      version:
        description: "Image tag to deploy (e.g. v1.2.3, sha-abc1234, latest)"
        required: false
        default: latest
  workflow_call:

jobs:
  deploy-production:
    runs-on: ubuntu-latest
    environment: production        # ← approval gate comes from here
    steps:
      - uses: actions/checkout@v4

      - name: Set image tags
        id: tags
        run: |
          if [ "${{ github.event.inputs.version }}" != "" ] && \
             [ "${{ github.event.inputs.version }}" != "latest" ]; then
            echo "backend=${{ github.event.inputs.version }}" >> "$GITHUB_OUTPUT"
            echo "frontend=${{ github.event.inputs.version }}" >> "$GITHUB_OUTPUT"
          else
            SHA_SHORT="${GITHUB_SHA::7}"
            echo "backend=sha-${SHA_SHORT}" >> "$GITHUB_OUTPUT"
            echo "frontend=sha-${SHA_SHORT}" >> "$GITHUB_OUTPUT"
          fi
```

Then the SSH step — same shape as staging, pointing at `PROD_HOST`/`PROD_SSH_KEY`
and `/opt/cicd-production`. Two differences from staging:

1. `environment: production` → GitHub **pauses** the run until a reviewer clicks
   **Approve and deploy**.
2. `workflow_dispatch.inputs.version` → you can also say *which version* to
   deploy without moving `main` (that's your rollback primitive, M9).

---

## 📝 Step 3 — Deploy, with the gate in the middle

Option A — **manual launch of the workflow**:
Actions → **Deploy to Production** → Run workflow (version `latest`) →
watch the job show 🔕 **"Waiting for approval"** → click the run → **Review
deployments** → **Approve and deploy** → watch SSH stream and end with
`✅ Production deployed successfully`.

Option B — **release-tagged automation** (the "real" flow):
Complete CI first (merge to main → pushed sha tags), then on your laptop:

```powershell
git tag v1.0.0
git push origin v1.0.0
```

The `build-and-push.yml` workflow sees `refs/tags/v*`, builds + pushes
`v1.0.0` tags, then the deploy dispatcher fires `deploy-production.yml`:

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

…and production deploy sits at **"Waiting for approval"** until you approve.
Deployment branches rule (`refs/tags/v*`) prevents anything else from even
starting. 🚦

Open `http://<PROD_IP>:8080` — your app, versioned, gated, deployed by a
pipeline. That's the "I can automate software delivery" moment. 🏆

> 📸 **Proof of work:** saved in **`docs/screenshots/08-production-deploy.png`** — the Production run showing the 🔕 **Waiting for approval** step, your **Approve and deploy** click, and the green run + live site.
> ![Proof of work — gated production deploy](screenshots/08-production-deploy.png)

---

## 🧯 If something breaks

| Symptom | Cause | Fix |
|---------|-------|-----|
| Run says "Environment rule not satisfied" | Deploy branch rule only allows `v*` | Only launch prod deploys from tags (or adjust the rule) |
| Stuck at waiting with no reviewer UI | You're not a "required reviewer"? | Re-add yourself under Environment protection rules |
| Deploys `latest` but you wanted a version | `version` input left blank | Set `version: v1.0.0` when starting the run |
| Prod down after deploy | App crashed / DB creds | Server logs: `docker compose logs --tail 50` + fix `.env` |

---

## ✅ Checkpoint

```
[ ] ✔️ Prod server has Docker + /opt/cicd-production + deploy files + .env
[ ] ✔️ Manual prod deploy shows "Waiting for approval" and completes on approval
[ ] ✔️ git tag v1.0.0 → push → prod deploy requested → approved → live
[ ] ✔️ Prod app running at http://<PROD_IP>:8080
[ ] ✔️ Screenshot saved as docs/screenshots/08-production-deploy.png
```

---

➡️ **Next:** [Milestone 9 — Rollback & Deployment Strategies](09-rollback-and-deployment-strategies.md)