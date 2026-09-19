# 🔐 Milestone 9 — Environments, Secrets & Variables

## 🎯 Goal (plain English)

Separate **staging from production**, keep passwords **out of the repo**, and
make **production require a human approval** before it deploys. This is where
your pipeline grows a spine. 🦴

---

## 🤔 The three config layers (learn by heart)

| Layer | Stored where | What it holds | Seen by |
|-------|-------------|---------------|---------|
| **Variables** | Repo Settings → Secrets and variables | Non-secret config: image names, ports | Any workflow |
| **Secrets** | Same page, "Secrets" tab | Passwords, SSH keys, tokens (always masked `***`) | Only the value, never leaked in logs |
| **Environment** | Repo Settings → Environments | A *named gate* that can own secrets + require reviews | Only jobs that declare `environment:` |

Rule of thumb:

> Anything secret → **Secrets**. Everything else → **Variables**. Never put
> either in YAML or in code. 🔒

---

## 📝 Step 1 — Create the two environments

**Settings → Environments → New environment** — create `staging`, then
`production`.

For **production**, add protection rules (the human gate):

```text
Production environment protection rules:
  ☑ Required reviewers        → add yourself (or your team)
  ☑ Wait timer               → 0 minutes (or 5, if you want a forced pause)
  ☑ Deployment branches      → refs/tags/v*   ← ONLY release tags can deploy!
```

Now look at `deploy-production.yml` — this is what the gate hooks into:

```yaml
jobs:
  deploy-production:
    runs-on: ubuntu-latest
    environment: production        # ← the name must match the Settings page
```

> 🧠 **The rule only bites when GitHub *sees* `environment: production` in a
> job.** Without that line, the job runs instantly. With it, GitHub **pauses**
> the job and pings your reviewers for a yes/no. That's a *protected
> environment*.

---

## 📝 Step 2 — Read the two deploy workflows (don't write yet)

| | `deploy-staging.yml` | `deploy-production.yml` |
|---|---|---|
| Trigger | `workflow_dispatch` / pushed to `main` | `workflow_dispatch` / `release` tag |
| Environment | `staging` | `production` |
| Protection | none | **Required reviewers + tag-only branches** |
| Server | `STAGING_HOST` / `STAGING_SSH_KEY` | `PROD_HOST` / `PROD_SSH_KEY` |
| Image tag | commit SHA | version tag (or manual input) |

Both call `appleboy/ssh-action` — they SSH into a server (`deploy` user) and run
the deploy commands. Add the secret values now.

---

## 📝 Step 3 — Add the repo secrets

**Settings → Secrets and variables → Actions → New repository secret.** These
four (repo-wide, so both workflows can use them):

| Secret | Value | Purpose |
|--------|-------|---------|
| `STAGING_HOST` | IP or domain of your staging server | Where staging lives |
| `STAGING_SSH_KEY` | **Private** SSH key (PEM) for the `deploy` user | How Actions logs into staging |
| `PROD_HOST` | IP or domain of your production server | Where production lives |
| `PROD_SSH_KEY` | **Private** SSH key for prod's `deploy` user | How Actions logs into prod |

> 🔐 Generate keys with:
> `ssh-keygen -t ed25519 -f ~/.ssh/cicd_deploy -C "cicd-deploy"`
> Put the **private** side into the secret (paste the whole file) and the
> **public** side on the server's `~deploy/.ssh/authorized_keys`.
> Full server prep happens in Milestone 10 — secrets first, servers later.

---

## 📝 Step 4 — Set the non-secret values too

Not everything is a secret. Image names are fine as **variables**:

**Settings → Secrets and variables → Actions → Variables → New repository
variable:** `IMAGE_REGISTRY = ghcr.io`

The workflow image names are already derived from `github.repository_owner` —
so besides the host/key pairs, nothing secret remains anywhere. 🎉

---

## 📝 Step 5 — Verify the gate works (dry run)

Run **`deploy-production.yml`** manually (Actions → the workflow → **Run
workflow**). It will fail at the server step (no server configured yet) — but
watch what happens *first*: the job shows 🔕 **"Waiting for approval"** and
GitHub pings your reviewers. Approve → it continues → then fails on SSH.

That failure is **expected** — and it's your proof the gate works.

> 📸 **Proof of work:** save **`docs/screenshots/09-environments-secrets.png`**
> — **Settings → Environments** showing both environments, with `production`'s
> "Required reviewers" rule visible.

---

## 🧯 If something breaks

| Symptom | Cause | Fix |
|---------|-------|-----|
| Job stuck on "Waiting" forever | No one approved | Approve it yourself in the run UI |
| `***` where your secret should be | That's a *feature* — it's masked ✅ | Nothing to fix |
| "Environment protection rules were not satisfied" | Rule allows only `v*` branches | Run it from a tag, not a branch |
| Can't find Environments in settings | Org/enterprise setting? | Repo Settings → Environments exists on the free plan ✅ |

---

## ✅ Checkpoint

```
[ ] ✔️ staging and production environments exist
[ ] ✔️ production has Required reviewers + deployment branch v*
[ ] ✔️ 4 secrets added (staging/prod host + SSH key)
[ ] ✔️ Manual prod run showed "Waiting for approval" then failed on SSH (expected)
[ ] ✔️ Screenshot saved as docs/screenshots/09-environments-secrets.png
```

---

➡️ **Next:** [Milestone 10 — Deploy to Staging (CD)](10-deploy-to-staging.md)