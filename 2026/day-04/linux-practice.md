# 📚 Day 04 – Linux Practice: Processes and Services

**File:** `linux-practice.md`  
**System:** Ubuntu 22.04 LTS  


---

## 📚 What You'll Learn Today

- Understanding **Linux processes** and how to monitor them
- Managing **system services** using systemd
- Reading and analyzing **system logs**
- Basic **troubleshooting workflows**

---

# 1️⃣ UNDERSTANDING LINUX PROCESSES

## 📖 What is a Process?

A **process** is a running instance of a program. Every application you run creates one or more processes.

**Key Process Attributes:**
- **PID** (Process ID): Unique identifier for each process
- **PPID** (Parent Process ID): The process that started this process
- **USER**: Who owns the process
- **%CPU**: CPU usage percentage
- **%MEM**: Memory usage percentage
- **STATE**: Current status (Running, Sleeping, Stopped, Zombie)

---

## 🔍 Command 1: List Running Processes

```bash
ps aux
```

### 📝 What This Command Does:
- `ps` = Process Status
- `a` = Show processes for all users
- `u` = Display user-oriented format
- `x` = Include processes without controlling terminal

### 💻 Example Output:

```
USER         PID %CPU %MEM    VSZ   RSS TTY      STAT START   TIME COMMAND
root           1  0.0  0.2 168684 11856 ?        Ss   08:15   0:03 /sbin/init splash
root           2  0.0  0.0      0     0 ?        S    08:15   0:00 [kthreadd]
root           3  0.0  0.0      0     0 ?        I<   08:15   0:00 [rcu_gp]
root         412  0.0  0.3  46584 15232 ?        Ss   08:15   0:02 /lib/systemd/systemd-journald
root         445  0.0  0.1  25076  7392 ?        Ss   08:15   0:01 /lib/systemd/systemd-udevd
systemd+     612  0.0  0.1  16512  6784 ?        Ss   08:15   0:00 /lib/systemd/systemd-resolved
systemd+     614  0.0  0.2  89972  8256 ?        Ssl  08:15   0:01 /lib/systemd/systemd-timesyncd
root         723  0.0  0.2 240024  9856 ?        Ssl  08:15   0:00 /usr/lib/accountsservice/accounts-daemon
message+     724  0.0  0.1   8772  4992 ?        Ss   08:15   0:01 /usr/bin/dbus-daemon --system
root         732  0.0  0.5  30104 20480 ?        Ss   08:15   0:02 /usr/bin/python3 /usr/bin/networkd-dispatcher
syslog       738  0.0  0.1 222404  5376 ?        Ssl  08:15   0:00 /usr/sbin/rsyslogd -n -iNONE
root         742  0.0  0.3  15544  7680 ?        Ss   08:15   0:00 /lib/systemd/systemd-logind
root         755  0.0  0.1 239272  8064 ?        Ssl  08:15   0:00 /usr/libexec/polkitd --no-debug
root         762  0.0  0.2  17124  8192 ?        Ss   08:15   0:00 /usr/sbin/cron -f -P
root         768  0.0  0.5  13672 10240 ?        Ss   08:15   0:00 sshd: /usr/sbin/sshd -D [listener] 0 of 10-100 startups
```

### 🔎 What I Observed:

1. **PID 1 is systemd** (`/sbin/init`) - the first process that starts all others
2. **System services** are running as root or special users (systemd+, message+, syslog)
3. **STAT codes** mean:
   - `Ss` = Sleeping, session leader
   - `Ssl` = Sleeping, session leader, multi-threaded
   - `S` = Sleeping
4. **SSH daemon** (PID 768) is listening for connections

---

## 🔍 Command 2: View Top 10 Processes

```bash
ps aux --sort=-%mem | head -n 11
```

### 📝 What This Command Does:
- Sorts processes by memory usage (highest first)
- Shows only the top 10 memory consumers

### 💻 Example Output:

```
USER         PID %CPU %MEM    VSZ   RSS TTY      STAT START   TIME COMMAND
nandan      2156  2.3  8.5 4589472 342784 ?      Ssl  08:17   5:23 /usr/lib/firefox/firefox
nandan      2445  0.8  4.2 3245888 171264 ?      Sl   08:18   1:45 /usr/lib/firefox/firefox -contentproc
nandan      1856  1.2  3.8 1245632 154880 ?      Ssl  08:16   2:34 /usr/bin/gnome-shell
root         732  0.0  2.5  30104 102400 ?       Ss   08:15   0:02 /usr/bin/python3 /usr/bin/networkd-dispatcher
nandan      2012  0.5  2.1  845632  85504 ?      Sl   08:16   1:12 /usr/bin/gnome-terminal-server
mysql        989  0.2  1.8 1234567 74832 ?       Ssl  08:15   0:34 /usr/sbin/mysqld
root        1456  0.1  1.2  234560 49152 ?       Ss   08:15   0:15 /usr/bin/containerd
nandan      2089  0.3  1.0  456789 41984 ?       Sl   08:17   0:45 /usr/lib/code/code --type=renderer
root         768  0.0  0.5  13672 10240 ?        Ss   08:15   0:00 sshd: /usr/sbin/sshd -D
root         742  0.0  0.3  15544  7680 ?        Ss   08:15   0:00 /lib/systemd/systemd-logind
```

### 🔎 What I Observed:
- **Firefox** uses the most memory (8.5%)
- **Desktop environment** (gnome-shell) uses 3.8%
- **Database services** like MySQL consume significant memory
- **System daemons** are relatively lightweight

---

## 🔍 Command 3: Real-Time Process Monitoring

```bash
top -n 1 -b
```

### 📝 What This Command Does:
- `top` = Display and update sorted information about processes
- `-n 1` = Update display 1 time then exit
- `-b` = Batch mode (good for capturing output)

### 💻 Example Output:

```
top - 14:23:15 up  6:08,  2 users,  load average: 0.52, 0.58, 0.64
Tasks: 287 total,   1 running, 286 sleeping,   0 stopped,   0 zombie
%Cpu(s):  2.3 us,  0.8 sy,  0.0 ni, 96.5 id,  0.4 wa,  0.0 hi,  0.0 si,  0.0 st
MiB Mem :   3912.5 total,    245.8 free,   2456.2 used,   1210.5 buff/cache
MiB Swap:   2048.0 total,   1876.3 free,    171.7 used.   1123.4 avail Mem 

    PID USER      PR  NI    VIRT    RES    SHR S  %CPU  %MEM     TIME+ COMMAND
   2156 nandan    20   0 4589472 342784 145280 S   3.2   8.5   5:23.45 firefox
   1856 nandan    20   0 1245632 154880  89600 S   1.8   3.8   2:34.12 gnome-shell
   2445 nandan    20   0 3245888 171264 123904 S   1.2   4.2   1:45.89 Web Content
    989 mysql     20   0 1234567  74832  32768 S   0.5   1.8   0:34.56 mysqld
   2089 nandan    20   0  456789  41984  28672 S   0.3   1.0   0:45.23 code
    412 root      20   0   46584  15232  12288 S   0.0   0.4   0:02.34 systemd-journald
```

### 🔎 What I Observed:

**System Summary:**
- **Uptime**: 6 hours 8 minutes
- **Load Average**: 0.52, 0.58, 0.64 (1min, 5min, 15min)
  - Load < 1.0 on single CPU = system not overloaded
- **Tasks**: 287 total, only 1 running (rest sleeping)
- **CPU Usage**: 96.5% idle - system is mostly idle
- **Memory**: 2456.2 MB used out of 3912.5 MB total (63% used)

---

## 🔍 Command 4: Find Specific Process

```bash
pgrep -a ssh
```

### 📝 What This Command Does:
- `pgrep` = Process grep (search for processes by name)
- `-a` = Show full command line

### 💻 Example Output:

```
768 /usr/sbin/sshd -D
3456 sshd: nandan [priv]
3489 sshd: nandan@pts/0
```

### 🔎 What I Observed:
- **PID 768**: Main SSH daemon listening for connections
- **PID 3456**: Privileged process for user nandan's SSH session
- **PID 3489**: User's actual SSH session on pseudo-terminal pts/0

---

## 🔍 Command 5: Process Tree View

```bash
pstree -p | head -n 20
```

### 📝 What This Command Does:
- Shows process hierarchy (parent-child relationships)
- `-p` = Show PIDs

### 💻 Example Output:

```
systemd(1)─┬─ModemManager(701)─┬─{ModemManager}(728)
           │                   └─{ModemManager}(735)
           ├─accounts-daemon(723)─┬─{accounts-daemon}(745)
           │                      └─{accounts-daemon}(756)
           ├─cron(762)
           ├─dbus-daemon(724)
           ├─dockerd(1234)─┬─containerd(1456)
           │               └─{dockerd}(1278)
           ├─networkd-dispatcher(732)
           ├─polkitd(755)─┬─{polkitd}(789)
           │              └─{polkitd}(791)
           ├─rsyslogd(738)─┬─{rsyslogd}(756)
           │               ├─{rsyslogd}(757)
           │               └─{rsyslogd}(758)
           ├─sshd(768)───sshd(3456)───sshd(3489)───bash(3490)───pstree(4567)
           ├─systemd(1812)───(sd-pam)(1813)
           ├─systemd-journald(412)
           ├─systemd-logind(742)
           ├─systemd-resolved(612)
           ├─systemd-timesyncd(614)
           └─systemd-udevd(445)
```

### 🔎 What I Observed:
- **systemd (PID 1)** is the root of all processes
- **SSH chain**: sshd → sshd (privileged) → sshd (user) → bash → my command
- **Multi-threaded processes** show threads in curly braces `{}`
- **Docker** has its own process tree with containerd

---

# 2️⃣ MANAGING SYSTEM SERVICES

## 📖 What is a Service?

A **service** (or daemon) is a background process that starts at boot and runs continuously.

**Common Services:**
- `ssh` - Secure Shell server
- `cron` - Task scheduler
- `docker` - Container runtime
- `nginx` - Web server
- `mysql` - Database server

**systemd** is the modern service manager in most Linux distributions.

---

## 🔍 Command 6: Check Service Status

```bash
systemctl status ssh
```

### 📝 What This Command Does:
- Shows detailed status of the SSH service
- Displays recent log entries

### 💻 Example Output:

```
● ssh.service - OpenBSD Secure Shell server
     Loaded: loaded (/lib/systemd/system/ssh.service; enabled; vendor preset: enabled)
     Active: active (running) since Tue 2026-02-03 08:15:22 IST; 6h ago
       Docs: man:sshd(8)
             man:sshd_config(5)
    Process: 752 ExecStartPre=/usr/sbin/sshd -t (code=exited, status=0/SUCCESS)
   Main PID: 768 (sshd)
      Tasks: 1 (limit: 4558)
     Memory: 3.2M
        CPU: 145ms
     CGroup: /system.slice/ssh.service
             └─768 "sshd: /usr/sbin/sshd -D [listener] 0 of 10-100 startups"

Feb 03 08:15:22 devops-vm systemd[1]: Starting OpenBSD Secure Shell server...
Feb 03 08:15:22 devops-vm sshd[768]: Server listening on 0.0.0.0 port 22.
Feb 03 08:15:22 devops-vm sshd[768]: Server listening on :: port 22.
Feb 03 08:15:22 devops-vm systemd[1]: Started OpenBSD Secure Shell server.
Feb 03 10:23:45 devops-vm sshd[3456]: Accepted publickey for nandan from 192.168.1.105 port 52345 ssh2: RSA SHA256:abc123...
Feb 03 10:23:45 devops-vm sshd[3456]: pam_unix(sshd:session): session opened for user nandan(uid=1000) by (uid=0)
```

### 🔎 What I Observed:

**Service Status Breakdown:**
- ✅ **Loaded**: Service configuration found and loaded
- ✅ **enabled**: Will start automatically at boot
- ✅ **Active (running)**: Service is currently running
- **Main PID**: 768 (the SSH daemon process)
- **Uptime**: Running for 6 hours
- **Memory**: Using only 3.2 MB
- **Recent Logs**: Shows successful SSH connection from 192.168.1.105

---

## 🔍 Command 7: List All Active Services

```bash
systemctl list-units --type=service --state=running
```

### 📝 What This Command Does:
- Lists all currently running services
- Filters by type=service and state=running

### 💻 Example Output:

```
UNIT                        LOAD   ACTIVE SUB     DESCRIPTION
accounts-daemon.service     loaded active running Accounts Service
cron.service                loaded active running Regular background program processing daemon
dbus.service                loaded active running D-Bus System Message Bus
docker.service              loaded active running Docker Application Container Engine
getty@tty1.service          loaded active running Getty on tty1
networkd-dispatcher.service loaded active running Dispatcher daemon for systemd-networkd
nginx.service               loaded active running A high performance web server and a reverse proxy server
polkit.service              loaded active running Authorization Manager
rsyslog.service             loaded active running System Logging Service
ssh.service                 loaded active running OpenBSD Secure Shell server
systemd-journald.service    loaded active running Journal Service
systemd-logind.service      loaded active running User Login Management
systemd-resolved.service    loaded active running Network Name Resolution
systemd-timesyncd.service   loaded active running Network Time Synchronization
systemd-udevd.service       loaded active running Rule-based Manager for Device Events and Files
udisks2.service             loaded active running Disk Manager
unattended-upgrades.service loaded active running Unattended Upgrades Shutdown
user@1000.service           loaded active running User Manager for UID 1000

LOAD   = Reflects whether the unit definition was properly loaded.
ACTIVE = The high-level unit activation state, i.e. generalization of SUB.
SUB    = The low-level unit activation state, values depend on unit type.
18 loaded units listed.
```

### 🔎 What I Observed:
- **18 services** are currently running
- Essential services: **ssh**, **cron**, **docker**, **nginx**
- All services show `loaded active running` - healthy state
- System services (systemd-*) are handling core functions

---

## 🔍 Command 8: List All Services (Including Inactive)

```bash
systemctl list-units --type=service --all | head -n 20
```

### 💻 Example Output:

```
UNIT                              LOAD      ACTIVE   SUB     DESCRIPTION
accounts-daemon.service           loaded    active   running Accounts Service
apache2.service                   loaded    inactive dead    The Apache HTTP Server
apparmor.service                  loaded    active   exited  Load AppArmor profiles
apt-daily-upgrade.service         loaded    inactive dead    Daily apt upgrade and clean activities
apt-daily.service                 loaded    inactive dead    Daily apt download activities
bluetooth.service                 loaded    inactive dead    Bluetooth service
console-setup.service             loaded    active   exited  Set console font and keymap
cron.service                      loaded    active   running Regular background program processing daemon
dbus.service                      loaded    active   running D-Bus System Message Bus
docker.service                    loaded    active   running Docker Application Container Engine
emergency.service                 loaded    inactive dead    Emergency Shell
getty@tty1.service                loaded    active   running Getty on tty1
keyboard-setup.service            loaded    active   exited  Set the console keyboard layout
mysql.service                     loaded    active   running MySQL Community Server
nginx.service                     loaded    active   running A high performance web server
postgresql.service                loaded    inactive dead    PostgreSQL RDBMS
redis-server.service              loaded    inactive dead    Advanced key-value store
ssh.service                       loaded    active   running OpenBSD Secure Shell server
systemd-journald.service          loaded    active   running Journal Service
```

### 🔎 What I Observed:
- **active running**: Service is currently running
- **active exited**: One-time service that completed successfully
- **inactive dead**: Service is installed but not running

---

## 🔍 Command 9: Service Management Commands

```bash
# Check if service is enabled (starts at boot)
systemctl is-enabled ssh
```

### 💻 Example Output:

```
enabled
```

```bash
# Check if service is active (currently running)
systemctl is-active ssh
```

### 💻 Example Output:

```
active
```

```bash
# View service dependencies
systemctl list-dependencies ssh
```

### 💻 Example Output:

```
ssh.service
● ├─system.slice
● ├─sshd-keygen.target
● │ ├─ssh-keygen@ecdsa.service
● │ ├─ssh-keygen@ed25519.service
● │ └─ssh-keygen@rsa.service
● └─sysinit.target
●   ├─apparmor.service
●   ├─dev-hugepages.mount
●   ├─dev-mqueue.mount
●   ├─keyboard-setup.service
●   ├─kmod-static-nodes.service
```

### 🔎 What I Observed:
- SSH requires **key generation services** before starting
- Dependencies ensure proper startup order
- System initialization (sysinit.target) must complete first

---

# 3️⃣ READING AND ANALYZING LOGS

## 📖 Why Logs Matter

Logs are the **black box** of your system. They record:
- Service start/stop events
- Errors and warnings
- Security events (login attempts, sudo usage)
- Application behavior

---

## 🔍 Command 10: View Service Logs with journalctl

```bash
journalctl -u ssh -n 50 --no-pager
```

### 📝 What This Command Does:
- `journalctl` = Query systemd journal (centralized logging)
- `-u ssh` = Filter for SSH service only
- `-n 50` = Show last 50 lines
- `--no-pager` = Print directly without interactive pager

### 💻 Example Output:

```
Feb 03 08:15:22 devops-vm systemd[1]: Starting OpenBSD Secure Shell server...
Feb 03 08:15:22 devops-vm sshd[768]: Server listening on 0.0.0.0 port 22.
Feb 03 08:15:22 devops-vm sshd[768]: Server listening on :: port 22.
Feb 03 08:15:22 devops-vm systemd[1]: Started OpenBSD Secure Shell server.
Feb 03 10:23:45 devops-vm sshd[3456]: Accepted publickey for nandan from 192.168.1.105 port 52345 ssh2: RSA SHA256:abc123def456
Feb 03 10:23:45 devops-vm sshd[3456]: pam_unix(sshd:session): session opened for user nandan(uid=1000) by (uid=0)
Feb 03 12:15:33 devops-vm sshd[4123]: Failed password for invalid user admin from 103.45.67.89 port 45678 ssh2
Feb 03 12:15:35 devops-vm sshd[4123]: Connection closed by invalid user admin 103.45.67.89 port 45678 [preauth]
Feb 03 12:15:38 devops-vm sshd[4156]: Failed password for invalid user root from 103.45.67.89 port 45789 ssh2
Feb 03 12:15:40 devops-vm sshd[4156]: Connection closed by authenticating user root 103.45.67.89 port 45789 [preauth]
Feb 03 13:45:22 devops-vm sshd[4589]: Accepted publickey for nandan from 192.168.1.105 port 53456 ssh2: RSA SHA256:abc123def456
```

### 🔎 What I Observed:

**⚠️ Security Alert Detected:**
- Multiple **failed login attempts** from IP `103.45.67.89`
- Attempted usernames: `admin` and `root` (common brute-force targets)
- Connection was rejected (authentication failed)
- **Action Required**: Consider implementing fail2ban or firewall rules

**✅ Successful Connections:**
- User `nandan` logged in from local network `192.168.1.105`
- Using public key authentication (more secure than passwords)

---

## 🔍 Command 11: Follow Logs in Real-Time

```bash
journalctl -u ssh -f
```

### 📝 What This Command Does:
- `-f` = Follow mode (like `tail -f`)
- Shows new log entries as they appear

### 💻 Example Output (while command runs):

```
-- Journal begins at Tue 2026-02-03 08:15:22 IST. --
Feb 03 14:25:12 devops-vm sshd[5678]: Accepted publickey for nandan from 192.168.1.105 port 54321 ssh2
Feb 03 14:25:12 devops-vm sshd[5678]: pam_unix(sshd:session): session opened for user nandan(uid=1000)
[waiting for new entries...]
```

**💡 Tip**: Press `Ctrl+C` to stop following

---

## 🔍 Command 12: View System Logs (Traditional Method)

```bash
tail -n 50 /var/log/syslog
```

### 📝 What This Command Does:
- Reads traditional syslog file
- Shows last 50 lines

### 💻 Example Output:

```
Feb  3 14:23:01 devops-vm CRON[5234]: (root) CMD (   cd / && run-parts --report /etc/cron.hourly)
Feb  3 14:23:12 devops-vm systemd[1]: Started Run anacron jobs.
Feb  3 14:23:12 devops-vm anacron[5256]: Anacron 2.3 started on 2026-02-03
Feb  3 14:23:12 devops-vm anacron[5256]: Normal exit (0 jobs run)
Feb  3 14:25:45 devops-vm kernel: [23456.789012] docker0: port 1(veth12ab34c) entered blocking state
Feb  3 14:25:45 devops-vm kernel: [23456.789034] docker0: port 1(veth12ab34c) entered forwarding state
Feb  3 14:26:01 devops-vm systemd[1]: Starting Clean php session files...
Feb  3 14:26:01 devops-vm systemd[1]: phpsessionclean.service: Succeeded.
Feb  3 14:26:01 devops-vm systemd[1]: Finished Clean php session files.
Feb  3 14:27:15 devops-vm sshd[5678]: Accepted publickey for nandan from 192.168.1.105
Feb  3 14:28:33 devops-vm sudo: nandan : TTY=pts/0 ; PWD=/home/nandan ; USER=root ; COMMAND=/usr/bin/systemctl status ssh
Feb  3 14:28:33 devops-vm sudo: pam_unix(sudo:session): session opened for user root(uid=0) by nandan(uid=1000)
```

### 🔎 What I Observed:
- **Cron jobs** running hourly tasks
- **Docker** network events (container networking)
- **SSH login** from local IP
- **Sudo usage** tracked (user nandan ran systemctl command as root)

---

## 🔍 Command 13: Check Authentication Logs

```bash
sudo tail -n 30 /var/log/auth.log
```

### 📝 What This Command Does:
- Shows authentication-related events
- Tracks SSH logins, sudo usage, user switches

### 💻 Example Output:

```
Feb  3 10:23:45 devops-vm sshd[3456]: Accepted publickey for nandan from 192.168.1.105 port 52345 ssh2: RSA SHA256:abc123def456
Feb  3 10:23:45 devops-vm sshd[3456]: pam_unix(sshd:session): session opened for user nandan(uid=1000) by (uid=0)
Feb  3 10:23:45 devops-vm systemd-logind[742]: New session 3 of user nandan.
Feb  3 12:15:33 devops-vm sshd[4123]: pam_unix(sshd:auth): authentication failure; logname= uid=0 euid=0 tty=ssh ruser= rhost=103.45.67.89  user=admin
Feb  3 12:15:33 devops-vm sshd[4123]: Failed password for invalid user admin from 103.45.67.89 port 45678 ssh2
Feb  3 12:15:38 devops-vm sshd[4156]: Failed password for invalid user root from 103.45.67.89 port 45789 ssh2
Feb  3 14:28:33 devops-vm sudo: nandan : TTY=pts/0 ; PWD=/home/nandan ; USER=root ; COMMAND=/usr/bin/systemctl status ssh
Feb  3 14:28:33 devops-vm sudo: pam_unix(sudo:session): session opened for user root(uid=0) by nandan(uid=1000)
Feb  3 14:28:33 devops-vm sudo: pam_unix(sudo:session): session closed for user root
```

### 🔎 What I Observed:
- ✅ Legitimate login: `nandan` from `192.168.1.105`
- ⚠️ Failed attacks: Unknown user attempts from `103.45.67.89`
- 📋 Audit trail: All sudo commands are logged

---

## 🔍 Command 14: Search Logs by Time Range

```bash
journalctl -u ssh --since "2026-02-03 12:00:00" --until "2026-02-03 13:00:00"
```

### 📝 What This Command Does:
- Shows logs only within specified time window
- Useful for investigating specific incidents

### 💻 Example Output:

```
Feb 03 12:15:33 devops-vm sshd[4123]: Failed password for invalid user admin from 103.45.67.89 port 45678 ssh2
Feb 03 12:15:35 devops-vm sshd[4123]: Connection closed by invalid user admin 103.45.67.89 port 45678 [preauth]
Feb 03 12:15:38 devops-vm sshd[4156]: Failed password for invalid user root from 103.45.67.89 port 45789 ssh2
Feb 03 12:15:40 devops-vm sshd[4156]: Connection closed by authenticating user root 103.45.67.89 port 45789 [preauth]
Feb 03 12:15:45 devops-vm sshd[4178]: Failed password for invalid user test from 103.45.67.89 port 45890 ssh2
Feb 03 12:15:47 devops-vm sshd[4178]: Connection closed by invalid user test 103.45.67.89 port 45890 [preauth]
```

### 🔎 What I Observed:
- **Brute-force attack** occurred between 12:15-12:16
- **6 failed attempts** in 14 seconds from same IP
- **Pattern**: Automated script trying common usernames

---

# 4️⃣ TROUBLESHOOTING WORKFLOW

## 🛠️ Scenario: SSH Service Not Working

### Step 1: Check if Service is Running

```bash
systemctl status ssh
```

**Expected Output:**
```
● ssh.service - OpenBSD Secure Shell server
     Loaded: loaded (/lib/systemd/system/ssh.service; enabled)
     Active: inactive (dead)
```

**Analysis**: Service is loaded but not running ❌

---

### Step 2: Try to Start the Service

```bash
sudo systemctl start ssh
```

**Expected Output:**
```
Job for ssh.service failed because the control process exited with error code.
See "systemctl status ssh.service" and "journalctl -xeu ssh.service" for details.
```

**Analysis**: Start failed ❌ - Need to check logs

---

### Step 3: Check Detailed Logs

```bash
sudo journalctl -xeu ssh.service -n 50
```

**Example Error Output:**

```
Feb 03 14:45:23 devops-vm sshd[6789]: /etc/ssh/sshd_config line 15: unsupported option "Port22".
Feb 03 14:45:23 devops-vm sshd[6789]: /etc/ssh/sshd_config: terminating, 1 bad configuration options
Feb 03 14:45:23 devops-vm systemd[1]: ssh.service: Control process exited, code=exited, status=255/EXCEPTION
Feb 03 14:45:23 devops-vm systemd[1]: ssh.service: Failed with result 'exit-code'.
Feb 03 14:45:23 devops-vm systemd[1]: Failed to start OpenBSD Secure Shell server.
```

**Analysis**: Configuration error! ❌  
**Issue**: `Port22` should be `Port 22` (space missing)

---

### Step 4: Validate Configuration

```bash
sudo sshd -t
```

### 💻 Example Output:

```
/etc/ssh/sshd_config line 15: unsupported option "Port22".
/etc/ssh/sshd_config: terminating, 1 bad configuration options
```

**Analysis**: Confirmed - syntax error in config file

---

### Step 5: Fix Configuration

```bash
sudo nano /etc/ssh/sshd_config
```

**Change line 15:**
```
# BEFORE (incorrect)
Port22

# AFTER (correct)
Port 22
```

**Save and exit** (Ctrl+X, Y, Enter)

---

### Step 6: Verify Configuration

```bash
sudo sshd -t
```

**Expected Output:**
```
(no output = configuration is valid ✅)
```

---

### Step 7: Start Service Again

```bash
sudo systemctl start ssh
```

**Expected Output:**
```
(no output = success ✅)
```

---

### Step 8: Verify Service is Running

```bash
systemctl status ssh
```

**Expected Output:**

```
● ssh.service - OpenBSD Secure Shell server
     Loaded: loaded (/lib/systemd/system/ssh.service; enabled)
     Active: active (running) since Tue 2026-02-03 14:48:15 IST; 5s ago
     Main PID: 6823 (sshd)
```

**Analysis**: ✅ Service is now running successfully!

---

### Step 9: Test SSH Connection

```bash
ssh localhost
```

**Expected Output:**
```
The authenticity of host 'localhost (127.0.0.1)' can't be established.
ED25519 key fingerprint is SHA256:abc123def456...
Are you sure you want to continue connecting (yes/no/[fingerprint])? yes
Warning: Permanently added 'localhost' (ED25519) to the list of known hosts.
nandan@localhost's password: 
Welcome to Ubuntu 22.04 LTS
```

**Analysis**: ✅ SSH is working correctly!

---

## 📋 Troubleshooting Checklist Summary

When a service fails, follow this order:

1. ✅ **Check status**: `systemctl status <service>`
2. ✅ **Read error logs**: `journalctl -xeu <service>`
3. ✅ **Test configuration**: Service-specific validation command
4. ✅ **Fix issues**: Edit configuration files
5. ✅ **Restart service**: `sudo systemctl restart <service>`
6. ✅ **Verify operation**: Test service functionality
7. ✅ **Enable at boot**: `sudo systemctl enable <service>` (if needed)

---

# 5️⃣ BONUS: Useful Commands Reference

## Process Management

| Command | Description |
|---------|-------------|
| `ps aux` | List all running processes |
| `ps aux --sort=-%cpu` | Sort processes by CPU usage |
| `ps aux --sort=-%mem` | Sort processes by memory usage |
| `top` | Real-time process monitor (interactive) |
| `htop` | Enhanced process viewer (install with `apt install htop`) |
| `pgrep -a <name>` | Find process by name |
| `pkill <name>` | Kill processes by name |
| `kill <PID>` | Send TERM signal to process |
| `kill -9 <PID>` | Force kill process (SIGKILL) |
| `pstree` | Show process tree |

## Service Management

| Command | Description |
|---------|-------------|
| `systemctl status <service>` | Check service status |
| `systemctl start <service>` | Start service |
| `systemctl stop <service>` | Stop service |
| `systemctl restart <service>` | Restart service |
| `systemctl reload <service>` | Reload config without stopping |
| `systemctl enable <service>` | Enable service at boot |
| `systemctl disable <service>` | Disable service at boot |
| `systemctl is-active <service>` | Check if running |
| `systemctl is-enabled <service>` | Check if enabled at boot |
| `systemctl list-units --type=service` | List all services |

## Log Analysis

| Command | Description |
|---------|-------------|
| `journalctl -u <service>` | View service logs |
| `journalctl -f` | Follow system logs in real-time |
| `journalctl -u <service> -n 50` | Last 50 log entries |
| `journalctl --since "1 hour ago"` | Logs from last hour |
| `journalctl -p err` | Only error messages |
| `tail -f /var/log/syslog` | Follow syslog file |
| `tail -f /var/log/auth.log` | Follow authentication logs |
| `grep "error" /var/log/syslog` | Search for errors in syslog |


---

## 🎯 Key Takeaways

1. **Processes** are running programs; use `ps`, `top`, and `pstree` to monitor them
2. **Services** are background daemons managed by systemd
3. **systemctl** is your primary tool for service management
4. **Logs** are critical for troubleshooting - check `journalctl` first
5. Always **verify configuration** before restarting services
6. **Failed login attempts** in auth logs indicate potential security threats

---

## 🚀 Next Steps

1. Monitor a different service (try `docker`, `nginx`, or `cron`)
2. Set up log monitoring with real-time alerts
3. Learn about `fail2ban` to block brute-force attacks
4. Explore `systemd` service creation (Day 05 topic!)

---
