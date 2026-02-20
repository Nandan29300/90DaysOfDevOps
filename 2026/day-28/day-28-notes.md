# Day 28 – Revision Day: Everything from Day 1 to Day 27

---

## Task 1: Self-Assessment Checklist

> Marking honestly: ✅ Can do confidently | 🔄 Need to revisit | ❌ Haven't done yet

### Linux

| # | Skill | Status |
|---|-------|--------|
| 1 | Navigate the file system, create/move/delete files and directories | ✅ Can do confidently |
| 2 | Manage processes — list, kill, background/foreground | ✅ Can do confidently |
| 3 | Work with systemd — start, stop, enable, check status of services | ✅ Can do confidently |
| 4 | Read and edit text files using vi/vim or nano | ✅ Can do confidently |
| 5 | Troubleshoot CPU, memory, and disk issues using top, free, df, du | ✅ Can do confidently |
| 6 | Explain the Linux file system hierarchy (/, /etc, /var, /home, /tmp, etc.) | ✅ Can do confidently |
| 7 | Create users and groups, manage passwords | ✅ Can do confidently |
| 8 | Set file permissions using chmod (numeric and symbolic) | ✅ Can do confidently |
| 9 | Change file ownership with chown and chgrp | ✅ Can do confidently |
| 10 | Create and manage LVM volumes | 🔄 Need to revisit |
| 11 | Check network connectivity — ping, curl, netstat, ss, dig, nslookup | ✅ Can do confidently |
| 12 | Explain DNS resolution, IP addressing, subnets, and common ports | 🔄 Need to revisit |
| 13 | Run and manage Docker containers (pull, run, stop, rm, ps, logs) | ✅ Can do confidently |
| 14 | Configure and serve a site with Nginx (install, enable, test config) | ✅ Can do confidently |
| 15 | Deploy a web app on a cloud server (Docker + Nginx reverse proxy) | ✅ Can do confidently |

### Shell Scripting

| # | Skill | Status |
|---|-------|--------|
| 1 | Write a script with variables, arguments, and user input | ✅ Can do confidently |
| 2 | Use if/elif/else and case statements | ✅ Can do confidently |
| 3 | Write for, while, and until loops | ✅ Can do confidently |
| 4 | Define and call functions with arguments and return values | ✅ Can do confidently |
| 5 | Use grep, awk, sed, sort, uniq for text processing | ✅ Can do confidently |
| 6 | Handle errors with set -e, set -u, set -o pipefail, trap | ✅ Can do confidently |
| 7 | Schedule scripts with crontab | 🔄 Need to revisit |

### Git & GitHub

| # | Skill | Status |
|---|-------|--------|
| 1 | Initialize a repo, stage, commit, and view history | ✅ Can do confidently |
| 2 | Create and switch branches | ✅ Can do confidently |
| 3 | Push to and pull from GitHub | ✅ Can do confidently |
| 4 | Explain clone vs fork | ✅ Can do confidently |
| 5 | Merge branches — understand fast-forward vs merge commit | ✅ Can do confidently |
| 6 | Rebase a branch and explain when to use it vs merge | ✅ Can do confidently |
| 7 | Use git stash and git stash pop | ✅ Can do confidently |
| 8 | Cherry-pick a commit from another branch | ✅ Can do confidently |
| 9 | Explain squash merge vs regular merge | ✅ Can do confidently |
| 10 | Use git reset (soft, mixed, hard) and git revert | ✅ Can do confidently |
| 11 | Explain GitFlow, GitHub Flow, and Trunk-Based Development | ✅ Can do confidently |
| 12 | Use GitHub CLI to create repos, PRs, and issues | ✅ Can do confidently |

---

## Task 2: Revisit Weak Spots

### Weak Spot 1: LVM (Logical Volume Management)

**Why I marked it "Need to revisit":** The commands for creating PVs, VGs, and LVs are easy to mix up and I haven't practised them recently.

**What I re-learned:**

LVM works in three layers:
1. **Physical Volume (PV)** — a raw disk or partition marked for LVM use.
2. **Volume Group (VG)** — one or more PVs pooled together into a single storage pool.
3. **Logical Volume (LV)** — a slice of a VG that acts like a regular partition and gets a filesystem.

```bash
# Step-by-step: create and mount an LVM volume

# 1. Mark a disk as a Physical Volume
sudo pvcreate /dev/sdb

# 2. Create a Volume Group named "myvg"
sudo vgcreate myvg /dev/sdb

# 3. Create a 5 GB Logical Volume named "mylv" inside "myvg"
sudo lvcreate -L 5G -n mylv myvg

# 4. Format it with ext4
sudo mkfs.ext4 /dev/myvg/mylv

# 5. Mount it
sudo mkdir -p /mnt/mydata
sudo mount /dev/myvg/mylv /mnt/mydata

# 6. Make it persistent — add to /etc/fstab
echo '/dev/myvg/mylv  /mnt/mydata  ext4  defaults  0 2' | sudo tee -a /etc/fstab

# Extend a VG by adding a new disk, then extend the LV
sudo pvcreate /dev/sdc
sudo vgextend myvg /dev/sdc
sudo lvextend -L +5G /dev/myvg/mylv
sudo resize2fs /dev/myvg/mylv     # resize the filesystem to match
```

**Key insight:** The real power of LVM is online resizing — you can grow (or shrink) volumes without unmounting, unlike traditional partitions.

---

### Weak Spot 2: DNS Resolution & Subnets

**Why I marked it "Need to revisit":** I know the concepts but get fuzzy on the exact steps of DNS resolution and subnet math.

**What I re-learned:**

#### DNS Resolution — step by step

1. Browser checks its own cache.
2. OS checks `/etc/hosts`.
3. OS asks the **Recursive Resolver** (usually your ISP or `8.8.8.8`).
4. Resolver asks a **Root Name Server** → learns which TLD server to ask (e.g., `.com`).
5. Resolver asks the **TLD Name Server** → learns the Authoritative Name Server for the domain.
6. Resolver asks the **Authoritative Name Server** → gets the actual IP (A/AAAA record).
7. Resolver returns the IP to the OS → browser connects.

```bash
# Practical DNS tools
dig google.com           # full DNS resolution chain
dig google.com +short    # just the IP
nslookup google.com      # simple query
dig google.com MX        # mail records
dig @8.8.8.8 google.com  # use a specific resolver
```

#### Subnet Math — CIDR quick reference

| CIDR | Subnet Mask | Usable Hosts |
|------|------------|--------------|
| /24  | 255.255.255.0   | 254  |
| /25  | 255.255.255.128 | 126  |
| /26  | 255.255.255.192 | 62   |
| /28  | 255.255.255.240 | 14   |
| /30  | 255.255.255.252 | 2    |

Formula: `usable hosts = 2^(32 - prefix) - 2`

---

### Weak Spot 3: crontab Syntax & Scheduling

**Why I marked it "Need to revisit":** I always second-guess the field order.

**What I re-learned:**

```
┌─────────── minute (0–59)
│ ┌───────── hour (0–23)
│ │ ┌─────── day of month (1–31)
│ │ │ ┌───── month (1–12)
│ │ │ │ ┌─── day of week (0–7, both 0 and 7 = Sunday)
│ │ │ │ │
* * * * *  /path/to/command
```

```bash
# Common cron examples
0 3 * * *   /opt/scripts/backup.sh        # every day at 03:00
*/5 * * * * /opt/scripts/health_check.sh  # every 5 minutes
0 0 * * 1   /opt/scripts/weekly.sh        # every Monday midnight
0 9 1 * *   /opt/scripts/monthly.sh       # 1st of every month at 09:00
@reboot     /opt/scripts/startup.sh       # on system reboot

# Manage crontabs
crontab -e        # edit current user's crontab
crontab -l        # list current user's crontab
crontab -r        # remove current user's crontab
sudo crontab -u nandan -l   # list another user's crontab

# Redirect output so errors are visible
0 3 * * * /opt/scripts/backup.sh >> /var/log/backup.log 2>&1
```

**Key insight:** By default cron does NOT load your shell profile, so always use **full absolute paths** for both the script and any commands inside it.

---

## Task 3: Quick-Fire Questions — Answers

### 1. What does `chmod 755 script.sh` do?

Sets permissions on `script.sh` so that:
- **Owner** can read, write, and execute (`7` = 4+2+1)
- **Group** can read and execute (`5` = 4+0+1)
- **Others** can read and execute (`5` = 4+0+1)

This is the standard permission for a publicly executable script — anyone can run it, only the owner can modify it.

```bash
chmod 755 script.sh
# Equivalent symbolic form:
chmod u=rwx,go=rx script.sh
```

---

### 2. What is the difference between a process and a service?

| | Process | Service |
|---|---------|---------|
| **What it is** | Any running program with a PID | A long-running background process managed by the OS (systemd) |
| **Lifecycle** | Starts, does its job, exits | Designed to run continuously; auto-restarted on failure |
| **Management** | `ps`, `kill`, `&`, `fg`/`bg` | `systemctl start/stop/enable/status` |
| **Example** | `bash`, `vim`, `ls` | `nginx`, `sshd`, `cron`, `docker` |

A service IS a process, but a process isn't necessarily a service. Services have unit files (`.service`) that define how systemd should manage them.

---

### 3. How do you find which process is using port 8080?

```bash
# Using ss (modern, recommended)
ss -tlnp | grep 8080

# Using netstat (older systems)
netstat -tlnp | grep 8080

# Using lsof
lsof -i :8080

# Using fuser
fuser 8080/tcp
```

`ss -tlnp` output columns: State | Recv-Q | Send-Q | Local Address:Port | Peer Address:Port | Process

---

### 4. What does `set -euo pipefail` do in a shell script?

| Flag | What it does |
|------|-------------|
| `set -e` | **Exit immediately** if any command returns a non-zero exit code |
| `set -u` | **Treat unset variables as errors** — prevents silent bugs from typos in variable names |
| `set -o pipefail` | If any command in a **pipeline** fails, the whole pipeline returns failure (without this, only the last command's exit code matters) |

```bash
#!/usr/bin/env bash
set -euo pipefail

# Now this script will:
# - Stop on the first error (-e)
# - Blow up if you use $UNSET_VAR (-u)
# - Catch: cat file.txt | grep pattern — if grep finds nothing, it fails (-o pipefail)
```

Always start production scripts with this line.

---

### 5. What is the difference between `git reset --hard` and `git revert`?

| | `git reset --hard <commit>` | `git revert <commit>` |
|---|---|---|
| **What it does** | Moves HEAD back to `<commit>`, **discards** all changes after it | Creates a **new commit** that undoes the specified commit |
| **History** | **Rewrites** history — commits after the target are gone | **Preserves** history — safe for shared branches |
| **Safe for remote?** | ❌ Dangerous if already pushed — force push required | ✅ Safe to push to shared remotes |
| **Use case** | Local cleanup, throw away experimental work | Undoing a commit on `main`/`master` that others have pulled |

```bash
git reset --hard HEAD~2     # go back 2 commits, discard changes
git revert abc1234          # create a new "undo" commit for abc1234
```

---

### 6. What branching strategy would you recommend for a team of 5 developers shipping weekly?

**GitHub Flow** — it's lightweight and works perfectly for weekly releases.

**Why:**
- Small team → minimal overhead
- Weekly cadence → frequent merges are fine, no need for long-lived `develop` branches
- Simple rules: `main` is always deployable; every feature/fix is a short-lived branch → PR → review → merge → deploy

```
main  ──●──────────────────────────────●──── (always deployable)
         \                            /
          feature/add-login ──●──●──●
```

**GitFlow** would be overkill here — it's better for teams with scheduled release cycles and multiple versions in production.

---

### 7. What does `git stash` do and when would you use it?

`git stash` **temporarily shelves** (stashes) changes in your working directory and staging area so you can switch context with a clean working tree, then come back and re-apply them.

```bash
git stash              # stash everything (tracked changes)
git stash -u           # also stash untracked files
git stash list         # see all stashes
git stash pop          # re-apply the latest stash and remove it from the stash list
git stash apply        # re-apply but keep the stash in the list
git stash drop         # delete the latest stash
git stash branch my-branch  # create a new branch from the stash
```

**When to use it:**
- You're mid-way through a feature and need to urgently fix a bug on `main`
- You want to pull the latest changes but have local edits that conflict
- You want to switch to a different branch without committing half-done work

---

### 8. How do you schedule a script to run every day at 3 AM?

```bash
crontab -e
# Add this line:
0 3 * * * /full/path/to/script.sh >> /var/log/script.log 2>&1
```

Breaking it down: `0` (minute 0) `3` (hour 3) `*` (any day) `*` (any month) `*` (any weekday)

Always redirect output (`>> log 2>&1`) so you can debug if it silently fails.

---

### 9. What is the difference between `git fetch` and `git pull`?

| | `git fetch` | `git pull` |
|---|---|---|
| **What it does** | Downloads remote changes into `origin/branch` but does **not** merge them | Downloads remote changes **and immediately merges** them into the current branch |
| **Working tree** | Unchanged — you review before merging | Changed — merge happens automatically |
| **Safety** | ✅ Safe, non-destructive | ⚠️ Can cause merge conflicts unexpectedly |
| **Equivalent to** | `git fetch` only | `git fetch` + `git merge` |

```bash
git fetch origin        # safe — just download
git diff main origin/main  # review what changed
git merge origin/main   # merge when ready

# vs
git pull origin main    # does both in one step
```

**Best practice:** Prefer `git fetch` + review over a blind `git pull` on shared branches.

---

### 10. What is LVM and why would you use it instead of regular partitions?

**LVM (Logical Volume Manager)** is an abstraction layer between physical disks and the filesystem. Instead of partitioning disks directly, you create flexible "logical volumes" that can span multiple disks and be resized without downtime.

**Why LVM over regular partitions:**

| Feature | Regular Partitions | LVM |
|---------|-------------------|-----|
| Resize online | ❌ Usually requires unmount | ✅ Can grow/shrink live |
| Span multiple disks | ❌ Not possible | ✅ One VG can span many disks |
| Snapshots | ❌ Not built-in | ✅ `lvcreate -s` creates snapshots |
| Add disk space later | ❌ Painful — migrate data | ✅ `pvcreate` + `vgextend` + `lvextend` |
| Complexity | Simple | Slightly more complex to set up |

**Real-world use case:** Your `/var` partition fills up on a production server. With LVM you add a new disk, extend the VG, and grow the LV — all without rebooting or moving data.

---

## Task 4: Work Organization Status

| Task | Status |
|------|--------|
| All daily notes (day-01 to day-27) committed | ✅ |
| `git-commands.md` files updated across day-22 to day-26 | ✅ |
| Shell scripting cheat sheet (`day-21/shell_scripting_cheatsheet.md`) complete | ✅ |
| GitHub profile clean and up to date (day-27) | ✅ |
| `day-28-notes.md` created and committed | ✅ |

---

## Day-by-Day Coverage Recap (Day 1 → Day 27)

| Day | Topic | Key File(s) |
|-----|-------|------------|
| 1 | DevOps & Cloud Intro — SDLC, DevOps principles, Cloud basics | `learning-plan.md` |
| 2 | Linux Architecture — Processes, systemd, boot process | `linux-architecture-notes.md`, `linux-architecture.md` |
| 3 | Linux Commands — Navigation, file ops, text tools | `linux-commands.md` |
| 4 | Linux Practice — Hands-on command exercises | `linux-practice.md` |
| 5 | Docker & Nginx Runbooks — Container basics, web server setup | `docker-runbook.md`, `nginx-runbook.md`, `linux-runbook.md` |
| 6 | File I/O Practice — Reading, writing, redirecting files | `file-io-practice.md` |
| 7 | Linux FS Hierarchy & Scenarios — /, /etc, /var, /home, /tmp | `linux-fs-and-scenarios.md` |
| 8 | Cloud Server Deployment — Docker + Nginx on a cloud VM | `cloud-deployment.md` |
| 9 | User Management — useradd, passwd, groups, sudoers | `user-management.md` |
| 10 | File Permissions — chmod numeric & symbolic | `file-permissions.md` |
| 11 | File Ownership — chown, chgrp | `file-ownership.md` |
| 12 | Revision Day 1 — Days 1–11 recap | `revision.md` |
| 13 | LVM — pvcreate, vgcreate, lvcreate, lvextend | `lvm.md` |
| 14 | Networking Fundamentals — IP, DNS, ports, routing | `networking.md` |
| 15 | Networking Concepts — Subnets, CIDR, dig, ss, curl | `networking-concepts.md` |
| 16 | Shell Scripting Basics — Variables, args, conditionals | `shell-scripting.md` |
| 17 | Shell Scripting — Loops, functions | `scripting.md` |
| 18 | Shell Scripting — Error handling, set -euo pipefail, trap | `scripting.md` |
| 19 | Shell Projects — Log rotation, backup scripts | `scripting.md` |
| 20 | Shell Project — Log analyzer + crontab scheduling | `log_analyzer.sh`, `solution.md` |
| 21 | Shell Scripting Cheat Sheet | `shell_scripting_cheatsheet.md` |
| 22 | Git Basics — init, add, commit, log, branching | `day-22-notes.md`, `git-commands.md` |
| 23 | Git Advanced — merge, rebase, stash, cherry-pick | `day-23-notes.md`, `git-commands.md` |
| 24 | Git Reset & Revert — soft/mixed/hard reset, revert | `day-24-notes.md`, `git-commands.md` |
| 25 | Branching Strategies — GitFlow, GitHub Flow, Trunk-Based | `day-25-notes.md`, `git-commands.md` |
| 26 | GitHub CLI — gh repo, pr, issue from terminal | `day-26-notes.md`, `git-commands.md` |
| 27 | GitHub Profile — README, pinned repos, developer branding | `day-27-notes.md` |

---

## Task 5: Teach It Back — Git Branching for a Non-Developer

> **Topic chosen: Git Branching**

Imagine you're writing a novel with a co-author. The original manuscript is your **`main`** branch — the "official" version. If you want to experiment with a plot twist without messing up the real story, you make a photocopy, write your changes on that copy, and only staple it into the official manuscript once both of you are happy with it.

That's exactly what a **Git branch** is. It's an independent copy of your code where you can write features, fix bugs, or run experiments. If the experiment fails, you just throw away that branch — the original is untouched. If it works, you **merge** it back into `main`.

This means ten developers can all work on ten different features at the same time, on the same project, without ever stepping on each other's code. Branches cost almost nothing (they're just pointers to commits) and the whole team always has a stable, working version of the code on `main` to fall back on.

```
main       ──●──────────────────●── (always stable)
              \                /
               feature/login ──●──●  (isolated experiment)
```

The rule is simple: **never work directly on `main`; always branch, then merge via a pull request.**

---

## Summary — Key Takeaways from 27 Days

| Area | Most Important Lesson |
|------|-----------------------|
| **Linux** | Everything is a file; understand permissions, processes, and systemd and you can debug almost anything |
| **Docker & Nginx** | Docker isolates apps in containers; Nginx is the go-to reverse proxy — together they are the foundation of most web deployments (Day 5 & 8) |
| **Shell Scripting** | Always use `set -euo pipefail`; use absolute paths in cron jobs; log everything |
| **LVM** | Three layers: PV → VG → LV; real power is online resizing |
| **Networking** | DNS resolution has 7 steps; always verify with `dig`, `ss`, and `curl` |
| **Git** | Commit early, commit often; never force-push to shared branches; prefer `fetch` over `pull` |
| **GitHub** | PRs are conversations, not just code reviews; protect `main` with branch rules |
| **Developer Branding** | Your GitHub profile IS your resume — keep it clean and pinned repos relevant |
