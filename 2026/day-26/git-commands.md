# Git Commands Reference


> Keep adding new commands here every day!

## Setup & Config

### 1. Check if git is installed
**What it does:** Verifies Git installation and shows installed version.
**Example:**
```bash
git --version
```

### 2. Set your Git username
**What it does:** Configures your name for git commits.
**Example:**
```bash
git config --global user.name "Your Name"
```

### 3. Set your Git email
**What it does:** Configures your email for git commits.
**Example:**
```bash
git config --global user.email "your@email.com"
```

### 4. View current configuration
**What it does:** Lists your git configuration details.
**Example:**
```bash
git config --list
```

---

## Basic Workflow

### 5. Initialize a repository
**What it does:** Makes the current folder a git repository by creating a `.git/` folder.
**Example:**
```bash
git init
```

### 6. Check status
**What it does:** Shows the state of staged, unstaged, and untracked files.
**Example:**
```bash
git status
```

---

## Viewing Changes

### 7. See what’s changed (unstaged)
**What it does:** Shows changes in files that are not yet staged.
**Example:**
```bash
git diff
```

### 8. See staged changes
**What it does:** Shows changes that are staged (will be committed).
**Example:**
```bash
git diff --cached
```

---

## Staging & Committing

### 9. Stage a file
**What it does:** Adds file(s) to the staging area, ready to commit.
**Example:**
```bash
git add git-commands.md
```

### 10. Stage all files
**What it does:** Adds all files to staging area.
**Example:**
```bash
git add .
```

### 11. Commit staged changes
**What it does:** Records the staged snapshot to the repo history.
**Example:**
```bash
git commit -m "Add initial set of git commands"
```

### 12. View commit history
**What it does:** Shows the committed snapshots (commits).
**Example:**
```bash
git log
```

### 13. View compact commit history
**What it does:** Shows the commit history in a one-line, summarized format.
**Example:**
```bash
git log --oneline
```

---

## Exploring Git internals

### 14. Show hidden files/folders in directory
**What it does:** See contents, including `.git/`
**Example:**
```bash
ls -a
```

---

## Branching

### List all branches
**What it does:** Shows all local branches.
```bash
git branch
```

### Create a new branch
**What it does:** Makes a new branch from your current commit.
```bash
git branch feature-1
```

### Create and switch to a new branch (shortcut)
**What it does:** Creates and instantly moves to the new branch.
```bash
git switch -c feature-2
```
*Or:*
```bash
git checkout -b feature-2
```

### Switch branches
**What it does:** Changes your working directory to a different branch.
```bash
git switch main
git switch feature-1
```
*Or, old command:*
```bash
git checkout feature-1
```

### Delete a branch
**What it does:** Removes a branch (after it’s merged or if not needed).
```bash
git branch -d feature-2
```

---

## Push & Remotes

### Add a remote repository
**What it does:** Connects your local repo to a remote (e.g., GitHub).
```bash
git remote add origin https://github.com/<username>/<repo>.git
```

### Push a branch to GitHub
**What it does:** Uploads your branch to GitHub.
```bash
git push -u origin main
git push -u origin feature-1
```

### Delete a remote branch
**What it does:** Removes a branch on GitHub.
```bash
git push origin --delete feature-2
```

---

## Pull & Fetch

### Pull changes from remote
**What it does:** Downloads and applies changes from GitHub.
```bash
git pull origin main
```

### Fetch changes from remote
**What it does:** Downloads changes (but doesn’t apply them).
```bash
git fetch origin
```

---

## Clone vs Fork

### Clone a public repo
**What it does:** Copies an entire repo from GitHub to your machine.
```bash
git clone https://github.com/someuser/somerepo.git
```

---

### Add upstream remote (keep your fork in sync)
**What it does:** Links your fork to the original repo.
```bash
git remote add upstream https://github.com/original-owner/somerepo.git
```

### Fetch changes from upstream
**What it does:** Downloads changes from original repo.
```bash
git fetch upstream
```

### Merge upstream changes into main
**What it does:** Integrates original repo updates into your fork.
```bash
git merge upstream/main
```
*Or rebasing:*
```bash
git rebase upstream/main
```

---

## Extra

### See remote branches
**What it does:** Lists branches on the remote (GitHub).
```bash
git branch -r
```

---

## Merging

### Merge a branch into current branch
**What it does:** Merges changes from another branch.
```bash
git merge feature-login
```

### Merge with squash (combine all commits)
**What it does:** Collapses all feature branch commits into one before merging.
```bash
git merge --squash feature-profile
git commit -m "Add profile feature (squashed)"
```

### Visualize commit history as a graph
**What it does:** Shows history, branches, and merges in a visual format.
```bash
git log --oneline --graph --all
```

### Resolve merge conflicts
**What it does:** After fixing conflicts, mark them as resolved and complete the merge.
```bash
git add <conflicted-file>
git commit
```

---

## Rebasing

### Rebase current branch onto another
**What it does:** Moves all current branch commits on top of the latest main (linear history).
```bash
git rebase main
```

---

## Stash

### Stash current (uncommitted) changes
**What it does:** Temporarily shelves WIP (work-in-progress) changes.
```bash
git stash
```

### Stash with a message
**What it does:** Saves stash with a custom description.
```bash
git stash push -m "WIP: fixing bug"
```

### List all stashes
**What it does:** Shows all saved stashes.
```bash
git stash list
```

### Apply (re-apply) the latest stash
**What it does:** Applies the latest stash without removing it.
```bash
git stash apply
```

### Apply and remove the latest stash
**What it does:** Restores and removes the stash from the list.
```bash
git stash pop
```

### Apply a specific stash
**What it does:** Use a specific stash from the list.
```bash
git stash apply stash@{1}
```

---

## Cherry-Pick

### Cherry-pick a commit
**What it does:** Applies a specific commit from another branch onto current branch.
```bash
git cherry-pick <commit-hash>
```
*Find the `<commit-hash>` with `git log --oneline` on the source branch.*

---

## Reset & Revert

### Reset branch to earlier commit, keep all changes staged
```bash
git reset --soft HEAD~1
```
(Undo last commit, but keep staged for re-commit.)

### Reset branch, keep changes in working directory (unstaged)
```bash
git reset --mixed HEAD~1
```
(This is the default; undoes commit, moves changes to unstaged.)

### Reset branch, discard changes completely (destructive!)
```bash
git reset --hard HEAD~1
```
(Everything after target commit removed, cannot be recovered unless using `reflog`.)

### Revert a single commit (safe, keeps history)
```bash
git revert <commit-hash>
```
(Makes a new commit that undoes the given commit without changing history.)

### Show all branch and commit changes — even after reset
```bash
git reflog
```
(Allows you to restore commits lost by a hard reset.)

---

## GitHub CLI (gh)

### Authenticate with GitHub
```bash
gh auth login
gh auth status
```

### Create a repo from the terminal
```bash
gh repo create <repo-name> --public --readme
```

### Clone a repo using gh
```bash
gh repo clone <owner>/<repo>
```

### View repo details
```bash
gh repo view <owner>/<repo>
```

### List your repositories
```bash
gh repo list <user>
```

### Delete a repo
```bash
gh repo delete <owner>/<repo>
```

---

### Issue management

**Create an issue with title, body, and label**
```bash
gh issue create --title "Bug" --body "Details" --label "bug"
```
**List issues**
```bash
gh issue list
```
**View an issue**
```bash
gh issue view <number>
```
**Close an issue**
```bash
gh issue close <number>
```

---

### Pull request (PR) management

**Create a PR**
```bash
gh pr create --fill
```
**List all PRs**
```bash
gh pr list
```
**View PR details**
```bash
gh pr view <pr-number>
```
**Merge a PR**
```bash
gh pr merge <pr-number> --merge      # or --squash or --rebase
```
**Checkout a PR for review**
```bash
gh pr checkout <pr-number>
```
**Leave a review**
```bash
gh pr review <pr-number> --approve --body "Looks good!"
```

---

### Actions & Workflows

**List workflow runs**
```bash
gh run list --repo <owner>/<repo>
```
**View status of a workflow run**
```bash
gh run view <run-id> --repo <owner>/<repo>
```

---

### Extra Tricks

**Make a raw API call**
```bash
gh api /user/repos --jq '.[] | .full_name'
```
**Manage Gists**
```bash
gh gist create <file>
```
**Manage Releases**
```bash
gh release create v1.0.0 --notes "First release"
```
**Create an alias**
```bash
gh alias set co 'pr checkout'
gh co 42
```
**Search for repos**
```bash
gh search repos github/cli
```
---


## Tips & Points to Remember

- Use `git status` frequently. It's your guide to knowing what's happening.
- Commit often, but keep commits focused (“one logical change per commit”).
- Write clear commit messages — they help you and your collaborators.
- Use `git log --oneline` for a quick, readable history.
- Don't delete the `.git/` folder unless you intend to remove all version control!
- If unsure about what will be committed, run `git diff` or `git diff --cached`.

- Prefer `git switch` for branch changes—it’s friendlier than `git checkout`.
- Always push new branches with `git push -u origin <branch>`.
- Remove local branches you no longer need to keep your repo tidy.
- Use upstream remote to sync your fork with the original project.

- Never rebase commits that have been pushed to shared remotes unless you coordinate with your team.
- Use squash merges for clearer histories when you don't need to preserve all minor commit details.
- Cherry-pick is powerful for single fixes/features — but beware of duplicate/conflicting changes.
- Resolve stash/apply/merge conflicts before continuing work.

---

**Tip:**  
Never delete the `.git/` directory unless you want to remove git tracking and HISTORY from your project!

---


*Continue updating this file every time you learn a new Git command, with what it does and an example!*