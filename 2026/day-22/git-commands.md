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

## Task 2 – Create Your Git Project

### 1. Create project directory and enter it
```bash
mkdir devops-git-practice
cd devops-git-practice
```

### 2. Initialize a new git repository
```bash
git init
```
*Output:*
```
Initialized empty Git repository in /path/to/devops-git-practice/.git/
```

### 3. Check git status
```bash
git status
```
*Output:*
```
On branch master

No commits yet

nothing to commit (create/copy files and use "git add" to track)
```
**Interpretation:**  
Git is waiting for you to create and add files.

### 4. Explore .git directory
To see all files including hidden ones:
```bash
ls -a
```
To look inside .git:
```bash
ls .git
```
*You’ll see folders like objects/, refs/, and files like HEAD, config, etc. All your project’s version control data is stored here.*

---

**Tip:**  
Never delete the `.git/` directory unless you want to remove git tracking and HISTORY from your project!

---

## Tips & Points to Remember

- Use `git status` frequently. It's your guide to knowing what's happening.
- Commit often, but keep commits focused (“one logical change per commit”).
- Write clear commit messages — they help you and your collaborators.
- Use `git log --oneline` for a quick, readable history.
- Don't delete the `.git/` folder unless you intend to remove all version control!
- If unsure about what will be committed, run `git diff` or `git diff --cached`.