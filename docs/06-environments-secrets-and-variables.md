# 🔐 Milestone 6 — Environments, Secrets & Variables

## 🎯 Goal

Separate **staging from production**, keep passwords out of the repo, and make
production **require a human approval** before anything deploys. This is where
your pipeline grows a spine. 🦴

---

## 🧠 The three config layers (know these by heart)

| Layer | Stored where | What it holds | Seen by |
|-------|-------------|---------------|---------|
| **Variables** | Repo Settings → Secrets and variables | Non-secret config: image names, ports | Any workflow |
| **Secrets** | Same page, "Secrets" tab | Passwords, SSH keys, tokens (always masked `***`) | Only the value, never leaked in logs |
| **Environment** | Repo Settings → Environments | A *named gate* that can own its own secrets + reviews | Only jobs that declare `environment:` |

Rule of thumb: **anything secret lives in Secrets, everything else in
Variables — never in YAML or code.** 🔒

---

## 📝 Step 1 — Create the two environments

**Settings → Environments → New environment** — create `staging`, then `production`.

For **production**, set up protection rules (the human gate):

```
Production environment protection rules:
  ☑ Required reviewers        → add yourself (or your team)
  ☑ Wait timer               → 0 minutes (or 5, if you want forced pause)
  ☑ Deployment branches      → refs/tags/v*   ← ONLY release tags can deploy!
```

Now look at the `deploy-production.yml` file — this is what the gate hooks into:

```yaml
jobs:
  deploy-production:
    runs-on: ubuntu-latest
    environment: production        # ← the name must match the Settings page
```

> 🧠 **The rules only apply when GitHub *sees* the `environment: production`
> line being used.** Without it, the job runs instantly. With it, GitHub pauses
> the job and pings your reviewers for a yes/no. That's a protected environment.

---

## 📝 Step 2 — Read the two deploy workflows (don't write yet)

Open the files that will deploy. Notice how they differ — this is the staging
vs production story:

| | `deploy-staging.yml` | `deploy-production.yml` |
|---|---|---|
| Trigger | `workflow_dispatch` / pushed to `main` | `workflow_dispatch` / `release` tag |
| Environment | `staging` | `production` |
| Protection | none | **Required reviewers + tag-only branches** |
| Server | `STAGING_HOST` / `STAGING_SSH_KEY` | `PROD_HOST` / `PROD_SSH_KEY` |
| Image tag | commit SHA | version tag (or manual input) |

Both call `appleboy/ssh-action` — they SSH into a server (`deploy` user) and run
the deploy commands. The secret values (host + private key) are the *same* for
both, just different names. Time to add them.

---

## 📝 Step 3 — Add the repo secrets

**Settings → Secrets and variables → Actions → New repository secret.** Add
these four (secrets are repo-wide so both workflows can use them):

| Secret | Value | Purpose |
|--------|-------|---------|
| `STAGING_HOST` | IP or domain of your staging server | Where staging lives |
| `STAGING_SSH_KEY` | **Private** SSH key (PEM) for the `deploy` user | How Actions logs into staging |
| `PROD_HOST` | IP or domain of your production server | Where production lives |
| `PROD_SSH_KEY` | **Private** SSH key for prod's `deploy` user | How Actions logs into prod |

> 🔐 Generate keys with:
> `ssh-keygen -t ed25519 -f ~/.ssh/cicd_deploy -C "cicd-deploy"`
> put the **private** side into the secret (paste the whole file), and the
> **public** side on the server's `~deploy/.ssh/authorized_keys`.
> Full server prep happens in Milestone 7 — secrets first, servers later.

---

## 📝 Step 4 — Also set the non-secret values

Not everything is a secret. Image names are fine as **variables**:

**Settings → Secrets and variables → Actions → Variables → New repository
variable:** `IMAGE_REGISTRY = ghcr.io`

And in the workflows, the image names are already derived from
`github.repository_owner` — so other than the host/key pair, there is nothing
secret left anywhere. 🎉

---

## 📝 Step 5 — Verify the gate works (dry run)

Run **`deploy-production.yml`** manually (Actions → select workflow →
**Run workflow**). It will fail at the server step (no server configured yet) —
but watch what happens *first*: the job shows 🔕 **"Waiting for approval"** and
GitHub pings your reviewers. Approve it, it proceeds, then fails on SSH.

That failure is *expected* and actually your proof the gate works.

> 📸 **Proof of work:** saved in **`docs/screenshots/06-environments-secrets.png`** — the **Settings → Environments** page showing both environments, with `production`'s "Required reviewers" rule visible.
> ![Proof of work — environments + protection](screenshots/06-environments-secrets.png)

---

## 🧯 If something breaks

| Symptom | Cause | Fix |
|---------|-------|-----|
| Job stuck on "Waiting" forever | No one approved | Approve it yourself in the run UI |
| `***` in logs where your secret should be | That's a *feature* — it's masked ✅ | Nothing to fix |
| `Environment protection rules were not satisfied` | Rule says only `v*` branches | Run via a tag, not a branch |
| Can't find Environments in settings | You're on an org/enterprise plan with this disabled? | Check repo Settings → Environments exists on free plan ✅ |

---

## ✅ Checkpoint

```
[ ] ✔️ staging and production environments exist
[ ] ✔️ production has Required reviewers + deployment branch v*
[ ] ✔️ 4 secrets added (staging/prod host + SSH key)
[ ] ✔️ Manual prod run showed "Waiting for approval" then failed on SSH (expected)
[ ] ✔️ Screenshot saved as docs/screenshots/06-environments-secrets.png
```

---

➡️ **Next:** [Milestone 7 — Deploy to Staging (CD)](07-deploy-to-staging.md)