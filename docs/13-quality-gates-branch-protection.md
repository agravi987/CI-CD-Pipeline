# 🛡️ Milestone 13 — Quality Gates: Branch Protection

## 🎯 Goal (plain English)

Make `main` **unbreakable**: CI must pass before anything merges, add a status
badge so everyone can see your pipeline works, get alerts when a deploy fails,
and let Dependabot keep dependencies fresh. This is the step that makes the repo
look *professional*. 🎩

---

## 🤔 The quality gate loop

```text
you push to feature branch
      │
      ▼
CI runs on the PR ──► success? ──┬── no ──► merge button BLOCKED 🛑
                                 └── yes ──► merge allowed ✅
      │
      ▼
create release tag ──► CD deploys (staging auto / prod approved)
```

Branch protection is the **"merge button BLOCKED"** part. Before this, CI was
*helpful*; after this, CI is *enforced*. You can't ship broken code even if you
try. 🚫

---

## 📝 Step 1 — Protect `main`

**Settings → Branches → Add branch rule** for `main`:

```text
Branch name pattern:  main

☑ Require status checks to pass before merging
   ☑ CI — Lint, Test, Build & Scan          ← your ci.yml's name
   ☑ Require branches to be up to date

☑ Require pull request reviews before merging
   ☑ Require approvals → 1

☑ Do not allow bypassing the above settings
```

That combination means **every** merge to `main`:

- ran the **full CI pipeline** (including Trivy) on the latest code,
- was **reviewed and approved** by at least one human,
- was merged **through a PR** — never force-pushed past the rules.

Watch the magic: open a junk PR (break a test on purpose), notice the merge
button is gray with "**Checks Failed**". Fix it, checks re-run, the button turns
green. 🤖✅

> 📸 **Proof of work:** save **`docs/screenshots/13-branch-protection.png`** —
> the branch protection screen for `main` with status checks + required reviews
> visible.

---

## 📝 Step 2 — Add the pipeline badge to your README

One markdown line = live status from GitHub:

```markdown
[![CI](https://github.com/<YOU>/<REPO>/actions/workflows/ci.yml/badge.svg)](https://github.com/<YOU>/<REPO>/actions/workflows/ci.yml)
```

Add it near the top of the root `README.md` and commit. Anyone who opens your
repo sees the **passing / failing** badge at a glance — cheap social proof for a
portfolio repo. 🏅

---

## 📝 Step 3 — Get notified when a deploy fails

The fastest zero-config alert: a reporter action on the deploy workflow's final
job. For example, comment on the PR when the deploy fails:

```yaml
  notify-failure:
    if: failure()
    runs-on: ubuntu-latest
    needs: [deploy-staging]
    steps:
      - name: Comment the PR
        uses: actions/github-script@v7
        with:
          script: |
            github.rest.issues.createComment({
              issue_number: context.issue.number,
              owner: context.repo.owner,
              repo: context.repo.repo,
              body: "🚨 Deployment failed — check the Actions log, then roll back if needed (`rollback.yml`)."
            })
```

For real team alerts, drop an action into the failed job:
`rtCamp/action-slack-notify@v2` (Slack webhook secret), `Ilshidur/action-discord`,
or a webhook to your inbox. The point: **the pipeline tells you loud, not
silent.** 📣

---

## 📝 Step 4 — Dependabot (free security upgrades)

**Settings → Code security and analysis → Dependabot → "Enable"** for:

- **Dependabot alerts** — GitHub scans your deps and flags known CVEs
- **Dependabot security updates** — auto-opens PRs for patched versions
- **Dependabot version updates** — monthly PRs bumping npm deps

Add a config so it targets your two `package.json`s:

`.github/dependabot.yml`

```yaml
version: 2
updates:
  - package-ecosystem: npm
    directory: /ci-cd-pipeline-app/backend
    schedule:
      interval: monthly
  - package-ecosystem: npm
    directory: /ci-cd-pipeline-app/frontend
    schedule:
      interval: monthly
  - package-ecosystem: github-actions
    directory: /
    schedule:
      interval: monthly
```

Every Dependabot PR flies through your **protected `main`** pipeline — the whole
system working together: bot proposes → CI tests → you approve → deploys. 🏗️

---

## 🧯 If something breaks

| Symptom | Cause | Fix |
|---------|-------|-----|
| Merge button stays gray despite green checks | "Branch up to date" not satisfied | Merge `main` back into the feature branch, push again |
| "Required status check not found" | Check name must match the *workflow* name | Use the `name:` of ci.yml, or a job name from the search |
| Can't push to main anymore | Correct! Protection is on 🚦 | Work via feature branches + PRs (Milestone 1 habit) |
| Dependabot PRs flood you | Monthly is still noisy | Lower to `weekly`, or add `ignore` for majors |

---

## ✅ Checkpoint

```
[ ] ✔️ main requires CI status checks + 1 review (no bypass)
[ ] ✔️ A deliberately-broken PR is blocked from merging
[ ] ✔️ README shows the live CI badge
[ ] ✔️ Dependabot enabled for npm + GitHub Actions
[ ] ✔️ Screenshot saved as docs/screenshots/13-branch-protection.png
```

---

➡️ **Next:** [Milestone 14 — The Final Pipeline & Portfolio Story](14-final-pipeline-and-portfolio-story.md)