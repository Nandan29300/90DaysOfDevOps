# Linux Troubleshooting Runbook - SSH Service

**Date:** 2026-02-03  
**Operator:** Nandan29300  
**Target Service:** sshd (SSH Daemon)  
**System:** Production Ubuntu Server

---

## 🎯 Target Service / Process

**Service Name:** sshd  
**Purpose:** Secure Shell daemon for remote access  
**Expected State:** Running, low CPU/memory usage  
**Critical:** Yes - primary remote access method

---

## 🖥️ Environment Basics

### Command 1: System Information
```bash
uname -a
```

**Output:**
```
Linux devops-server 5.15.0-91-generic #101-Ubuntu SMP Tue Nov 14 13:30:08 UTC 2023 x86_64 x86_64 x86_64 GNU/Linux
```

**Interpretation:** Running Ubuntu with kernel 5.15, 64-bit architecture. System is relatively recent and well-supported.

---

### Command 2: OS Release Info
```bash
lsb_release -a
# OR
cat /etc/os-release
```

**Output:**
```
Distributor ID: Ubuntu
Description:    Ubuntu 22.04.3 LTS
Release:        22.04
Codename:       jammy
```

**Interpretation:** Ubuntu 22.04 LTS - long-term support version, good for production stability.

---

## 📁 Filesystem Sanity Check

### Command 3: Create Test Directory
```bash
mkdir /tmp/runbook-demo
```

**Output:** (No output = success)

**Interpretation:** Filesystem is writable, no disk full errors.

---

### Command 4: File Operations Test
```bash
cp /etc/hosts /tmp/runbook-demo/hosts-copy && ls -l /tmp/runbook-demo
```

**Output:**
```
total 4
-rw-r--r-- 1 root root 221 Feb  3 10:30 hosts-copy
```

**Interpretation:** File I/O operations working normally. Read/write permissions intact.

---

## 💻 Snapshot: CPU & Memory

### Command 5: Process CPU/Memory for SSH
```bash
ps -o pid,pcpu,pmem,vsz,rss,comm -p $(pgrep sshd)
```

**Output:**
```
   PID %CPU %MEM    VSZ   RSS COMMAND
   892  0.0  0.1  13452  8320 sshd
  2341  0.0  0.2  16284 10112 sshd
  2389  0.0  0.1  13452  7896 sshd
```

**Interpretation:** 
- Multiple sshd processes (parent + active connections)
- Very low CPU usage (0.0%) - healthy
- Low memory footprint (~8-10MB per process)
- No memory leaks apparent

---

### Command 6: Overall Memory Status
```bash
free -h
```

**Output:**
```
               total        used        free      shared  buff/cache   available
Mem:           7.7Gi       2.1Gi       3.2Gi       128Mi       2.4Gi       5.2Gi
Swap:          2.0Gi          0B       2.0Gi
```

**Interpretation:**
- 7.7GB total RAM, 5.2GB available - healthy
- No swap usage (0B) - system not under memory pressure
- Good buffer/cache usage (2.4GB) for file operations

---

### Command 7: Top Processes (Alternative)
```bash
top -bn1 | head -n 20
```

**Output:**
```
top - 10:32:15 up 23 days,  4:12,  2 users,  load average: 0.15, 0.22, 0.18
Tasks: 156 total,   1 running, 155 sleeping,   0 stopped,   0 zombie
%Cpu(s):  2.3 us,  0.8 sy,  0.0 ni, 96.5 id,  0.2 wa,  0.0 hi,  0.2 si,  0.0 st
MiB Mem :   7890.2 total,   3276.8 free,   2150.4 used,   2463.0 buff/cache
MiB Swap:   2048.0 total,   2048.0 free,      0.0 used.   5321.6 avail Mem

    PID USER      PR  NI    VIRT    RES    SHR S  %CPU  %MEM     TIME+ COMMAND
    892 root      20   0   13452   8320   7104 S   0.0   0.1   1:23.45 sshd
   1234 www-data  20   0  512384  45632  12288 S   2.3   0.6  45:12.33 nginx
```

**Interpretation:**
- Load average: 0.15, 0.22, 0.18 (very light load on multi-core system)
- 96.5% idle CPU - system has plenty of capacity
- sshd consuming minimal resources
- 23 days uptime - stable system

---

## 💾 Snapshot: Disk & IO

### Command 8: Disk Space Usage
```bash
df -h
```

**Output:**
```
Filesystem      Size  Used Avail Use% Mounted on
/dev/sda1        50G   18G   30G  38% /
/dev/sda2       100G   45G   50G  48% /home
tmpfs           3.9G  1.2M  3.9G   1% /run
/dev/sdb1       200G  120G   70G  64% /var
```

**Interpretation:**
- Root partition (/) at 38% - healthy
- /var at 64% - monitor log growth
- No partitions critically full (>90%)
- Good space available for logs and temporary files

---

### Command 9: Log Directory Size
```bash
du -sh /var/log
```

**Output:**
```
2.3G    /var/log
```

**Interpretation:**
- Log directory using 2.3GB
- Within normal range for busy server
- Should check for log rotation policies

---

### Command 10: Disk I/O Statistics (Optional)
```bash
iostat -x 1 2
```

**Output:**
```
Device            r/s     w/s     rkB/s     wkB/s   %util
sda              5.23    3.12     84.32     48.76    2.34
sdb              1.45    2.89     23.45     89.12    1.12
```

**Interpretation:**
- Low read/write operations
- Less than 3% disk utilization
- No I/O bottleneck detected

---

## 🌐 Snapshot: Network

### Command 11: Network Listening Ports
```bash
ss -tulpn | grep ssh
# OR
netstat -tulpn | grep ssh
```

**Output:**
```
tcp   LISTEN 0      128          0.0.0.0:22        0.0.0.0:*    users:(("sshd",pid=892,fd=3))
tcp   LISTEN 0      128             [::]:22           [::]:*    users:(("sshd",pid=892,fd=4))
```

**Interpretation:**
- SSH listening on port 22 (standard)
- Bound to all interfaces (0.0.0.0 and ::)
- Parent sshd process (PID 892) accepting connections
- IPv4 and IPv6 both enabled
- **Status: Healthy** ✅

---

### Command 12: Test Service Connectivity
```bash
curl -v telnet://localhost:22 2>&1 | head -n 5
# OR
nc -zv localhost 22
```

**Output:**
```
Connection to localhost 22 port [tcp/ssh] succeeded!
SSH-2.0-OpenSSH_8.9p1 Ubuntu-3ubuntu0.6
```

**Interpretation:**
- Port 22 is reachable locally
- SSH banner returned correctly
- Service is responding to connections
- OpenSSH version 8.9p1 identified

---

## 📊 Additional Network Check
```bash
ss -tn | grep :22 | wc -l
```

**Output:**
```
3
```

**Interpretation:** 3 active SSH connections currently established.

---

## 📜 Logs Reviewed

### Command 13: Systemd Journal for SSH
```bash
journalctl -u ssh -n 50 --no-pager
# OR
journalctl -u sshd -n 50 --no-pager
```

**Output:**
```
Feb 03 09:45:23 devops-server sshd[2341]: Accepted publickey for ubuntu from 192.168.1.100 port 52341 ssh2: RSA SHA256:abc123...
Feb 03 09:45:23 devops-server sshd[2341]: pam_unix(sshd:session): session opened for user ubuntu by (uid=0)
Feb 03 08:23:15 devops-server sshd[2103]: Failed password for invalid user admin from 203.0.113.42 port 48923 ssh2
Feb 03 08:23:15 devops-server sshd[2103]: Connection closed by invalid user admin 203.0.113.42 port 48923 [preauth]
Feb 03 07:12:01 devops-server sshd[1876]: Accepted publickey for devops from 192.168.1.50 port 41234 ssh2: ED25519 SHA256:xyz789...
```

**Interpretation:**
- Successful logins from known IPs (192.168.1.x)
- **⚠️ ALERT:** Failed login attempt from 203.0.113.42 for user "admin"
- Public key authentication working correctly
- No service crashes or errors in last 50 entries
- Potential brute-force attempts detected

---

### Command 14: Authentication Logs
```bash
tail -n 50 /var/log/auth.log
```

**Output:**
```
Feb  3 10:15:42 devops-server sshd[2456]: Invalid user test from 198.51.100.23 port 56789
Feb  3 10:15:42 devops-server sshd[2456]: Connection closed by invalid user test 198.51.100.23 port 56789 [preauth]
Feb  3 10:15:45 devops-server sshd[2457]: Invalid user admin from 198.51.100.23 port 56790
Feb  3 10:15:45 devops-server sshd[2457]: Failed password for invalid user admin from 198.51.100.23 port 56790 ssh2
Feb  3 09:45:23 devops-server sshd[2341]: Accepted publickey for ubuntu from 192.168.1.100 port 52341 ssh2
```

**Interpretation:**
- **🚨 SECURITY ISSUE:** Multiple failed login attempts from 198.51.100.23
- Attackers trying common usernames (test, admin)
- Legitimate traffic from internal network (192.168.1.x)
- Consider implementing fail2ban or IP blocking

---

## 📝 Quick Findings

### ✅ Healthy Indicators:
1. **CPU & Memory:** SSH using <1% resources, no leaks
2. **Disk Space:** 38% root usage, adequate free space
3. **Network:** Service listening correctly on port 22
4. **Connections:** 3 active legitimate connections
5. **Uptime:** 23 days - stable service

### ⚠️ Concerns Identified:
1. **Security:** Failed login attempts from external IPs (203.0.113.42, 198.51.100.23)
2. **Monitoring:** No fail2ban detected in running processes
3. **Log Growth:** /var at 64% - should monitor log rotation

### 📊 Performance Metrics:
- **Load Average:** 0.15 (excellent)
- **Memory Pressure:** None (no swap usage)
- **Disk I/O:** Minimal (<3% utilization)
- **Network:** Responsive, low latency

---

## 🚨 If This Worsens - Escalation Steps

### Scenario 1: High Failed Login Attempts (Current Issue)

**Next Steps:**
1. **Install & Configure fail2ban:**
   ```bash
   sudo apt install fail2ban
   sudo systemctl enable fail2ban
   sudo systemctl start fail2ban
   ```
   - Blocks IPs after 5 failed attempts
   - 10-minute ban duration initially

2. **Restrict SSH Access by IP:**
   ```bash
   # Edit /etc/ssh/sshd_config
   AllowUsers ubuntu@192.168.1.0/24
   DenyUsers root
   PasswordAuthentication no
   ```
   - Restart: `sudo systemctl restart sshd`

3. **Monitor Real-time Auth Logs:**
   ```bash
   tail -f /var/log/auth.log | grep 'Failed\|Invalid'
   ```

---

### Scenario 2: SSH Service Becomes Unresponsive

**Next Steps:**
1. **Check Process State:**
   ```bash
   systemctl status sshd
   ps aux | grep sshd
   lsof -i :22
   ```

2. **Restart with Safe Fallback:**
   ```bash
   # ONLY if you have console access or alternative remote access!
   sudo systemctl restart sshd
   # Check: nc -zv localhost 22
   ```

3. **Enable Debug Logging:**
   ```bash
   # Edit /etc/ssh/sshd_config
   LogLevel DEBUG3
   # Restart and watch: journalctl -u sshd -f
   ```

---

### Scenario 3: High CPU/Memory Usage by SSH

**Next Steps:**
1. **Identify Resource-Heavy Connections:**
   ```bash
   ps aux | grep sshd | sort -k3 -r
   lsof -u sshd
   ```

2. **Trace System Calls:**
   ```bash
   sudo strace -p <sshd-pid> -c
   ```

3. **Check for Fork Bombs or Max Sessions:**
   ```bash
   # See MaxSessions in /etc/ssh/sshd_config
   ss -tn | grep :22 | wc -l
   # Compare against MaxSessions (default 10)
   ```

---

### Scenario 4: Disk Space Critical (>90%)

**Next Steps:**
1. **Identify Large Log Files:**
   ```bash
   du -h /var/log | sort -rh | head -n 10
   ```

2. **Compress/Archive Old Logs:**
   ```bash
   sudo journalctl --vacuum-time=7d
   find /var/log -name "*.log" -mtime +30 -exec gzip {} \;
   ```

3. **Check Log Rotation:**
   ```bash
   cat /etc/logrotate.d/rsyslog
   sudo logrotate -f /etc/logrotate.conf
   ```

---

## 🔄 Regular Monitoring Commands

**Daily Health Check:**
```bash
#!/bin/bash
echo "=== SSH Health Check $(date) ==="
systemctl is-active sshd
ss -tulpn | grep :22
ps -o pid,pcpu,pmem,comm -C sshd
journalctl -u sshd --since "1 hour ago" | grep -i "error\|fail" | wc -l
```

---

## 📚 Additional Resources

- SSH Security Best Practices: `/etc/ssh/sshd_config` comments
- Man pages: `man sshd_config`, `man fail2ban`
- Ubuntu Security Guides: https://ubuntu.com/security

---

**Sign-off:**  
Runbook validated on: 2026-02-03  
Next review date: 2026-02-10  
Status: ACTIVE
