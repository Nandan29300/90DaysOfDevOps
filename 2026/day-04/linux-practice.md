````md
# 🐧 Day 04 – Linux Practice: Processes and Services  
**File:** `linux-practice.md`  
**Date:** __________________  
**System:** (Ubuntu / Debian / CentOS / Other: ______)

> Note: Replace the sample outputs below with your **actual terminal output**.

---

# ✅ 1) PROCESS CHECKS

## Command 1: Check running processes
```bash
ps aux | head -n 10
````

### Output (paste your real output here)

```
USER       PID %CPU %MEM    VSZ   RSS TTY      STAT START   TIME COMMAND
root         1  0.1  0.1 167584 11484 ?        Ss   10:12   0:02 /sbin/init
root         2  0.0  0.0      0     0 ?        S    10:12   0:00 [kthreadd]
...
```

**What I observed:**

* The first process is `systemd` (PID 1).
* I can see CPU and memory usage of processes.

---

## Command 2: Real-time process monitoring

```bash
top -n 1
```

### Output (paste first 10 lines)

```
top - 10:35:21 up  1:23,  1 user,  load average: 0.15, 0.12, 0.10
Tasks: 245 total,   1 running, 244 sleeping
%Cpu(s):  1.2 us,  0.3 sy,  0.0 ni, 98.5 id
...
```

**What I observed:**

* System load is low.
* Most processes are in "sleeping" state.

---

# ✅ 2) SERVICE CHECKS (Pick ONE service)

### Chosen service: **ssh**

(You can also choose: `cron`, `docker`, `nginx`, `apache2`, etc.)

## Command 3: Check service status

```bash
systemctl status ssh
```

### Output (paste your output)

```
● ssh.service - OpenBSD Secure Shell server
   Loaded: loaded (/lib/systemd/system/ssh.service; enabled)
   Active: active (running) since Tue 2025-02-03 10:12:34 IST
...
```

**What I observed:**

* Service is **active (running)**
* It starts automatically at boot.

---

## Command 4: List all active services

```bash
systemctl list-units --type=service --state=running | head
```

### Output

```
UNIT                        LOAD   ACTIVE SUB     DESCRIPTION
ssh.service                 loaded active running OpenBSD Secure Shell server
cron.service                loaded active running Regular background program processing daemon
...
```

**What I observed:**

* `ssh` and `cron` are running.
* Many background services are active.

---

# ✅ 3) LOG CHECKS

## Command 5: View service logs

```bash
journalctl -u ssh -n 50
```

### Output (paste last 20–30 lines)

```
Feb 03 10:35:10 my-server sshd[1234]: Accepted publickey for user from 192.168.1.5
...
```

**What I observed:**

* No errors in SSH logs.
* Last login came from my local network.

---

## Command 6: Check system logs

```bash
tail -n 50 /var/log/syslog
```

### Output

```
Feb  3 10:36:01 my-server CRON[5678]: (root) CMD (run-parts /etc/cron.hourly)
...
```

**What I observed:**

* Cron jobs are running normally.
* No critical errors in last 50 lines.

---

# ✅ 4) MINI TROUBLESHOOTING FLOW

### Scenario: What if SSH was not running?

**Step 1 – Check status**

```bash
systemctl status ssh
```

**Step 2 – Start the service (if stopped)**

```bash
sudo systemctl start ssh
```

**Step 3 – Verify again**

```bash
systemctl status ssh
```

**Step 4 – Check logs if still failing**

```bash
journalctl -u ssh -n 100
```

### My conclusion:

* If a service fails, always check:

  1. `systemctl status`
  2. Start/restart the service
  3. Check logs with `journalctl`

---

# ✅ Day 04 Completion Checklist

* [ ] Ran 6 commands
* [ ] 2 process commands included
* [ ] 2 service commands included
* [ ] 2 log commands included
* [ ] Picked and inspected one service
* [ ] Added my observations

```
```
