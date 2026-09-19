# 🟠 Milestone 10 — Deploy to Staging (CD)

## 🎯 Goal (plain English)

Make the pipeline **deploy to a real staging server**: SSH in, pull the images
CI published to GHCR, restart the app with `docker compose up`, and **prove it
woke up** with a health check. This is the CD half finally doing something
concrete. 🎉

---

## 🤔 The deploy strategy (keep it boring)

```text
CI published images to GHCR (tag: sha-abc1234)
      │
      ▼
CD  SSH → docker compose pull (the exact new tag)
      │
      ▼
      docker compose up -d (recreate only what changed)
      │
      ▼
      curl /api/health → must answer OK
      │
      ▼
      clean up old images
```

No shell drama, no exposed secrets, no passwords in logs.

> **pull the exact tag → restart → check it's alive.** Boring is beautiful in
> deployment. 😌

---

## 📝 Step 1 — Prepare the staging server

A cheap Linux server: EC2 t2/t3.micro, DigitalOcean droplet, Oracle free tier,
or a second container on your existing Project 2 server. 1 vCPU / 1 GB RAM is
plenty for staging.

On the server:

```bash
# 1. Install Docker
curl -fsSL https://get.docker.com | sh
sudo usermod -aG docker $USER      # then re-login or `newgrp docker`

# 2. Create the deploy user (the user GitHub SSHes in as)
sudo useradd -m -s /bin/bash deploy
sudo mkdir -p /home/deploy/.ssh
# paste your cicd_deploy.pub into /home/deploy/.ssh/authorized_keys
sudo cp ~/.ssh/authorized_keys /home/deploy/.ssh/ 2>/dev/null || true
sudo chown -R deploy:deploy /home/deploy/.ssh
sudo chmod 700 /home/deploy/.ssh && sudo chmod 600 /home/deploy/.ssh/authorized_keys

# 3. App folder (owned by deploy, so Actions can write there)
sudo mkdir -p /opt/cicd-staging && sudo chown deploy:deploy /opt/cicd-staging
```

Verify from your laptop:

```powershell
ssh -i ~/.ssh/cicd_deploy deploy@<STAGING_IP>
docker -v    # should print a version
```

---

## 📝 Step 2 — Ship the deploy files to the server

The `deploy/` folder holds what *runs on the server*:

| File | Purpose |
|------|---------|
| `deploy/docker-compose.prod.yml` | The compose file used by staging AND production — **pulls from GHCR**, with `${BACKEND_IMAGE_TAG}`/`${FRONTEND_IMAGE_TAG}` filled in (fully commented) |
| `deploy/deploy.sh` | A *manual* version of the deploy: pull → up → health check → prune (fully commented) |
| `database/init.sql` | Runs the schema on the DB's first boot |

Copy them to the server:

```powershell
scp -i ~/.ssh/cicd_deploy deploy/docker-compose.prod.yml deploy/deploy.sh `
    deploy@<STAGING_IP>:/opt/cicd-staging/
scp -i ~/.ssh/cicd_deploy -r database `
    deploy@<STAGING_IP>:/opt/cicd-staging/
```

Create the `.env` file **on the server** (the DB secrets — never committed):

```bash
# on the server
cd /opt/cicd-staging
nano .env        # same values as your local .env.example
echo "GHCR_OWNER=<YOUR_GITHUB_USERNAME>" >> .env   # used by deploy.sh / image names
```

---

## 📝 Step 3 — Read `deploy-staging.yml`

> 📖 **Open `ci-cd-pipeline-app/.github/workflows/deploy-staging.yml` — fully
> commented.** The whole workflow is **one job** that runs an SSH session to
> your server via `appleboy/ssh-action`. Abbreviated:

```yaml
name: Deploy to Staging
on:
  workflow_dispatch:                 # human clicks "Run workflow"
  workflow_call:                     # another workflow asks us (M8's dispatcher)
jobs:
  deploy-staging:
    runs-on: ubuntu-latest
    environment: staging
    steps:
      - name: Set image tags
        id: tags
        run: |
          SHA_SHORT="${GITHUB_SHA::7}"        # the commit being deployed
          echo "backend=sha-${SHA_SHORT}" >> "$GITHUB_OUTPUT"
          echo "frontend=sha-${SHA_SHORT}" >> "$GITHUB_OUTPUT"
      - name: Deploy via SSH
        uses: appleboy/ssh-action@v1
        with:
          host: ${{ secrets.STAGING_HOST }}
          username: deploy
          key: ${{ secrets.STAGING_SSH_KEY }}
          script: |                          # ↓ everything below runs ON THE SERVER ↓
            set -e                           # stop at the first failing command
            echo "${{ secrets.GITHUB_TOKEN }}" | docker login ghcr.io -u ${{ github.actor }} --password-stdin
            cd /opt/cicd-staging
            export GHCR_OWNER=${{ github.repository_owner }}
            export BACKEND_IMAGE_TAG=${{ steps.tags.outputs.backend }}
            export FRONTEND_IMAGE_TAG=${{ steps.tags.outputs.frontend }}
            docker compose -f docker-compose.prod.yml pull
            docker compose -f docker-compose.prod.yml up -d --remove-orphans
            sleep 10
            curl -sf http://localhost:8080/api/health || { echo "❌ Health check failed"; exit 1; }
            echo "✅ Staging deployed successfully"
```

### Why each line

| Line | Why it's there |
|------|----------------|
| `set -e` | Stop at the first failing command — never deploy half-done |
| `docker login ghcr.io` | The server needs to *pull* your images, so it logs in with the same auto `GITHUB_TOKEN` |
| `export ..._IMAGE_TAG` | Feed the exact tag into the compose `${...}` placeholders |
| `pull` then `up -d` | Pull precisely what was pushed — the server **never builds** anything itself |
| `curl -sf /api/health` | **The health check.** The deploy only counts as success if this returns OK |
| `exit 1` | Fail loudly — GitHub shows a 🚫 so a human sees it |

> 🧠 `workflow_call:` lets other workflows (like `build-and-push.yml`) trigger
> this one automatically after a successful push — you wire that up in Step 4.

---

## 📝 Step 4 — Deploy!

**A) Manual (easiest for your first try):**
Actions → **Deploy to Staging** → Run workflow → watch the SSH transcript
stream by. It must end with `✅ Staging deployed successfully`.

**B) Automatic (the real pipeline):**
Add a dispatcher job to `build-and-push.yml` — after images are pushed, fire
the deploy:

```yaml
  dispatch-deploy:
    name: "Trigger Deploy"
    runs-on: ubuntu-latest
    needs: build-push
    steps:
      - name: Dispatch deploy-staging
        if: github.ref == 'refs/heads/main'    # only for pushes to main
        run: |
          gh workflow run deploy-staging.yml
        env:
          GH_TOKEN: ${{ secrets.GITHUB_TOKEN }}
```

Now **merge to `main`** → CI passes → images build & push → staging deploys —
all without you. That's your first fully automatic CD. 🎆

Verify in the browser: `http://<STAGING_IP>:8080` — the app you merged is live.

> 📸 **Proof of work:** save **`docs/screenshots/10-staging-deploy.png`** — the
> Deploy to Staging run showing green + ending on `✅ Staging deployed
> successfully`, with the site in your browser beside it.

---

## 🧯 If something breaks

| Symptom | Cause | Fix |
|---------|-------|-----|
| `Permission denied (publickey)` | SSH key not in `authorized_keys`, or wrong secret | Re-check Step 1; paste the `.pub` fully |
| `docker: command not found` | Server never installed Docker | `curl -fsSL https://get.docker.com \| sh` |
| `login attempt ... failed` | Private key pasted with extra whitespace/empty lines | Re-paste the secret exactly, no blank lines |
| Compose can't interpolate env | `pull` ran before the exports | Keep `export` lines ABOVE the compose commands |
| Health check fails | App crashed on boot | Server: `docker compose logs --tail 50` |
| Images not public → pull auth needed | Fine, you ARE logged in via GITHUB_TOKEN | Nothing to fix — works either way |

---

## ✅ Checkpoint

```
[ ] ✔️ Staging server has Docker, deploy user, and deploy files
[ ] ✔️ .env exists at /opt/cicd-staging/.env
[ ] ✔️ Manual deploy run ends with "✅ Staging deployed successfully"
[ ] ✔️ merge to main → automatic deploy to staging works end-to-end
[ ] ✔️ Screenshot saved as docs/screenshots/10-staging-deploy.png
```

---

➡️ **Next:** [Milestone 11 — Deploy to Production](11-deploy-to-production.md)