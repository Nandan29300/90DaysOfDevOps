# Day 23 – Git Branching & Working with GitHub

---

## Task 1: Understanding Branches

**Q: What is a branch in Git?**  
A branch is an independent line of development in your project. Think of it as a movable pointer to a commit. You can use branches to isolate work on features, bug fixes, and experiments, without affecting the main codebase.

---

**Q: Why do we use branches instead of committing everything to main?**  
Branches prevent the main branch from being broken by unfinished work. They let you develop new features, fix bugs, or experiment in isolation. You can merge, review, or discard changes without impacting stable code, and multiple people can work in parallel.

---

**Q: What is HEAD in Git?**  
HEAD is a reference to your current working branch or commit. When you make a new commit, HEAD moves forward. If you switch branches, HEAD updates to point to the branch tip you switched to.

---

**Q: What happens to your files when you switch branches?**  
When you switch branches, Git replaces files in your working directory with those from the target branch. This ensures your folder contains exactly the state tracked by that branch. If you have uncommitted changes, Git may warn or prevent you from switching.

---

## Task 2: Branching Commands — Hands-On

**List all branches in your repo**
```bash
git branch
```
*Output:*
```
* main
  feature-1
```

---

**Create a new branch called feature-1**
```bash
git branch feature-1
```
*This creates the branch, but doesn’t move you to it.*

**Switch to feature-1**
```bash
git switch feature-1
```
*Or, old style:* `git checkout feature-1`

---

**Create and switch to feature-2 in a single command**
```bash
git switch -c feature-2
```
*Or:* `git checkout -b feature-2`

---

**Switch between branches using git switch**
```bash
git switch main
git switch feature-1
```
*Modern and safer than `git checkout`, which also lets you checkout files.*

---

**How is git switch different from git checkout?**  
`git switch` is focused solely on changing branches; it avoids confusion and is safer for beginners. `git checkout` is more flexible, but can also check out files, which sometimes leads to mistakes.

---

**Make a commit on feature-1 that does not exist on main**
```bash
git switch feature-1
echo "Feature-1 update" >> demo.txt
git add demo.txt
git commit -m "Add feature-1 specific update"
```
*This commit exists only on feature-1.*

**Switch back to main and verify the commit is not there**
```bash
git switch main
cat demo.txt    # Should NOT show the feature-1 update unless merged.
```

---

**Delete a branch you no longer need**
```bash
git branch -d feature-2
```
*Deletes the local branch. To delete on remote: `git push origin --delete feature-2`*

---

## Task 3: Push to GitHub

**Create a GitHub repo (do NOT initialize with README)**
- On GitHub, click "New" and create your repo: `devops-git-practice`.

---

**Connect local repo to GitHub**
```bash
git remote add origin https://github.com/<your-username>/devops-git-practice.git
```

**Push your main branch**
```bash
git push -u origin main
```

**Push feature-1 branch**
```bash
git push -u origin feature-1
```

**Verify branches on GitHub:**
- Go to your repo page, click "Branch" dropdown. You should see `main` and `feature-1`.

---

**Q: What is the difference between origin and upstream?**  
- **origin** is the name given to your primary remote repository (usually your fork or your repo).
- **upstream** typically refers to the original repository you forked from, useful for syncing your fork with the source.

---

## Task 4: Pull from GitHub

**Make a change to a file directly on GitHub**
- In your repo, click a file (e.g., `README.md`), click edit, make a change, and commit.

**Pull that change to your local repo**
```bash
git pull origin main
```
*This downloads and merges the changes from GitHub.*

---

**Q: What is the difference between git fetch and git pull?**  
- `git fetch` downloads new data from the remote, but doesn’t update your working branch. 
- `git pull` does `git fetch` and then merges the changes into your current branch.

---

## Task 5: Clone vs Fork

**Clone a public repository**
```bash
git clone https://github.com/someuser/somerepo.git
```

**Fork the same repository on GitHub, then clone your fork**
- On GitHub, click "Fork" on the repo, then:
```bash
git clone https://github.com/<your-username>/somerepo.git
```

---

**Q: What is the difference between clone and fork?**  
- **Fork:** Makes a copy of the repo on your GitHub account. Lets you freely experiment and submit changes via pull requests.
- **Clone:** Downloads any repo (yours or others’) to your local machine, but doesn’t give you push rights unless you own/collaborate.

---

**Q: When would you clone vs fork?**
- **Clone:** Use when you want to work on your own repo or have push rights and just want a local copy.
- **Fork:** Use when you want to contribute to someone else’s project, experiment independently, or propose changes that you don’t directly control.

---

**Q: After forking, how do you keep your fork in sync with the original repo?**
```bash
git remote add upstream https://github.com/original-owner/somerepo.git
git fetch upstream
git merge upstream/main   # Or: git rebase upstream/main
```
*This fetches changes from the original repo into your fork.*

---

## Tips & Points to Remember

- Branches let you work safely without breaking main.
- Use `git switch` for clear branch switching.
- Always push your branches before creating pull requests.
- Deleting branches removes clutter, but make sure changes are merged if needed.
- `origin` is your working remote; `upstream` is for syncing forks.
- Use `git pull` for quick updates; use `git fetch` first to review changes before merging.
- To see remote branches: `git branch -r`
- Forking is a GitHub feature, not a Git command.
- To keep your fork updated, add upstream as a remote.
- Clear, descriptive branch names help collaboration.

---