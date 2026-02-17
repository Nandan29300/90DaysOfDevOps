# Day 22 – Questions and Answers

---

## 1. What is the difference between `git add` and `git commit`?

- `git add` moves changes from the working directory to the staging area. It tells Git WHICH changes you want to include in your next commit.
- `git commit` records ALL staged changes in the repository's history as a commit with a unique ID and message.

---

## 2. What does the staging area do? Why doesn't Git just commit directly?

- The staging area (index) acts as a buffer zone. You decide EXACTLY what to include in your next commit by staging it.
- This separation allows you to batch only certain changes, review before committing, and commit logically (not every file/change at once).

---

## 3. What information does `git log` show you?

- `git log` shows a list of commits in chronological order.
- For each commit: a unique hash (ID), author name, email, date/time, and the commit message.

Sample output:
```
commit ca82a6dff817ec66f44342007202690a93763949
Author: Your Name <your@email.com>
Date:   Mon Feb 17 20:51:00 2026 +0530

    Add answer to Git log question
```

---

## 4. What is the `.git/` folder and what happens if you delete it?

- The `.git/` folder is the heart of every git repository. It contains all metadata, history, and Git configurations.
- If you delete `.git/`, you lose your entire repo’s history and git functions — the project becomes a "regular" folder.

---

## 5. What is the difference between a working directory, staging area, and repository?

- **Working directory:** Your actual files and folders; where you make changes.
- **Staging area (index):** Where files go when you `git add`; preparing for commit.
- **Repository:** Where your commit history lives; after you run `git commit`.

---

## 6. `git log --oneline` output screenshot

*See the attached image file `git-log-screenshot.png` in this folder.*

---

## Tips & Points to Remember

- The **staging area** (index) gives you granular control: stage parts of files or specific files for smaller, meaningful commits.
- **Working clean:** Make small, atomic commits. Easier to debug and review.
- **Never commit sensitive data** (passwords, API keys)!
- To ignore untracked files you don’t want to commit, use a `.gitignore` file.
- Use `git help <command>` or `man git-<command>` to explore Git deeply.
- If you make a mistake, you can often recover with `git reflog` or `git reset` (learn these with caution).