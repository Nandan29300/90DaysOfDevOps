# Day 25 – Git Reset vs Revert & Branching Strategies

---

## Task 1: Git Reset — Hands-On

### Step 1: Make 3 Commits (A, B, C)
```bash
echo "A" > reset-demo.txt
git add reset-demo.txt
git commit -m "Commit A"
echo "B" >> reset-demo.txt
git add reset-demo.txt
git commit -m "Commit B"
echo "C" >> reset-demo.txt
git add reset-demo.txt
git commit -m "Commit C"
```
**Explanation:**  
Now the file contains lines A, B, and C. Your history is: A → B → C.

---

### Step 2: Use `git reset --soft` to go back one commit
```bash
git reset --soft HEAD~1
```
**Output/Behavior:**  
- The last commit (C) is undone.
- **All your changes from C are now staged** (in the index/ready to commit).

**Check status:**
```bash
git status
```
_It will show the changes from C as staged._

**Explanation:**  
Use `--soft` when you want to edit or amend the last commit, but keep all changes staged.

---

### Step 3: Re-commit, then use `git reset --mixed` to go back one commit
```bash
git commit -m "Commit C"
git reset --mixed HEAD~1
```
**Output/Behavior:**  
- The last commit (C) is undone.
- **All your changes from C are unstaged** (in working directory, not yet added).

**Check status:**
```bash
git status
```
_It will show the changes from C as unstaged (red)._

**Explanation:**  
Use `--mixed` (default) to edit the last commit and decide what to stage again.

---

### Step 4: Re-commit, then use `git reset --hard` to go back one commit
```bash
git add reset-demo.txt
git commit -m "Commit C"
git reset --hard HEAD~1
```
**Output/Behavior:**  
- The last commit (C) is **completely erased and all changes are lost**.
- **Your working directory is reverted** to commit B state.

**Check status:**
```bash
git status
```
_Nothing related to C will be present._

**Explanation:**  
`--hard` is DESTRUCTIVE: any uncommitted changes **and** the last commit are lost.

---

### Answers

- **Difference between --soft, --mixed, --hard:**  
  - `--soft`: Undo commit(s), keep changes staged & ready to commit.  
  - `--mixed`: Undo commit(s), keep changes in working directory (unstaged).  
  - `--hard`: Undo commit(s), discard changes completely (dangerous!).

- **Which is destructive and why?**  
  - `--hard` is destructive: it completely deletes both commit(s) and any file changes.

- **When would you use each one?**
  - `--soft`: Want to reword/amend a commit, or squash commits.
  - `--mixed`: Want to redo a commit, or change staged contents.
  - `--hard`: Only when you are sure you want to **permanently** discard work (not pushed/saved).

- **Should you ever use git reset on commits that are already pushed?**
  - **NO!** This rewrites public history, will break collaborators’ copies, and cause major merge headaches.

---

## Task 2: Git Revert — Hands-On

### Step 1: Make 3 Commits (X, Y, Z)
```bash
echo "X" > revert-demo.txt
git add revert-demo.txt
git commit -m "Commit X"
echo "Y" >> revert-demo.txt
git add revert-demo.txt
git commit -m "Commit Y"
echo "Z" >> revert-demo.txt
git add revert-demo.txt
git commit -m "Commit Z"
```
_History: X → Y → Z_

---

### Step 2: Revert commit Y (the middle one)
Get the commit hash for "Commit Y":
```bash
git log --oneline
# Example output:
# 098d3d2 (HEAD -> main) Commit Z
# 92fae5c Commit Y
# a676bbf Commit X
git revert 92fae5c
```
**Behavior:**  
- Revert creates a **new commit** that undoes the changes introduced by commit Y, but keeps all history.

---

### Step 3: Check `git log`
```bash
git log --oneline
```
**Observation:**  
- "Commit Y" is still present in the history, but a new "Revert 'Commit Y'" appears at the top.

---

### Answers

- **How is git revert different from git reset?**  
  - `revert` adds a new commit that undoes a previous commit; it doesn’t change history.  
  - `reset` erases commits/change history, moving the branch pointer backward.

- **Why is revert safer for shared branches?**  
  - It never deletes history or changes commit hashes, so other collaborators aren’t affected.

- **When would you use revert vs reset?**
  - `revert`: Use for public/shared history (undo a commit safely).
  - `reset`: Use for local and unpublished work only.

---

## Task 3: Reset vs Revert — Summary

|                     | git reset                   | git revert                          |
|---------------------|----------------------------|-------------------------------------|
| What it does        | Moves branch pointer; may remove commits and changes | Creates new commit to undo changes |
| Removes commit from history? | Yes (for reset point + after) | No — old commit stays, new “undo” commit added |
| Safe for shared/pushed branches? | No | Yes |
| When to use         | Amending/reordering/squashing local, unpublished work | Undo/change *public* project history safely |

---

## Task 4: Branching Strategies

---

### 1. **GitFlow**

**How it works:**  
- Uses several branches: `main` for releases, `develop` as integration, `feature/*` for features, `release/*` for prepping releases, `hotfix/*` for urgent bugs.

**Text Diagram:**
```
main
 │
 ├───┬─────────   (hotfix/)
 │   │
develop
 │   ├──feature/1
 │   └──feature/2
 │
release/
```

**When/where:**  
- Used for large projects with scheduled releases and multiple developers.

**Pros:**  
- Clear structure for features, releases, and urgent fixes.
- Supports parallel development and release staging.

**Cons:**  
- Complex; overhead for small teams.
- Can be slow due to multiple integration points.

---

### 2. **GitHub Flow**

**How it works:**  
- Start from `main`.
- Create short-lived feature branches.
- Open pull requests when ready.
- Merge into `main` after review/tests.

**Text Diagram:**
```
main
  \
   feature-xyz
      /
   main
```

**When/where:**  
- Continuous deployment, open source, and small to medium teams.

**Pros:**  
- Simple, fast-moving, great for CI/CD.
- Easy to use.

**Cons:**  
- Less structure; may need discipline for big projects.
- No dedicated staging/release branches.

---

### 3. **Trunk-Based Development**

**How it works:**  
- All developers work on a single branch (main/trunk).
- Branches are very short-lived (a few hours or a day), merged frequently.

**Text Diagram:**
```
main
 ├─feat-a─┘
 ├─feat-b─┘
```

**When/where:**  
- Used by high-velocity teams, companies with strong CI (e.g., Google).

**Pros:**  
- Maximum delivery speed, very few merge conflicts.
- Simple history.

**Cons:**  
- Needs discipline, robust tests and CI.
- Not suitable for delayed releases or large features without feature flags.

---

### Branching Strategy Answers

- **Which strategy for a startup shipping fast?:**  
  Trunk-Based or GitHub Flow — prioritize speed and simplicity.

- **Which strategy for a large team with scheduled releases?:**  
  GitFlow — better structure for handling features, releases, and hotfixes.

- **Which one does your favorite open-source project use?:**  
  Most modern open source projects (e.g., React, VSCode) use GitHub Flow: single `main`, feature branches, pull requests.

---

## Task 5: Git Commands Reference Update

**See your updated `git-commands.md` for all commands from setup to advanced resets, revert, and more (see below for which commands to add!).**

---

## Hints & Safety Nets

- If you ever reset too far, `git reflog` will show every branch movement and let you restore lost commits:  
  ```bash
  git reflog
  git checkout <old-commit>
  ```
- Never use `git reset` (except soft) on commits that have been pushed/shared!

---

## Key Takeaways

- Undoing mistakes is as vital as making progress in DevOps!
- Always protect shared/public history: use `revert` there.
- Choose a branching strategy that fits your team’s size, pace, and stability needs.

---