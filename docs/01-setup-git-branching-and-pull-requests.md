# 🌿 Milestone 1 — Setup, Git Branching & Pull Requests

## 🎯 Goal

Get your repo on GitHub, learn the **branching + pull request model** — because
that's exactly the flow your CI pipeline is going to hook into.

---

## 📝 Step 1 — What you need

| Tool | Why |
|------|-----|
| Git (v2.40+) | Version control |
| GitHub account (free) | Repo + free Actions minutes (2,000/month) |
| `gh` CLI (helpful, optional) | Create repos and PRs from the terminal |

Check from PowerShell:

```powershell
git --version
```

> 💡 You already have all of this if you finished Project 2.

---

## 📝 Step 2 — The branching model

Real teams never push directly to `main`. Always **branch → PR → merge**:

```
main ──●───────────────────────────●─────────── main (deploys to staging)
         \                       /
feature ──●─── commits ────────●─── feature/login
                                    └─ Pull Request = "please review + merge this"
```

### The 3 questions pipelines care about

| Question | Where GitHub answers it | What your pipeline does with it |
|----------|------------------------|--------------------------------|
| "Someone pushed code" | `push` event | CI runs on the branch |
| "Someone opened a PR" | `pull_request` event (`opened`, `synchronize`, …) | CI runs AND blocks the merge button if it fails |
| "Code reached `main`" | `push` to `main` | CI runs again, then CD *deploys* |

Three events, one idea: **the pipeline reacts to GitHub events**. You'll write
these as the `on:` block in Milestone 6.

---

## 📝 Step 3 — Create the repo + first branch

Create a **new, empty GitHub repo** (no README, no `.gitignore` — you have them
already). Then push this project:

```powershell
cd ci-cd-pipeline-app

git init
git add .
git commit -m "init: CI/CD pipeline project"

# point at YOUR repo
git remote add origin https://github.com/<YOU>/<cicd-pipeline>.git
git branch -M main
git push -u origin main
```

Now make your first feature branch (you'll ruin it later in Milestone 6 — that's the point):

```powershell
git checkout -b feature/hello
# edit something innocuous, e.g. add a line to backend/README.md or a comment
git add .
git commit -m "chore: first feature branch commit"
git push -u origin feature/hello
```

Open the repo on GitHub 👉 you'll see your new branch and a friendly
**"Compare & pull request"** button. Click it, add a title, create the PR.
Do **not** merge yet — the CI (Milestone 6) has to run on it first.

> 📸 **Proof of work:** saved in **`docs/screenshots/01-git-branching.png`** — your repo's **Insights → Network graph** (or GitHub Desktop history) showing `main` and `feature/hello`, plus your open Pull Request.
> ![Proof of work — branch graph + PR](screenshots/01-git-branching.png)

---

## 📝 Step 4 — The daily loop (say this as a habit)

```text
1. git checkout -b feature/xyz        start fresh from main
2. code, commit, commit, commit       small commits, clear messages
3. git push -u origin feature/xyz     share the branch
4. open a PR on GitHub                request review
5. CI runs on the PR                  ← Milestones 6-7
6. fix whatever CI flags              push again → PR updates
7. merge to main                      ← CD deploys (Milestones 10-11)
```

---

## 🧠 The mental model

| Concept | Plain words | Why it matters for CI/CD |
|---------|-------------|--------------------------|
| `branch` | A movable bookmark in history | Lets a feature be tested in isolation |
| Pull Request | "Proposed merge, please review" | Gives CI a natural **gate** |
| `merge to main` | The code became official | The *trigger* for deployment |
| Merge conflict | Two branches edited the same line | Happens; resolve, push, CI re-runs |

---

## ✅ Checkpoint

```
[ ] ✔️ Repo pushed to GitHub with this project
[ ] ✔️ feature/hello branch exists and is pushed
[ ] ✔️ You opened a Pull Request (still open!)
[ ] ✔️ You can explain: push event vs pull_request event vs merge to main
```

---

## ➡️ Where to next?

**Option 1 — using the app that comes with this repo** (skip the app-building):
jump ahead and start wiring up the pipeline:

🔀→ [Milestone 5 — Make the App Testable](05-make-the-app-testable.md)

**Option 2 — build the app yourself from scratch** (then hit the pipeline):

🎨→ [Milestone 2 — Build the Frontend (React)](02-build-the-app-frontend.md)