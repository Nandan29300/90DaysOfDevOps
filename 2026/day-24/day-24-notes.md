# Day 24 – Advanced Git: Merge, Rebase, Stash & Cherry Pick

---

## Task 1: Git Merge — Hands-On

**What is a fast-forward merge?**  
A fast-forward merge happens when the branch you’re merging has all the latest commits from the branch you’re merging into (e.g. `main`). Git just moves the branch pointer forward; no extra merge commit is created.

**When does Git create a merge commit instead?**  
A merge commit is created when both branches have divergent changes after their common ancestor (i.e., both have unique commits). Git has to actually combine histories, so it creates an explicit "merge commit."

**What is a merge conflict?**  
A merge conflict occurs when the same part of a file has been changed differently in both branches. Git cannot resolve the difference and asks you to resolve it manually.

*How to try it:*  
- Create/edit the SAME line of a file in two branches, then merge them.

---

## Task 2: Git Rebase — Hands-On

**What does rebase actually do to your commits?**  
Rebase takes commits from one branch and "reapplies" them on top of another branch, creating new commit hashes and a linear history.

**How is the history different from a merge?**  
- **Merge:** Keeps branching, merges, and all commit history (including branch points & merges).  
- **Rebase:** Creates a straight, linear sequence of commits; no merge commits.

**Why should you never rebase commits that have been pushed and shared with others?**  
Because rebase rewrites commit history—if other collaborators have based their work off these commits, rebasing and force-pushing can break their history and create major confusion.

**When would you use rebase vs merge?**  
- **Rebase:** Keeps history linear and clean, good for small feature branches before merging to main (before pushing).
- **Merge:** Retains full historical context, preferable for collaborative, public branches or when merge history is important.

---

## Task 3: Squash Commit vs Merge Commit

**What does squash merging do?**  
Squash merging combines all commits from a feature branch into a single commit when merging to main.

**When would you use squash merge vs regular merge?**  
- **Squash:** When you want a simple history with one commit per feature, keeping main clean.
- **Regular merge:** When you want to keep detailed history of all commits made in a branch.

**What is the trade-off of squashing?**  
You lose the fine-grained commit-by-commit history for that feature. It’s good for clarity but bad if you need to see all granular steps.

---

## Task 4: Git Stash — Hands-On

**What is the difference between git stash pop and git stash apply?**  
- `git stash apply` applies the stashed changes, but keeps the stash in the stash list.  
- `git stash pop` applies the stash and removes it from the list (like "apply and delete").

**When would you use stash in a real-world workflow?**  
When you have work in progress you’re not ready to commit, but need to quickly switch branches, pull, or do something else.

---

## Task 5: Cherry Picking

**What does cherry-pick do?**  
It lets you apply a specific commit from one branch onto another, even if the branches aren’t merged.

**When would you use cherry-pick in a real project?**  
To move a bugfix or important change from one branch to another without merging all branch commits (example: hotfix to main).

**What can go wrong with cherry-picking?**  
- Can create duplicate commits if not careful.
- If the cherry-picked code depends on earlier commits that are missing on the target, it can cause conflicts or bugs.
- Can cause confusing history if overused.

---

## Extra Observations & Tips
- Use `git log --oneline --graph --all` to visualize merges, rebases, and squash merges.
- Always resolve merge conflicts before committing!
- Never rebase public/shared branches that others are working on.
- Stash is great for juggling urgent context switches.
- Squash merges = clean history, but less detail.
- Cherry-picking is a scalpel, but should be used with care.