# Day 24 – Advanced Git: Merge, Rebase, Stash & Cherry Pick

---

## Task 1: Git Merge — Hands-On

**Step 1:** Create a new branch `feature-login` from main and add a couple of commits
```bash
git checkout main
git checkout -b feature-login
echo 'Login page UI' > login.txt
git add login.txt
git commit -m "Add login page UI"
echo 'Login backend' >> login.txt
git add login.txt
git commit -m "Add login backend"
```
**Explanation:**  
You’ve created a new branch, added a file, and committed changes twice on `feature-login`.

---

**Step 2:** Switch back to main and merge `feature-login` into `main`
```bash
git checkout main
git merge feature-login
```
**Possible Output (fast-forward):**
```
Updating b1f35d7..a3e01c2
Fast-forward
 login.txt | 2 ++
 1 file changed, 2 insertions(+)
```
**Explanation:**  
- This is a **fast-forward merge** because `main` had no new commits since the branch was made, so Git simply moves the branch pointer forward.

---

**Step 3:** Create another branch `feature-signup`, add commits, then add a commit to main before merging

**On main:**
```bash
git checkout main
git checkout -b feature-signup
echo 'Signup page UI' > signup.txt
git add signup.txt
git commit -m "Add signup page UI"
```
**Switch to main and commit:**
```bash
git checkout main
echo 'Password help' >> login.txt
git add login.txt
git commit -m "Add password help section"
```
**Switch back and add another commit to `feature-signup`:**
```bash
git checkout feature-signup
echo 'Signup validation' >> signup.txt
git add signup.txt
git commit -m "Add signup validation"
```

---

**Step 4:** Merge `feature-signup` into main
```bash
git checkout main
git merge feature-signup
```
**Possible Output (merge commit):**
```
Auto-merging signup.txt
Merge made by the 'ort' strategy.
 signup.txt | 2 ++
 1 file changed, 2 insertions(+)
```
**Explanation:**  
Since main had a new commit after you branched, this merge required a **merge commit**, not a fast-forward.

---

**Step 5:** Create a merge conflict
- Edit the same line in, e.g., `login.txt` on both main and `feature-signup`, then try merging:

On main:
```bash
echo "Change on main" > conflict.txt
git add conflict.txt
git commit -m "Main branch change for merge conflict"
```
On feature-signup:
```bash
git checkout feature-signup
echo "Change on signup branch" > conflict.txt
git add conflict.txt
git commit -m "Signup branch change for merge conflict"
git checkout main
git merge feature-signup
```
**Output:**
```
Auto-merging conflict.txt
CONFLICT (content): Merge conflict in conflict.txt
Automatic merge failed; fix conflicts and then commit the result.
```
**Explanation:**  
You must open `conflict.txt`, resolve the conflicting lines, then:
```bash
git add conflict.txt
git commit
```
to complete the merge.

---

### Merge Answers

- **Fast-forward merge:** Moves the branch pointer ahead if there’s no new work on the base branch.
- **Merge commit:** Created when both branches have unique work since the split; history combines, and a new commit is generated.
- **Merge conflict:** Happens when the same file (same lines) change on both branches and Git can’t auto-resolve.

---

## Task 2: Git Rebase — Hands-On

**Step 1:** Create `feature-dashboard` from main, add 2-3 commits
```bash
git checkout main
git checkout -b feature-dashboard
echo 'Dashboard v1' > dashboard.txt
git add dashboard.txt
git commit -m "Add dashboard v1"
echo 'Dashboard chart' >> dashboard.txt
git add dashboard.txt
git commit -m "Add dashboard chart"
```
**Step 2:** While on main, add a new commit
```bash
git checkout main
echo 'Main new info' > important.txt
git add important.txt
git commit -m "Add important.txt on main"
```
**Step 3:** Rebase `feature-dashboard` onto main
```bash
git checkout feature-dashboard
git rebase main
```
---
**Observe history:**
```bash
git log --oneline --graph --all
```
**Explanation:**  
Your feature branch's commits are replayed cleanly on top of main’s latest commit, creating a straight line in history.

---

### Rebase Answers

- **What does rebase do?**  
  Moves your commits to the tip of the base branch, replaying each and possibly giving new commit hashes (linearizing history).
- **How is history different?**  
  Rebase creates a linear sequence; merge creates a visible “join”.
- **Why avoid rebasing shared commits?**  
  Because history is rewritten—others’ clones will break or diverge.
- **When use rebase vs merge?**  
  - Use rebase to tidy up local, unpublished branches.
  - Use merge to preserve all details and context, especially cooperatively/shared work.

---

## Task 3: Squash Commit vs Merge Commit

**Step 1:** Create `feature-profile`, add 4-5 small commits
```bash
git checkout main
git checkout -b feature-profile
echo "typo" > profile.txt; git add profile.txt; git commit -m "Typo fix"
echo "better format" >> profile.txt; git add profile.txt; git commit -m "Format improved"
echo "color" >> profile.txt; git add profile.txt; git commit -m "Color tweak"
echo "extra data" >> profile.txt; git add profile.txt; git commit -m "Add extra data"
echo "final touch" >> profile.txt; git add profile.txt; git commit -m "Final touch"
```
**Step 2:** Merge using `--squash`
```bash
git checkout main
git merge --squash feature-profile
git commit -m "Add all profile tweaks (squashed)"
```
**Output:**  
One new commit on main with the sum of changes.

**Step 3:** Now create another branch `feature-settings`, add a few commits, and merge without `--squash`
```bash
git checkout main
git checkout -b feature-settings
echo "Settings init" > settings.txt; git add settings.txt; git commit -m "Init settings"
echo "Dark mode" >> settings.txt; git add settings.txt; git commit -m "Add dark mode"
git checkout main
git merge feature-settings
```
**Output:**  
All individual commits from feature-settings appear in the history.

---

### Squash vs Merge Answers

- **Squash merging:** Takes all commits and combines them into one.
- **Squash merge:** Use for minor/granular commits when you want a simple main history.
- **Trade-off:** Lose detail of individual commit history.

---

## Task 4: Git Stash — Hands-On

**Step 1:** Start changes, do NOT commit
```bash
echo "work work" > stashme.txt
```
**Step 2:** Try to switch (if file is not staged/committed, you may get a warning)
```bash
git switch main
```
**If there's a conflict, use stash:**
```bash
git stash
```
**Switch and work:**
```bash
git switch main
echo "Quick fix" > urgent.txt
git add urgent.txt
git commit -m "Urgent fix on main"
```
**Return and re-apply stashed changes:**
```bash
git switch feature-profile
git stash pop
```
**Stash multiple times, list them:**
```bash
git stash
git stash push -m "Second stash"
git stash list
```
**Apply a specific stash:**
```bash
git stash apply stash@{1}
```

---

### Stash Answers

- **git stash pop vs git stash apply:**  
  - `pop` applies stashed changes and removes from stash list.
  - `apply` applies, but keeps it in list.
- **When to use stash:**  
  - When you need to save work-in-progress but can’t commit yet (context switch, urgent fix, code review, etc).

---

## Task 5: Cherry Picking

**Step 1:** Create branch, make 3 commits
```bash
git checkout main
git checkout -b feature-hotfix
echo "Hotfix 1" > hotfix.txt; git add hotfix.txt; git commit -m "Hotfix 1"
echo "Hotfix 2" >> hotfix.txt; git add hotfix.txt; git commit -m "Hotfix 2"
echo "Hotfix 3" >> hotfix.txt; git add hotfix.txt; git commit -m "Hotfix 3"
```
**Step 2:** Switch to main, cherry-pick ONLY the second commit
```bash
git checkout main
git log --oneline feature-hotfix
# Copy the commit hash of "Hotfix 2", e.g. abcd123
git cherry-pick abcd123
```

**Check your log; only that commit should appear on main.**

---

### Cherry-pick Answers

- **What does cherry-pick do?**  
  Applies one specific commit from another branch to your current branch.
- **When to use:**  
  Bring a specific bugfix, update, or feature across branches without merging all work.
- **What can go wrong:**  
  Cherry-picked commits may depend on earlier commits, creating conflicts or missing context. Duplicates can make confusing history.

---

## Observations & Tips

- Use `git log --oneline --graph --all` to see branching and merging visually.
- Always resolve any merge or stash conflicts before continuing.
- Don’t rebase publicly shared branches.
- Cherry-pick for precision, but be aware of dependencies.
- Stash is ideal for unfinished work and quick branch switches.
- Squash for history clarity, but merge normally for full context.

---