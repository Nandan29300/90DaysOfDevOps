# Linux Command Cheat Sheet
---

## ⚙️ Process Management
**Manage system resources, view running tasks, and control process execution.**

| Command | Usage Example | Description |
| :--- | :--- | :--- |
| **`ps`** | `ps aux` | Displays a detailed snapshot of all currently running processes. |
| **`ps -eo`** | `ps -eo pid,state,cmd` | Shows selected columns of running processes. |
| **`top`** | `top` | Shows real-time system statistics and processes. |
| **`htop`** | `htop` | Interactive, colorful process viewer. |
| **`kill`** | `kill 1234` | Terminates the process with PID 1234. |
| **`kill -9`** | `kill -9 1234` | Forcefully kills a stuck process. |
| **`killall`** | `killall firefox` | Kills all processes named "firefox". |
| **`pkill`** | `pkill nginx` | Signals processes based on name. |
| **`pgrep`** | `pgrep nginx` | Finds process ID by name. |
| **`nice`** | `nice -n 10 sleep 100` | Starts a process with lower priority. |
| **`renice`** | `renice 5 -p 1234` | Changes priority of a running process. |
| **`bg`** | `bg %1` | Resumes a suspended job in background. |
| **`fg`** | `fg %1` | Brings a background job to foreground. |
| **`jobs`** | `jobs` | Lists background jobs. |

---

## 📂 File System
**Navigate directories, manipulate files, and manage permissions.**

| Command | Usage Example | Description |
| :--- | :--- | :--- |
| **`pwd`** | `pwd` | Prints the current working directory. |
| **`ls`** | `ls -lah` | Lists files including hidden files. |
| **`cd`** | `cd /var/log` | Changes current working directory. |
| **`cat`** | `cat file.txt` | Displays file content. |
| **`less`** | `less /var/log/syslog` | Views large files page by page. |
| **`head`** | `head -n 10 file.txt` | Shows first 10 lines of a file. |
| **`tail`** | `tail -n 20 file.txt` | Shows last 20 lines of a file. |
| **`tail -f`** | `tail -f /var/log/syslog` | Live monitoring of logs. |
| **`df`** | `df -h` | Displays disk space usage. |
| **`du`** | `du -sh folder` | Shows size of a directory. |
| **`mkdir`** | `mkdir -p /a/b/c` | Creates directories including parents. |
| **`rmdir`** | `rmdir empty_dir` | Deletes an empty directory. |
| **`rm`** | `rm file.txt` | Deletes a file. |
| **`rm -rf`** | `rm -rf backup/` | Force deletes directory (dangerous). |
| **`cp`** | `cp -r src dest` | Copies files or directories. |
| **`mv`** | `mv old.txt new.txt` | Moves or renames files. |
| **`touch`** | `touch new.txt` | Creates an empty file. |
| **`chmod`** | `chmod 755 script.sh` | Changes file permissions. |
| **`chown`** | `chown user:group file` | Changes file owner and group. |
| **`stat`** | `stat file.txt` | Shows detailed file information. |

---

## 🌐 Networking Troubleshooting
**Diagnose connectivity issues, check configurations, and transfer data.**

| Command | Usage Example | Description |
| :--- | :--- | :--- |
| **`ip addr`** | `ip addr show` | Displays IP addresses of interfaces. |
| **`ip route`** | `ip route` | Shows default gateway. |
| **`ping`** | `ping -c 4 google.com` | Checks connectivity to a host. |
| **`curl`** | `curl https://example.com` | Fetches data from a web server. |
| **`curl -I`** | `curl -I https://example.com` | Fetches only HTTP headers. |
| **`wget`** | `wget https://example.com/file.zip` | Downloads files from the internet. |
| **`dig`** | `dig google.com` | Performs DNS lookup. |
| **`nslookup`** | `nslookup google.com` | Queries DNS servers. |
| **`traceroute`** | `traceroute google.com` | Traces path to destination. |
| **`ss`** | `ss -tulnp` | Lists listening ports and services. |
| **`netstat`** | `netstat -tulnp` | Older alternative to ss. |
| **`ifconfig`** | `ifconfig` | Shows network interface info (legacy). |
| **`hostname`** | `hostname` | Displays system hostname. |
| **`hostname -I`** | `hostname -I` | Shows system IP address. |

---

## 🖥️ System & Services (DevOps Bonus)

| Command | Usage Example | Description |
| :--- | :--- | :--- |
| **`systemctl status`** | `systemctl status nginx` | Checks service status. |
| **`systemctl start`** | `systemctl start nginx` | Starts a service. |
| **`systemctl stop`** | `systemctl stop nginx` | Stops a service. |
| **`systemctl restart`** | `systemctl restart nginx` | Restarts a service. |
| **`uptime`** | `uptime` | Shows system load and uptime. |
| **`whoami`** | `whoami` | Displays current user. |
| **`history`** | `history` | tail | Shows previously executed commands. |