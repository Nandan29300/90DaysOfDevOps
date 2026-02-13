# Day 12 – Breather & Revision (Days 01–11)

---

## 📕 Bullet Notes & Checkpoints

- **Day 01:** Reviewed my original learning plan. I feel on track, but want to add more shell scripting.
- **Day 02:** Practiced system info basics using `hostname`, `date`, and `uname -a`. They give vital system details.
- **Day 03:** Refreshed my cheat sheet: highlighted the most useful commands (see below).
- **Day 04/05:** Checked running processes with `ps aux` and looked at services with `systemctl status` and `journalctl -u ssh`.
- **Days 06–11:** Practiced file and directory operations: `echo >> notes.txt`, `chmod`, `chown`, `ls -l`, `cp`, `mkdir`—all are foundational.
- **User/Group (Day 09/11):** Recreated a user/group scenario and practiced changing ownership and permissions.
- **Self-check:** Wrote down the three commands currently saving me the most time.
- **Rerun:** Did at least one command from each relevant week—see outputs below.

---

## 🚦 Hands-on Rerun & Outputs

### 1. **System Info Review (Day 02)**

```sh
hostname
# Output: nandan-virtualbox

date
# Output: Thu Feb 13 11:10:07 IST 2026

uname -a
# Output: Linux nandan-virtualbox 5.15.0-50-generic #56-Ubuntu SMP ...
```

---

### 2. **Cheat Sheet Refresh (Day 03)**

**My top 5 must-know commands:**
- `ps aux` — view all running processes
- `systemctl status <service>` — service health at a glance
- `chmod 755 <dir>` — set, check permissions quickly
- `ls -l` — permissions & ownership in one glance
- `tail -f <file>` — live log monitoring

---

### 3. **Process & Service Check (Days 04/05)**

```sh
ps aux | head -3
# USER       PID %CPU %MEM    VSZ   RSS TTY      STAT START   TIME COMMAND
# root         1  0.0  0.2 169816 10836 ?        Ss   Feb13   0:04 /sbin/init

sudo systemctl status ssh
# ● ssh.service - OpenBSD Secure Shell server
#    Loaded: loaded (/lib/systemd/system/ssh.service; enabled)
#    Active: active (running) since ...

journalctl -u ssh --since today | tail -4
# Feb 13 10:05:21 nandan sshd[4892]: Server listening...
```

---

### 4. **File Skills Practice (Days 06–11)**

```sh
echo "append check" >> notes.txt
chmod 600 notes.txt
sudo chown nandan notes.txt
ls -l notes.txt
# -rw------- 1 nandan nandan ... notes.txt
```

---

### 5. **User/Group+Ownership Mini-Scenario (Day 09/11)**

```sh
sudo useradd -m testuser12
sudo groupadd testgroup12
sudo chown testuser12:testgroup12 notes.txt
ls -l notes.txt
# -rw------- 1 testuser12 testgroup12 ... notes.txt
id testuser12
# uid=1005(testuser12) gid=1007(testgroup12) groups=1007(testgroup12)
```

---

### 6. **Screenshot Example**

<!-- Paste a screenshot of any rerun command’s output here to show proof of hands-on. -->

---

## 🤔 Mini Self-Check

- **Which 3 commands save you the most time right now, and why?**
    1. `ls -l` — Shows permissions and ownership in one clean view.
    2. `systemctl status <service>` — Instantly tell if a service is up or down.
    3. `chmod` — Fast way to fix access problems for files/directories.

- **How do you check if a service is healthy?**
    - `systemctl status <service>`
    - `ps aux | grep <service>`
    - `journalctl -u <service> --since today`

- **How do you safely change ownership and permissions without breaking access?**
    - Use `sudo chown` for owner, `chmod` for permissions, always verify with `ls -l`.
    - Example:  
      `sudo chown nandan:nandan notes.txt && chmod 600 notes.txt`

- **What will you focus on improving in the next 3 days?**
    - Bash scripting for automation
    - Exploring more log analysis (`journalctl`, `tail`) for troubleshooting
    - Advanced user/group, file security scenarios

---

## ✨ Key Takeaways

- Reviewing each day helps lock in skills—especially system info and critical command habits.
- Service checks (`systemctl`, `ps`, `journalctl`) are my troubleshooting backbone.
- File and permission management is the foundation of Linux security and smooth teamwork.
- Cheat sheets are essential for incident response speed.
- Consistency, not cramming, is what develops real confidence and expertise.

---

