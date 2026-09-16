# 🟠 Milestone 7 — Deploy to Staging (CD)

## 🎯 Goal

Make your pipeline **deploy to a real staging server** — SSH in, pull the
images your CI published to GHCR, `docker compose up`, and prove it with a
health check. This is the CD half finally doing something concrete. 🎉

---

## 🧠 Deployment strategy (keep it boring)

The deploy philosophy for this project:

```
CI published images to GHCR (tag: sha-abc1234)
      │
      ▼
CD  SSH → docker compose pull (new tag)
      │
      ▼
      docker compose up -d (recreate only what changed)
      │
      ▼
      curl /api/health → must be HTTP 200
      │
      ▼
      clean up old images
```

No shell scripting drama, no exposed secrets, no log output with passwords.
Just: **pull the exact tag → restart → check it's alive**. Boring is beautiful
in deployment. 😌

---

## 📝 Step 1 — Prepare the staging server

You need a cheap Linux server (EC2 t2/t3.micro, DigitalOcean droplet, Oracle
free tier, or a second container on your existing Project 2 server). 1 vCPU /
1 GB RAM is plenty for staging.

On the server:

```bash
# 1. Install Docker
curl -fsSL https://get.docker.com | sh
sudo usermod -aG docker $USER      # then re-login or `newgrp docker`

# 2. Create the deploy user
sudo useradd -m -s /bin/bash deploy
sudo mkdir -p /home/deploy/.ssh
sudo cp ~/.ssh/authorized_keys /home/deploy/.ssh/ 2>/dev/null || true
# paste your cicd_deploy.pub into /home/deploy/.ssh/authorized_keys
sudo chown -R deploy:deploy /home/deploy/.ssh
sudo chmod 700 /home/deploy/.ssh && sudo chmod 600 /home/deploy/.ssh/authorized_keys

# 3. App folder (owned by deploy, so Actions can write)
sudo mkdir -p /opt/cicd-staging && sudo chown deploy:deploy /opt/cicd-staging
```

Verify you can SSH in as `deploy` from your laptop:

```powershell
ssh -i ~/.ssh/cicd_deploy deploy@<STAGING_IP>
docker -v    # should print a version
```

---

## 📝 Step 2 — Ship the deploy files to the server

The `deploy/` folder holds what *runs on the server*:

| File | Purpose |
|------|---------|
| `deploy/docker-compose.prod.yml` | The compose file used by staging AND production (pull from GHCR, `BACKEND_IMAGE_TAG`/`FRONTEND_IMAGE_TAG` interpolated) |
| `deploy/deploy.sh` | `pull → up → health check → prune` — the same commands the workflow runs, available for manual use |
| `database/init.sql` | Auto-runs the schema on the DB's first boot |

Copy them to the server (from your laptop, `ci-cd-pipeline-app/` folder):

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
nano .env        # paste the same values as your local .env.example
echo "GHCR_OWNER=<YOUR_GITHUB_USERNAME>" >> .env   # used by deploy.sh / compose image name
```

---

## 📝 Step 3 — Read `deploy-staging.yml`

The whole workflow is one job that runs `appleboy/ssh-action`:

```yaml
on:
  workflow_dispatch:
  workflow_call:

jobs:
  deploy-staging:
    runs-on: ubuntu-latest
    environment: staging
    steps:
      - uses: actions/checkout@v4

      - name: Set image tags
        id: tags
        run: |
          SHA_SHORT="${GITHUB_SHA::7}"   # the SHA being deployed
          echo "backend=sha-${SHA_SHORT}" >> "$GITHUB_OUTPUT"
          echo "frontend=sha-${SHA_SHORT}" >> "$GITHUB_OUTPUT"

      - name: Deploy via SSH
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
| `docker login ghcr.io` | The server needs to *pull* your (private/public) images — needs the same `GITHUB_TOKEN` |
| `export ..._IMAGE_TAG` | Feed the exact tag into the compose interpolation (`${BACKEND_IMAGE_TAG}` in the yaml) |
| `pull` then `up -d` | Pull precisely what was pushed — the server never "builds" anything |
| `curl -sf /api/health` | **The health check.** Deploy is only a success if it's HTTP 200 |
| `exit 1` | Fail loudly — GitHub shows a 🚫 so a human sees it |

> 🧠 `workflow_call:` lets other workflows (like `build-and-push.yml`) trigger
> this one automatically after a successful push — you'll wire that in
> Milestone 8.

---

## 📝 Step 4 — Deploy!

Two ways to run it:

**A) Manual (faster for your first try):**
Actions → **Deploy to Staging** → Run workflow → watch the SSH transcript
stream by. End must read `✅ Staging deployed successfully`.

**B) Automatic (the real pipeline):**
Add a trigger job to `build-and-push.yml` — after images are pushed, fire the
deploy:

```yaml
  dispatch-deploy:
    name: "Trigger Deploy"
    runs-on: ubuntu-latest
    needs: build-push
    steps:
      - name: Dispatch deploy-staging
        if: github.ref == 'refs/heads/main'
        run: |
          gh workflow run deploy-staging.yml
        env:
          GH_TOKEN: ${{ secrets.GITHUB_TOKEN }}
```

Now **merge to `main`** → CI → build & push → staging deploy, all without you.
That's your first fully automatic CD. 🎆

Verify from your browser: `http://<STAGING_IP>:8080` — the app is there, the
`next commit` you merged is the one running.

> 📸 **Proof of work:** saved in **`docs/screenshots/07-staging-deploy.png`** — the Deploy to Staging run showing green + the final `✅ Staging deployed successfully` line, with the server URL in your browser beside it.
> ![Proof of work — staging deployed](screenshots/07-staging-deploy.png)

---

## 🧯 If something breaks

| Symptom | Cause | Fix |
|---------|-------|-----|
| `Permission denied (publickey)` | SSH key not in `authorized_keys`, or wrong secret | Re-check Step 1; `ssh-copy-id` or paste `.pub` manually |
| `docker: command not found` | Server never installed Docker | `curl -fsSL https://get.docker.com | sh` |
| `login attempt ... failed` | `deploy` user can't read Nano key/known issues | Use key in the secret exactly, no empty lines |
| Compose can't interpolate env | `pull` runs before `export`? No — check order | Keep exports above the compose commands |
| Health check fails | App crashed on boot | `docker compose logs --tail 50` on the server |
| Images not public → pull auth needed | Fine, you **are** logged in via GITHUB_TOKEN | Nothing to fix — it's designed to work either way |

---

## ✅ Checkpoint

```
[ ] ✔️ Staging server has Docker, deploy user, and deploy files
[ ] ✔️ .env exists at /opt/cicd-staging/.env
[ ] ✔️ Manual deploy run ends with "✅ Staging deployed successfully"
[ ] ✔️ merge to main → automatic deploy to staging works end-to-end
[ ] ✔️ Screenshot saved as docs/screenshots/07-staging-deploy.png
```

---

➡️ **Next:** [Milestone 8 — Deploy to Production](08-deploy-to-production.md)