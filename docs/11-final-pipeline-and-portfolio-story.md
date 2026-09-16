# 🏁 Milestone 11 — The Final Pipeline & Portfolio Story

## 🎯 Goal

Run the **entire pipeline from scratch** — one commit, all the way to a live
production site — then clean up and package the project as a portfolio piece
you can talk about for 10 minutes straight. 🎤

---

## 🧠 First, the whole picture (say it out loud, in order)

```
1  git checkout -b feature/price-widget          ← branch (M1)
2  code it, commit, push                          ← code (M1)
3  open PR                                        ← review flow (M1)
4  CI runs: lint + tests + docker + trivy (M3-4) ← automatic
5  merge to main                                  ← protected (M10)
6  build-and-push → GHCR (sha-<hash> tags) (M5)   ← automatic
7  staging deploy + health check (M7)             ← automatic
8  git tag v1.1.0 && push                         ← version (M5/M8)
9  prod deploy requested                          ← automatic
10 approval → prod live + health check (M8)       ← human + automatic
11 something breaks? rollback to v1.0.0 (M9)      ← one click
```

Read it again. Your hand did **almost none** of steps 4–10. That's not a demo;
that's a **software delivery pipeline**. 🚀

---

## 📝 Step 1 — The full end-to-end run (from scratch)

We'll deliberately redo the loop so the portfolio story is *witnessed*, not
recounted — then film/screenshot the very end (each step below links its
milestone's proof):

```powershell
# 1. Feature branch (M1)
git checkout -b feature/final-demo main
# make any small real change — fix a copy string, add an endpoint test

# 2. Run tests locally first (M2)
cd ci-cd-pipeline-app\backend; npm test          # all 6 green with DB, 3 green without

# 3. Commit + push + open PR (M1)
git add . && git commit -m "feat: final demo change"
git push -u origin feature/final-demo            # CI auto-runs on push (M3)
# open the PR on GitHub (M1)

# 4. Wait for CI, merge (M10)
#    merge button only unlocks when "CI — Lint, Test, Build & Scan" is green

# 5. Watch the chain fire by itself (M5 + M7)
#    main push → build-and-push → GHCR → deploy-staging → health check

# 6. Release it to production (M8)
git tag v1.1.0 && git push origin v1.1.0
#    build-and-push builds v1.1.0 → deploys prod → Waiting for approval

# 7. Approve (M8) → prod live
#    curl http://<PROD_IP>:8080/api/health → {"status":"ok",...}
```

If any link in the chain misbehaves, the checkpoint tables in Milestones 3–9
have the fixes. Fix → re-push → re-watch.

> 📸 **Proof of work (THE one):** saved in **`docs/screenshots/11-final-pipeline.png`** — the Actions **workflow runs list** for the release: **[build-and-push] ✅**, **[deploy-staging] ✅**, **[deploy-production] ✅ (after approval)**, plus the terminal `curl` returning `{"status":"ok",...}`. This one image is your whole project.
> ![Proof of work — final end-to-end pipeline](screenshots/11-final-pipeline.png)

---

## 📝 Step 2 — Harden the loose ends

| Check | Do |
|-------|----|
| Secrets | Never committed. `grep -r "password\|BEGIN.*PRIVATE KEY" .` should find nothing in the repo. |
| `.env` | In `.gitignore` AND `.dockerignore` (from Project 2 — verify). |
| SBOMs | Were uploaded on the last CI runs; the registry also shows them. |
| Branch rules | Still enforced after all the capers above? Settings → Branches → verify. |
| Costs | GitHub Actions: free minutes ✅ · GHCR: free ✅ · 2 tiny servers: the only cost (kill them after screenshots if you like). |

---

## 📝 Step 3 — The 12-second portfolio pitch

> *"I built a CI/CD pipeline for a full-stack Dockerized app. GitHub Actions runs
> lint, unit + integration tests, builds Docker images, scans them with Trivy,
> and pushes SBOMs. Images go to GHCR tagged by commit and version. Merges to
> main auto-deploy to staging behind SSH with a health check; production only
> deploys from a release tag after a human approves it — and I have a one-click
> rollback to any previous image. Branch protection means broken code can't
> reach main, and every dependency gets security-reviewed by Dependabot."*

22 seconds. No buzzwords you can't demo. Every clause = a screenshot you own. 🏆

### Deep-dive answers you can now give

| If asked… | Your answer |
|-----------|-------------|
| "Why did you use GitHub Actions?" | Native events (`pull_request`, `release`), free minutes, and the `GITHUB_TOKEN` — zero extra credential plumbing. |
| "CI vs CD?" | CI proves the code (lint/test/build/scan) before merge; CD ships the verified artifact and checks it came back healthy. |
| "How do you version images?" | Every image is `sha-<commit>`; releases also get `vX.Y.Z`; `latest` is only ever the newest `main`. |
| "How do you roll back?" | Redeploy a known-good tag via `rollback.yml` — I never "undo" the git history, I serve the last-known-good artifact. |
| "What would you do next?" | Blue/green zero-downtime swap; add end-to-end browser tests; wire a Slack/Discord alert to the failure path; move servers behind a load balancer. |

---

## ✅ Checkpoint

```
[ ] ✔️ Feature branch → PR → CI → merge → staging — all automatic
[ ] ✔️ Release tag → approval → production — end-to-end verified
[ ] ✔️ Health endpoint returns {"status":"ok"} after every deploy
[ ] ✔️ No secrets, keys, or .env files in the repo
[ ] ✔️ The ONE screenshot in docs/screenshots/11-final-pipeline.png
[ ] ✔️ You can say the 12-second pitch without reading
```

---

## 🏁 You did it

**Project 1** installed Linux and served a site.
**Project 2** made the whole stack reproducible with Docker.
**Project 3 — this one — automated delivery.**

The three projects tell a story: *I build it → I containerize it → I ship it
automatically.* That's a DevOps arc. Go wave it in front of interviewers. 🚀