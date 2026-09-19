# 🌿 Milestone 1 — Setup, Git Branching & Pull Requests

## 🎯 Goal (plain English)

Put your repo on GitHub and learn the **branch → pull request → merge** habit —
because that exact flow is what your CI pipeline will react to for the rest of
this project.

Think of it as learning the *traffic lights* before you build the *road*.

---

## 🤔 Why this matters

Your pipeline is triggered by **GitHub events**:

| Event (what you do) | The pipeline hears… | And does… |
|---|---|---|
| `git push` to a branch | a "push" event | runs CI checks on that branch |
| Open / update a Pull Request | a "pull_request" event | runs CI checks **on the PR** |
| Code reaches `main` | a push to `main` | runs CI **again**, then CD deploys it |

So before writing any YAML, you need the branching flow in your muscle memory.

---

## 📝 Step 1 — What you need

| Tool | Why |
|------|-----|
| Git (v2.40+) | Version control |
| GitHub account (free) | Repo + 2,000 free Actions minutes/month |
| `gh` CLI (optional, handy) | Create repos/PRs from the terminal |

Check Git works:

```powershell
git --version
```

> 💡 Done all of this in Project 2? You're already set.

---

## 📝 Step 2 — The branching model (the habit)

Real teams never push straight to `main`. Always: **new branch → work → PR → merge**.

```
main ──●───────────────────────────●─────────── main
         \                       /
feature ──●─── commits ────────●─── feature/login
                                     └─ Pull Request = "please review + merge this"
```

A **branch** = a movable bookmark in history. A **Pull Request** = "I propose
this merge, please review it." That full picture is the *gate* your pipeline
will guard.

---

## 📝 Step 3 — Create the repo + your first branch

Create a **new, EMPTY GitHub repo** (no README, no `.gitignore` — the repo
already has both). Then push this project:

```powershell
cd ci-cd-pipeline-app

git init
git add .
git commit -m "init: CI/CD pipeline project"

# point at YOUR repo (replace <YOU> and <cicd-pipeline>)
git remote add origin https://github.com/<YOU>/<cicd-pipeline>.git
git branch -M main          # make sure the default branch is named main
git push -u origin main     # upload
```

Now make a feature branch (you'll let CI run on it in Milestone 6):

```powershell
git checkout -b feature/hello        # create + switch to a new branch
# make any small change, e.g. add a comment line to a file
git add .
git commit -m "chore: first feature branch commit"
git push -u origin feature/hello
```

Open the repo on GitHub → you'll see your new branch and a **"Compare & pull
request"** button. Click it, give it a title, create the PR. **Do not merge
yet** — Milestone 6's CI needs to run on it first.

> 📸 **Proof of work:** save **`docs/screenshots/01-git-branching.png`** — your
> repo's **Insights → Network graph** (or GitHub Desktop history) showing `main`
> + `feature/hello`, plus your open Pull Request.

---

## 📝 Step 4 — The daily loop (say this until it's a habit)

```text
1. git checkout -b feature/xyz        start fresh from main
2. code, commit, commit, commit       small commits, clear messages
3. git push -u origin feature/xyz     share the branch
4. open a PR on GitHub                ask for a review
5. CI runs on the PR                  ← added in Milestones 6–7
6. fix whatever CI flags              push again → PR updates automatically
7. merge to main                      ← CD deploys (Milestones 10–11)
```

---

## 🧠 The mental model (jargon → plain words)

| Concept | Plain words | Why it matters for CI/CD |
|---------|-------------|--------------------------|
| `branch` | A movable bookmark in history | Lets a feature be tested in isolation |
| Pull Request | "Proposed merge, please review" | Gives CI a natural **gate** |
| merge to `main` | The code became official | The *trigger* for deployment |
| Merge conflict | Two branches edited the same line | Happens; fix it, push, CI re-runs |

---

## ✅ Checkpoint

```
[ ] ✔️ Repo pushed to GitHub with this project
[ ] ✔️ feature/hello branch exists and is pushed
[ ] ✔️ A Pull Request is open (still open — don't merge yet!)
[ ] ✔️ You can explain: push event vs pull_request event vs merge to main
```

---

## ➡️ Where to next?

- **Option 1 — using the included app:** jump to
  [Milestone 5 — Make the App Testable](05-make-the-app-testable.md)
- **Option 2 — build the app yourself:** start with
  [Milestone 2 — Build the Frontend (React)](02-build-the-app-frontend.md)