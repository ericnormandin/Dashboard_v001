---
name: push
description: Commit and push all changes to GitHub. Runs ruff, stages everything, commits with an auto-generated message, and pushes to origin master.
---

Commit and push all current changes to GitHub. Always auto-generate the commit message — never ask the user for one.

## Step 1 — Lint and format

Run ruff on any modified Python files:

```powershell
cd "G:\Dashboard\Dashboard_v001"
.venv\Scripts\ruff format backend/
.venv\Scripts\ruff check backend/
```

If ruff check reports errors, show them to the user and stop. Ask them to fix the errors before pushing.

## Step 2 — Show what changed

Run:
```
git status
git diff --stat HEAD
```

Display the output so the user can see what will be committed. If there is nothing to commit (clean working tree), tell the user and stop.

## Step 3 — Generate commit message

Look at `git diff --stat HEAD` and the actual diff to write a short, specific commit message (1 sentence, imperative mood, e.g. "Add crypto refresh button and fix balance alignment"). Do not use generic messages like "Update files". Never ask the user for a message.

## Step 4 — Stage and commit

```
git add -A
git commit -m "<generated message>"
```

## Step 5 — Push

```
git push origin master
```

## Step 6 — Confirm

Show the user:
- The commit hash and message
- Confirmation that push succeeded
- The GitHub URL: https://github.com/ericnormandin/Dashboard_v001
