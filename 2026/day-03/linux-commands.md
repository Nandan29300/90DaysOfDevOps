```md
# Linux Command Cheat Sheet (Day 03)

---

## ⚙️ PROCESS MANAGEMENT  
**Manage system resources, view running tasks, and control process execution.**

| Command | Usage Example | Description |
| :--- | :--- | :--- |
| **`ps`** | `ps aux` | Displays a snapshot of currently running processes. |
| **`ps -eo pid,state,cmd`** | `ps -eo pid,state,cmd` | Custom view of processes showing PID, state, and command. |
| **`top`** | `top` | Real-time view of CPU, memory, and running processes. |
| **`htop`** | `htop` | Interactive and user-friendly version of `top`. |
| **`kill`** | `kill 1234` | Sends a terminate signal to process ID 1234. |
| **`kill -9`** | `kill -9 1234` | Forcefully kills a stuck process. |
| **`pkill`** | `pkill nginx` | Kills processes by name. |
| **`pgrep`** | `pgrep nginx` | Finds process ID by process name. |
| **`nice`** | `nice -n 10 sleep 100` | Starts a process with lower priority. |
| **`renice`** | `renice 5 -p 1234` | Changes priority of a running process. |
| **`bg`** | `bg %1` | Resumes a stopped job in the background. |
| **`fg`** | `fg %1` | Brings a background job to the foreground. |
| **`jobs`** | `jobs` | Lists all background jobs in the shell. |

---

## 📂 FILE SYSTEM  
**Navigate directories, manipulate files, and manage permissions.**

| Command | Usage Example | Description |
| :--- | :--- | :--- |
| **`pwd`** | `pwd` | Shows current working directory. |
| **`ls`** | `ls -lah` | Lists files including hidden files with details. |
| **`cd`** | `cd /var/log` | Changes current directory. |
| **`cat`** | `cat file.txt` | Displays file content. |
| **`less`** | `less /var/log/syslog` | Views large files page by page. |
| **`head`** | `head -n 10 file.txt` | Shows first 10 lines of a file. |
| **`tail`** | `tail -n 20 file.txt` | Shows last 20 lines of a file. |
| **`tail -f`** | `tail -f /var/log/syslog` | Live log monitoring. |
| **`df -h`** | `df -h` | Shows disk space usage. |
| **`du -sh`** | `du -sh /var/log` | Shows size of a directory. |
| **`mkdir`** | `mkdir -p /a/b/c` | Creates directory including parents. |
| **`rm`** | `rm file.txt` | Deletes a file. |
| **`rm -rf`** | `rm -rf backup/` | Force deletes directory (dangerous). |
| **`cp`** | `cp -r src dest` | Copies files/directories recursively. |
| **`mv`** | `mv old.txt new.txt` | Moves or renames files. |
| **`chmod`** | `chmod 755 script.sh` | Changes file permissions. |
| **`chown`** | `chown user:group file` | Changes file owner and group. |

---

## 🌐 NETWORKING TROUBLESHOOTING  
**Diagnose connectivity issues, check configurations, and transfer data.**

| Command | Usage Example | Description |
| :--- | :--- | :--- |
| **`ping`** | `ping -c 4 google.com` | Checks network connectivity. |
| **`ip addr`** | `ip addr show` | Shows IP addresses of interfaces. |
| **`ip route`** | `ip route` | Displays default gateway. |
| **`ss -tulnp`** | `ss -tulnp` | Lists listening ports and services. |
| **`netstat -tulnp`** | `netstat -tulnp` | Older version of `ss`. |
| **`curl`** | `curl https://example.com` | Fetches data from a web server. |
| **`curl -I`** | `curl -I https://example.com` | Fetches only HTTP headers. |
| **`dig`** | `dig google.com` | Performs DNS lookup. |
| **`traceroute`** | `traceroute google.com` | Traces path packets take to destination. |

---

## 🖥️ SYSTEM & SERVICES (DevOps Bonus)

| Command | Usage Example | Description |
| :--- | :--- | :--- |
| **`systemctl status`** | `systemctl status nginx` | Checks service status. |
| **`systemctl start`** | `systemctl start nginx` | Starts a service. |
| **`systemctl restart`** | `systemctl restart nginx` | Restarts a service. |
| **`uptime`** | `uptime` | Shows system load and running time. |
| **`whoami`** | `whoami` | Displays current logged-in user. |
| **`history`** | `history | tail` | Shows previously executed commands. |

---


```
