```md
# Linux Command Cheat Sheet (Day 03)

---

## ⚙️ PROCESS MANAGEMENT  
**Manage system resources, view running tasks, and control process execution.**

| Command | Usage Example | Description |
| :--- | :--- | :--- |
| **`ps`** | `ps aux` | Displays a snapshot of currently running processes. |
| **`ps -eo pid,state,cmd`** | `ps -eo pid,state,cmd` | Custom view showing PID, state, and command. |
| **`top`** | `top` | Real-time CPU, memory, and process monitor. |
| **`htop`** | `htop` | Interactive, user-friendly version of `top`. |
| **`kill`** | `kill 1234` | Sends terminate signal to process 1234. |
| **`kill -9`** | `kill -9 1234` | Forcefully kills a stuck process. |
| **`pkill`** | `pkill nginx` | Kills processes by name. |
| **`pgrep`** | `pgrep nginx` | Finds process ID by name. |
| **`nice`** | `nice -n 10 sleep 100` | Starts process with lower priority. |
| **`renice`** | `renice 5 -p 1234` | Changes priority of running process. |
| **`bg`** | `bg %1` | Resumes a stopped job in background. |
| **`fg`** | `fg %1` | Brings background job to foreground. |
| **`jobs`** | `jobs` | Lists all background jobs. |

---

## 📂 FILE SYSTEM  
**Navigate directories, manipulate files, and manage permissions.**

| Command | Usage Example | Description |
| :--- | :--- | :--- |
| **`pwd`** | `pwd` | Prints current working directory. |
| **`ls`** | `ls -lah` | Lists files including hidden ones. |
| **`cd`** | `cd /var/log` | Changes current directory. |
| **`cat`** | `cat file.txt` | Displays file content. |
| **`less`** | `less /var/log/syslog` | Views large files page by page. |
| **`head`** | `head -n 10 file.txt` | Shows first 10 lines of file. |
| **`tail`** | `tail -n 20 file.txt` | Shows last 20 lines of file. |
| **`tail -f`** | `tail -f /var/log/syslog` | Live log monitoring. |
| **`df -h`** | `df -h` | Shows disk space usage. |
| **`du -sh`** | `du -sh /var/log` | Shows folder size. |
| **`mkdir`** | `mkdir -p /a/b/c` | Creates directory with parents. |
| **`rm`** | `rm file.txt` | Deletes a file. |
| **`rm -rf`** | `rm -rf backup/` | Force deletes directory (dangerous). |
| **`cp`** | `cp -r src dest` | Copies files/directories. |
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
| **`traceroute`** | `traceroute google.com` | Traces packet path to destination. |

---

## 🖥️ SYSTEM & SERVICES (DevOps Bonus)

| Command | Usage Example | Description |
| :--- | :--- | :--- |
| **`systemctl status`** | `systemctl status nginx` | Checks service status. |
| **`systemctl start`** | `systemctl start nginx` | Starts a service. |
| **`systemctl restart`** | `systemctl restart nginx` | Restarts a service. |
| **`uptime`** | `uptime` | Shows system load and uptime. |
| **`whoami`** | `whoami` | Displays current user. |
| **`history`** | `history | tail` | Shows previously run commands. |

---

### ✅ Day 03 Checklist
- 45 commands in **boxed table format** ✔  
- Grouped by category ✔  
- Usage examples included ✔  
- Concise descriptions ✔  

If you want, I can:
- convert this into **one-page printable PDF**, or  
- make a **handwritten-style version** for your notebook.
```
