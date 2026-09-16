# 🛡️ Milestone 10 — Quality Gates: Branch Protection

## 🎯 Goal

Make `main` **unbreakable**: CI must pass before anything merges, add a status
badge so everyone sees your pipeline works, get alerts when it fails, and let
Dependabot keep dependencies fresh. This is what makes a repo look *professional*. 🎩

---

## 🧠 The quality gate loop

```
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
helpful; after this, CI is *enforced*. You can no longer ship broken code even
if you try. 🚫

---

## 📝 Step 1 — Protect `main`

**Settings → Branches → Add branch rule** for `main`:

```
Branch name pattern:  main

☑ Require status checks to pass before merging
   ☑ CI — Lint, Test, Build & Scan          ← your ci.yml name
   ☑ Require branches to be up to date

☑ Require pull request reviews before merging
   ☑ Require approvals → 1

☑ Do not allow bypassing the above settings
```

That combination means every merge to `main`:

- ran the **full CI pipeline** (including Trivy) around the *latest* code,
- was **reviewed and approved** by at least one human,
- was merged **through a PR** — never force-pushed past the rules.

Watch the magic: open a junk PR (e.g. break a test deliberately), notice the
merge button is grayed out with "**Checks Failed**". Fix it, checks re-run,
button turns green. 🤖✅

> 📸 **Proof of work:** saved in **`docs/screenshots/10-branch-protection.png`** — the branch protection rules screen for `main` with status checks + required reviews visible.
> ![Proof of work — branch protection](screenshots/10-branch-protection.png)

---

## 📝 Step 2 — Add the pipeline badge to your README

One line of markdown, live status from GitHub:

```markdown
[![CI](https://github.com/<YOU>/<REPO>/actions/workflows/ci.yml/badge.svg)](https://github.com/<YOU>/<REPO>/actions/workflows/ci.yml)
```

Add it near the top of the root `README.md` and commit. Now anyone who opens
your repo sees the **"passing" / "failing"** badge — proof at a glance. Badges
are cheap social proof for portfolio repos. 🏅

---

## 📝 Step 3 — Get notified when a deploy fails

The fastest to zero config: **Settings → Actions → General → Workflow
permissions** stays read-only, and add two reporter actions to the deploy
workflow's final job. For example, on failure comments on the PR:

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
      - name: Notify email
        run: |
          # Sends a GitHub notification to everyone watching the repo
          echo "Deploy failed on ${{ github.event.repository.name }}">
          # real email/Slack/Discord need an integration (see below)
```

For real team alerts, drop an action into the failed job: `rtCamp/action-slack-notify@v2` with a Slack webhook secret, `Ilshidur/action-discord`, or a simple webhook to your inbox. The point: **the pipeline tells you loud, not silent.** 📣

---

## 📝 Step 4 — Dependabot (free security upgrades)

**Settings → Code security and analysis → Dependabot → "Enable"** for:

- **Dependabot alerts** — GitHub scans your deps and flags known CVEs (it already knows your SBOMs too).
- **Dependabot security updates** — auto-opens PRs for patched versions.
- **Dependabot version updates** — monthly PRs bumping npm deps.

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

Every Dependabot PR flies through your **protected `main`** pipeline — that's
the whole system working together: bot proposes → CI tests → you approve →
deploys. 🏗️

---

## 🧯 If something breaks

| Symptom | Cause | Fix |
|---------|-------|-----|
| Merge button stays gray despite green checks | "Branch up to date" flag | Re-merge `main` into the feature branch, push again |
| "Required status check not found" | Check name must match the *workflow* name | It's the `name:` of ci.yml, or use job name with a search |
| Can't push to main anymore | Correct! Protection is on 🚦 | Work via feature branches + PRs (Milestone 1 habit) |
| Dependabot PRs flood you | Monthly schedule still noisy | Lower to `weekly` or add `ignore` for versioned majors |

---

## ✅ Checkpoint

```
[ ] ✔️ main requires CI status checks + 1 review (no bypass)
[ ] ✔️ A deliberately-broken PR is blocked from merging
[ ] ✔️ README shows the live CI badge
[ ] ✔️ Dependabot enabled for npm + GitHub Actions
[ ] ✔️ Screenshot saved as docs/screenshots/10-branch-protection.png
```

---

➡️ **Next:** [Milestone 11 — The Final Pipeline & Portfolio Story](11-final-pipeline-and-portfolio-story.md)