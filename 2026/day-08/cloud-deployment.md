# Day 08 – Cloud Server Setup: Docker, Nginx & Web Deployment

## 📋 Overview
Today's goal is to **deploy a real web server on the cloud** and learn practical server management.

---

## 🎯 Learning Objectives
By the end of today, you should be able to:
- Launch and configure a cloud instance (AWS EC2 or Utho)
- Connect to remote servers via SSH
- Install and configure Nginx web server
- Configure security groups for web access
- Extract and manage server logs
- Deploy a publicly accessible web application

---

# Part 1: Launch Cloud Instance & SSH Access

## What is a Cloud Instance?

**Definition:** A cloud instance is a virtual server running on cloud infrastructure. It's like having a physical computer in a data center, but virtualized and available on-demand.

**Why use cloud instances?**
- ✅ No physical hardware to manage
- ✅ Pay only for what you use
- ✅ Scale up or down instantly
- ✅ Available globally
- ✅ Automated backups and recovery

**Popular Cloud Providers:**
- **AWS EC2** (Amazon Web Services - Elastic Compute Cloud)
- **Utho** (Indian cloud provider)
- **DigitalOcean** (Droplets)
- **Azure** (Microsoft Virtual Machines)
- **GCP** (Google Compute Engine)

---

## Step 1: Create a Cloud Instance

### Option A: AWS EC2 (Free Tier)

**Prerequisites:**
- AWS Account (create at aws.amazon.com)
- Credit/Debit card for verification (Free Tier is free for 12 months)

**Steps:**

1. **Log in to AWS Console**
   - Go to: https://console.aws.amazon.com
   - Sign in with your credentials

2. **Navigate to EC2 Dashboard**
   - Search for "EC2" in the top search bar
   - Click "EC2" to open the dashboard

3. **Launch Instance**
   - Click **"Launch Instance"** button
   - Give your instance a name: `my-devops-server`

4. **Choose Amazon Machine Image (AMI)**
   - Select: **Ubuntu Server 22.04 LTS** (Free tier eligible)
   - Why Ubuntu? It's widely used, well-documented, and beginner-friendly

5. **Choose Instance Type**
   - Select: **t2.micro** (Free tier eligible)
   - Specs: 1 vCPU, 1 GB RAM (sufficient for learning)

6. **Create or Select Key Pair**
   - Click **"Create new key pair"**
   - Name: `my-devops-key`
   - Type: **RSA**
   - Format: **`.pem`** (for Mac/Linux) or **`.ppk`** (for PuTTY on Windows)
   - Click **"Create key pair"** - file will download automatically
   - **IMPORTANT:** Save this file securely - you can't download it again!

7. **Network Settings (Security Group)**
   - Check **"Allow SSH traffic from"** → Select "My IP"
   - Check **"Allow HTTP traffic from the internet"**
   - Check **"Allow HTTPS traffic from the internet"** (optional)

8. **Configure Storage**
   - Keep default: 8 GB (sufficient for this exercise)

9. **Launch Instance**
   - Click **"Launch Instance"**
   - Wait 1-2 minutes for instance to start
   - Click on the instance ID to see details

10. **Note Your Instance Details**
    - **Instance ID:** `i-0123456789abcdef0` (example)
    - **Public IPv4 Address:** `54.123.45.67` (example - note yours!)
    - **Instance State:** Should show "Running" with green dot

---

### Option B: Utho Cloud

**Prerequisites:**
- Utho Account (create at utho.com)
- Indian phone number for verification

**Steps:**

1. **Log in to Utho Dashboard**
   - Go to: https://console.utho.com
   - Sign in with your credentials

2. **Deploy New Server**
   - Click **"Deploy"** or **"+ Cloud"**
   - Select **"Cloud Instances"**

3. **Choose Configuration**
   - **Location:** Select nearest datacenter (Mumbai, Bangalore, etc.)
   - **OS:** Ubuntu 22.04 LTS
   - **Plan:** Select smallest plan (₹149/month or trial)

4. **Server Details**
   - **Hostname:** `my-devops-server`
   - **Root Password:** Set a strong password (you'll use this for SSH)

5. **Deploy**
   - Click **"Deploy Now"**
   - Wait 2-3 minutes for server to provision

6. **Note Your Server Details**
   - **IP Address:** `103.123.45.67` (example - note yours!)
   - **Username:** `root`
   - **Password:** (what you set earlier)

---

## Step 2: Connect via SSH

### What is SSH?

**SSH (Secure Shell)** is a protocol for securely connecting to remote servers over the network.

**Why SSH?**
- ✅ Encrypted communication (secure)
- ✅ Industry standard for server management
- ✅ Supports key-based authentication (more secure than passwords)
- ✅ Can tunnel other protocols

**SSH Components:**
- **SSH Client:** Your local machine (terminal, PuTTY)
- **SSH Server:** Remote machine (runs `sshd` daemon)
- **Authentication:** Password or Key-based

---

### Connecting from Mac/Linux

**Step 1:** Open Terminal

**Step 2:** Set correct permissions for your key file (AWS only)
```bash
chmod 400 ~/Downloads/my-devops-key.pem
```

**Why this command?**
- `chmod 400` = Read-only for owner, no access for others
- SSH requires private keys to have restricted permissions for security
- Without this, SSH will reject the key with "permissions too open" error

**Step 3:** Connect to your instance

**For AWS:**
```bash
ssh -i ~/Downloads/my-devops-key.pem ubuntu@54.123.45.67
```

**For Utho:**
```bash
ssh root@103.123.45.67
```

**Command breakdown:**
- `ssh` = SSH client command
- `-i` = Specifies identity file (private key)
- `ubuntu` or `root` = Username on remote server
- `@54.123.45.67` = IP address of remote server

**Step 4:** Accept the fingerprint
```
The authenticity of host '54.123.45.67' can't be established.
ECDSA key fingerprint is SHA256:xxxxxxxxxxxxxxxxxxxxx.
Are you sure you want to continue connecting (yes/no)?
```
Type: **`yes`** and press Enter

**Why?** This is a security measure. You're confirming you trust this server. The fingerprint is stored in `~/.ssh/known_hosts`.

**Step 5:** You should see a welcome message

**Example output:**
```
Welcome to Ubuntu 22.04.1 LTS (GNU/Linux 5.15.0-1026-aws x86_64)

 * Documentation:  https://help.ubuntu.com
 * Management:     https://landscape.canonical.com
 * Support:        https://ubuntu.com/advantage

Last login: Thu Feb  5 10:30:45 2026 from 49.123.45.67
ubuntu@ip-172-31-32-10:~$
```

**📸 Screenshot this terminal showing successful SSH connection!**

---

### Connecting from Windows

**Option 1: Using PuTTY (Traditional Method)**

1. **Download PuTTY**
   - Go to: https://www.putty.org
   - Download and install PuTTY

2. **Convert .pem to .ppk (AWS only)**
   - Open **PuTTYgen** (installed with PuTTY)
   - Click **"Load"** → Select your `.pem` file
   - Click **"Save private key"** → Save as `.ppk`

3. **Configure PuTTY**
   - Open **PuTTY**
   - **Host Name:** `ubuntu@54.123.45.67` (AWS) or `root@103.123.45.67` (Utho)
   - **Port:** `22`
   - **Connection type:** SSH
   - Navigate to: **Connection → SSH → Auth**
   - Browse and select your `.ppk` file
   - Go back to **Session** → Save session as "my-devops-server"
   - Click **"Open"**

**Option 2: Using Windows Terminal (Modern Method)**

Windows 10/11 has built-in SSH client!

1. Open **PowerShell** or **Windows Terminal**
2. Run same commands as Mac/Linux:

```powershell
# Change to Downloads folder
cd C:\Users\YourName\Downloads

# Connect (adjust path to your key)
ssh -i my-devops-key.pem ubuntu@54.123.45.67
```

---

## Verify Connection

Once connected, run these commands to verify your environment:

```bash
# Check current user
whoami
```
**Expected output:** `ubuntu` or `root`

```bash
# Check OS version
cat /etc/os-release
```
**Expected output:**
```
NAME="Ubuntu"
VERSION="22.04.1 LTS (Jammy Jellyfish)"
ID=ubuntu
ID_LIKE=debian
...
```

```bash
# Check hostname
hostname
```
**Expected output:** Something like `ip-172-31-32-10` or your Utho hostname

```bash
# Check IP address
curl ifconfig.me
```
**Expected output:** Your public IP address

```bash
# Check system resources
free -h
df -h
```

---

# Part 2: Install Docker & Nginx

## What is Nginx?

**Nginx (pronounced "engine-x")** is a high-performance web server, reverse proxy, and load balancer.

**Key Features:**
- ✅ Serves static websites (HTML, CSS, JS)
- ✅ Acts as reverse proxy (forwards requests to backend apps)
- ✅ Load balancing (distributes traffic across servers)
- ✅ Handles thousands of concurrent connections efficiently
- ✅ Low memory footprint

**Why Nginx for DevOps?**
- Industry standard for web servers
- Used by Netflix, Dropbox, Airbnb, NASA
- Essential for deploying web applications
- Works with Docker, Kubernetes, cloud platforms

**Nginx vs Apache:**
- Nginx: Event-driven, handles more concurrent connections
- Apache: Process-driven, more flexible configuration
- Nginx is generally preferred for modern DevOps

---

## Step 1: Update System

**Why update first?**
- Gets latest package lists from repositories
- Ensures security patches are applied
- Prevents version conflicts during installation

```bash
sudo apt update
```

**Command breakdown:**
- `sudo` = Run as superuser (administrator)
- `apt` = Package manager for Ubuntu/Debian
- `update` = Updates the package index (doesn't install anything yet)

**Expected output:**
```
Hit:1 http://archive.ubuntu.com/ubuntu jammy InRelease
Get:2 http://archive.ubuntu.com/ubuntu jammy-updates InRelease [119 kB]
Get:3 http://security.ubuntu.com/ubuntu jammy-security InRelease [110 kB]
...
Fetched 5,432 kB in 3s (1,811 kB/s)
Reading package lists... Done
Building dependency tree... Done
All packages are up to date.
```

**Optional but recommended:**
```bash
sudo apt upgrade -y
```

**Why?**
- `upgrade` = Actually installs newer versions of packages
- `-y` = Automatically answers "yes" to prompts
- This may take 2-5 minutes

---

## Step 2: Install Docker (Optional but Recommended)

**What is Docker?**
Docker is a platform for running applications in containers - isolated, portable environments.

**Why Docker?**
- ✅ Consistent environments (dev, staging, prod)
- ✅ Easy deployment and scaling
- ✅ Isolation (apps don't conflict)
- ✅ Industry standard in DevOps

**Install Docker:**

```bash
# Install prerequisites
sudo apt install -y apt-transport-https ca-certificates curl software-properties-common
```

```bash
# Add Docker's official GPG key
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo gpg --dearmor -o /usr/share/keyrings/docker-archive-keyring.gpg
```

```bash
# Add Docker repository
echo "deb [arch=$(dpkg --print-architecture) signed-by=/usr/share/keyrings/docker-archive-keyring.gpg] https://download.docker.com/linux/ubuntu $(lsb_release -cs) stable" | sudo tee /etc/apt/sources.list.d/docker.list > /dev/null
```

```bash
# Update package index
sudo apt update
```

```bash
# Install Docker
sudo apt install -y docker-ce docker-ce-cli containerd.io
```

**Verify Docker installation:**
```bash
sudo docker --version
```

**Expected output:**
```
Docker version 24.0.7, build afdd53b
```

```bash
# Check Docker service status
sudo systemctl status docker
```

**Expected output:**
```
● docker.service - Docker Application Container Engine
     Loaded: loaded (/lib/systemd/system/docker.service; enabled; vendor preset: enabled)
     Active: active (running) since Thu 2026-02-05 10:45:23 UTC; 2min ago
```

Press `q` to quit.

**Run a test container:**
```bash
sudo docker run hello-world
```

**Expected output:**
```
Unable to find image 'hello-world:latest' locally
latest: Pulling from library/hello-world
...
Hello from Docker!
This message shows that your installation appears to be working correctly.
```

---

## Step 3: Install Nginx

**Method 1: Install Nginx Directly (Traditional)**

```bash
sudo apt install nginx -y
```

**Command breakdown:**
- `install` = Installs the package
- `nginx` = Package name
- `-y` = Auto-confirm installation

**Expected output:**
```
Reading package lists... Done
Building dependency tree... Done
Reading state information... Done
The following additional packages will be installed:
  nginx-common nginx-core
...
Setting up nginx (1.18.0-0ubuntu1.4) ...
```

**Method 2: Run Nginx in Docker (Modern DevOps Approach)**

```bash
sudo docker run -d -p 80:80 --name my-nginx nginx:latest
```

**Command breakdown:**
- `docker run` = Create and start a container
- `-d` = Detached mode (runs in background)
- `-p 80:80` = Port mapping (host:container)
- `--name my-nginx` = Name the container
- `nginx:latest` = Image name and tag

**Expected output:**
```
Unable to find image 'nginx:latest' locally
latest: Pulling from library/nginx
...
Status: Downloaded newer image for nginx:latest
a1b2c3d4e5f6... (container ID)
```

**For this tutorial, we'll use Method 1 (traditional installation) for simplicity.**

---

## Step 4: Verify Nginx is Running

```bash
sudo systemctl status nginx
```

**Expected output:**
```
● nginx.service - A high performance web server and a reverse proxy server
     Loaded: loaded (/lib/systemd/system/nginx.service; enabled; vendor preset: enabled)
     Active: active (running) since Thu 2026-02-05 10:50:15 UTC; 30s ago
       Docs: man:nginx(8)
    Process: 2456 ExecStartPre=/usr/sbin/nginx -t -q -g daemon on; master_process on; (code=exited, status=0/SUCCESS)
    Process: 2457 ExecStart=/usr/sbin/nginx -g daemon on; master_process on; (code=exited, status=0/SUCCESS)
   Main PID: 2458 (nginx)
      Tasks: 2 (limit: 1131)
     Memory: 3.2M
        CPU: 45ms
     CGroup: /system.slice/nginx.service
             ├─2458 "nginx: master process /usr/sbin/nginx -g daemon on; master_process on;"
             └─2459 "nginx: worker process"
```

**What to look for:**
- ✅ `Active: active (running)` in green
- ✅ `enabled` means it will start on boot
- ✅ Process IDs showing master and worker processes

Press `q` to quit.

**Check if Nginx is listening on port 80:**
```bash
sudo netstat -tulpn | grep :80
```

**Expected output:**
```
tcp        0      0 0.0.0.0:80              0.0.0.0:*               LISTEN      2458/nginx: master
tcp6       0      0 :::80                   :::*                    LISTEN      2458/nginx: master
```

**What this means:**
- Nginx is listening on port 80
- `0.0.0.0:80` = IPv4, all interfaces
- `:::80` = IPv6, all interfaces

**Test Nginx locally on the server:**
```bash
curl http://localhost
```

**Expected output:**
```html
<!DOCTYPE html>
<html>
<head>
<title>Welcome to nginx!</title>
<style>
    body {
        width: 35em;
        margin: 0 auto;
        font-family: Tahoma, Verdana, Arial, sans-serif;
    }
</style>
</head>
<body>
<h1>Welcome to nginx!</h1>
<p>If you see this page, the nginx web server is successfully installed and
working. Further configuration is required.</p>
...
</body>
</html>
```

✅ **Success!** Nginx is working on the server.

---

# Part 3: Security Group Configuration

## What are Security Groups?

**Definition:** Security groups act as virtual firewalls that control inbound and outbound traffic to your cloud instance.

**Why Security Groups?**
- ✅ Protect your server from unauthorized access
- ✅ Only allow necessary ports (principle of least privilege)
- ✅ Can be modified without stopping the instance
- ✅ Stateful (return traffic is automatically allowed)

**Common Ports:**
- **22** - SSH (remote access)
- **80** - HTTP (web traffic)
- **443** - HTTPS (secure web traffic)
- **3306** - MySQL database
- **5432** - PostgreSQL database
- **6379** - Redis cache

---

## Configure Security Group for Web Access

### For AWS EC2:

1. **Go to EC2 Dashboard**
   - Click on your running instance
   - Scroll down to **"Security"** tab
   - Click on the Security Group link (e.g., `sg-0123456789abcdef0`)

2. **Edit Inbound Rules**
   - Click **"Edit inbound rules"**
   - You should see existing rules:
     - SSH (port 22) from your IP
     - HTTP (port 80) from anywhere (if you checked it during launch)

3. **Add HTTP Rule (if not already present)**
   - Click **"Add rule"**
   - **Type:** HTTP
   - **Protocol:** TCP
   - **Port Range:** 80
   - **Source:** 0.0.0.0/0 (anywhere IPv4)
   - **Description:** "Allow HTTP traffic"

4. **Add HTTPS Rule (Optional)**
   - Click **"Add rule"**
   - **Type:** HTTPS
   - **Protocol:** TCP
   - **Port Range:** 443
   - **Source:** 0.0.0.0/0
   - **Description:** "Allow HTTPS traffic"

5. **Save Rules**
   - Click **"Save rules"**

**Your inbound rules should look like:**
```
Type        Protocol  Port Range  Source          Description
SSH         TCP       22          <Your IP>/32    SSH access
HTTP        TCP       80          0.0.0.0/0       Allow HTTP
HTTPS       TCP       443         0.0.0.0/0       Allow HTTPS (optional)
```

---

### For Utho:

1. **Go to Utho Dashboard**
   - Click on your instance
   - Navigate to **"Firewall"** or **"Security"** section

2. **Add Firewall Rules**
   - **Rule 1:** Allow SSH
     - Protocol: TCP
     - Port: 22
     - Source: Your IP or 0.0.0.0/0

   - **Rule 2:** Allow HTTP
     - Protocol: TCP
     - Port: 80
     - Source: 0.0.0.0/0

   - **Rule 3:** Allow HTTPS (optional)
     - Protocol: TCP
     - Port: 443
     - Source: 0.0.0.0/0

3. **Apply Changes**

---

## Test Web Access from Browser

**Step 1:** Get your instance's public IP address

**For AWS:**
- Go to EC2 Dashboard
- Find your instance
- Copy **"Public IPv4 address"** (e.g., `54.123.45.67`)

**For Utho:**
- Go to your instance dashboard
- Copy the **IP Address** (e.g., `103.123.45.67`)

**Step 2:** Open a web browser (Chrome, Firefox, Safari)

**Step 3:** Visit your instance IP:
```
http://54.123.45.67
```
(Replace with your actual IP)

**Expected result:**
You should see the **Nginx Welcome Page**:

```
Welcome to nginx!

If you see this page, the nginx web server is successfully installed and working. Further configuration is required.

For online documentation and support please refer to nginx.org.
Commercial support is available at nginx.com.

Thank you for using nginx.
```

**📸 Screenshot this page - you'll need it for submission!**

---

## Troubleshooting: Can't Access Website?

### Issue 1: "This site can't be reached" or "Connection timed out"

**Possible causes:**
1. Security group doesn't allow port 80
2. Nginx is not running
3. Wrong IP address
4. Browser cached old response

**Solutions:**

```bash
# On your server, check if Nginx is running
sudo systemctl status nginx

# If not running, start it
sudo systemctl start nginx

# Check if port 80 is listening
sudo netstat -tulpn | grep :80

# Test from server itself
curl http://localhost
```

**Check security group:**
- Verify port 80 is allowed from 0.0.0.0/0
- Make sure you saved the changes

**Try from terminal:**
```bash
# On your LOCAL machine
curl http://54.123.45.67
```

If this works but browser doesn't, clear browser cache and try again.

---

### Issue 2: "403 Forbidden"

**Possible causes:**
- File permissions issue
- SELinux blocking (on RedHat/CentOS)

**Solutions:**
```bash
# Check Nginx error logs
sudo tail -20 /var/log/nginx/error.log

# Fix permissions
sudo chmod 755 /var/www/html
sudo chmod 644 /var/www/html/*
```

---

# Part 4: Extract Nginx Logs

## What are Logs?

**Definition:** Logs are records of events, requests, and errors that occur on your server.

**Why Logs Matter in DevOps:**
- ✅ **Debugging** - Identify what went wrong
- ✅ **Monitoring** - Track application health
- ✅ **Security** - Detect unauthorized access attempts
- ✅ **Compliance** - Meet audit requirements
- ✅ **Analytics** - Understand user behavior

**Types of Nginx Logs:**
1. **Access Logs** - Every request made to the server
2. **Error Logs** - Errors and warnings

---

## Step 1: View Nginx Logs

### View Access Logs

```bash
sudo tail -20 /var/log/nginx/access.log
```

**What this shows:**
```
54.123.45.67 - - [05/Feb/2026:11:30:15 +0000] "GET / HTTP/1.1" 200 615 "-" "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"
54.123.45.68 - - [05/Feb/2026:11:30:16 +0000] "GET /favicon.ico HTTP/1.1" 404 153 "-" "Mozilla/5.0"
```

**Log format breakdown:**
- `54.123.45.67` = Client IP address
- `[05/Feb/2026:11:30:15 +0000]` = Timestamp
- `"GET / HTTP/1.1"` = HTTP method, path, protocol
- `200` = Status code (200 = success)
- `615` = Response size in bytes
- `"Mozilla/5.0..."` = User agent (browser)

**Common HTTP Status Codes:**
- **200** - OK (success)
- **301** - Moved Permanently (redirect)
- **304** - Not Modified (cached)
- **400** - Bad Request
- **403** - Forbidden (no permission)
- **404** - Not Found
- **500** - Internal Server Error
- **502** - Bad Gateway
- **503** - Service Unavailable

---

### View Error Logs

```bash
sudo tail -20 /var/log/nginx/error.log
```

**What this shows:**
```
2026/02/05 11:30:16 [error] 2459#2459: *1 open() "/var/www/html/favicon.ico" failed (2: No such file or directory), client: 54.123.45.67, server: _, request: "GET /favicon.ico HTTP/1.1", host: "54.123.45.67"
```

**Error log breakdown:**
- Timestamp
- Error level (`[error]`, `[warn]`, `[crit]`)
- Process ID
- Error message
- Client details

---

### Follow Logs in Real-Time

```bash
sudo tail -f /var/log/nginx/access.log
```

**Why?**
- `-f` = follow (like `journalctl -f`)
- Shows new log entries as they arrive
- Great for debugging in real-time

**Try it:**
1. Run the command above
2. In your browser, refresh `http://<your-ip>` multiple times
3. Watch the logs appear instantly!
4. Press `Ctrl+C` to stop

---

### View Full Log Files

```bash
# Count total access log entries
wc -l /var/log/nginx/access.log

# View entire access log
sudo cat /var/log/nginx/access.log

# Search for specific IP
sudo grep "54.123.45.67" /var/log/nginx/access.log

# Show only 404 errors
sudo grep " 404 " /var/log/nginx/access.log

# Count 404 errors
sudo grep " 404 " /var/log/nginx/access.log | wc -l
```

---

## Step 2: Save Logs to File

### Generate Some Traffic First

**Open your browser and visit:**
```
http://<your-ip>/
http://<your-ip>/test
http://<your-ip>/admin
http://<your-ip>/api/users
```

Most will show 404, but that's fine - we're generating log entries!

---

### Combine Both Access and Error Logs

```bash
# Create a comprehensive log file
sudo bash -c 'echo "=== NGINX ACCESS LOGS ===" > nginx-logs.txt'
sudo bash -c 'cat /var/log/nginx/access.log >> nginx-logs.txt'
sudo bash -c 'echo "" >> nginx-logs.txt'
sudo bash -c 'echo "=== NGINX ERROR LOGS ===" >> nginx-logs.txt'
sudo bash -c 'cat /var/log/nginx/error.log >> nginx-logs.txt'
```

**Command breakdown:**
- `bash -c` = Execute command in bash shell
- `echo "text" >` = Write text to file (overwrites)
- `cat file >>` = Append file contents
- Need `sudo` because log files are owned by root

---

### Alternative: Copy Last 50 Lines of Each

```bash
# Create a summary log file (easier to read)
sudo bash -c 'echo "=== NGINX ACCESS LOGS (Last 50 lines) ===" > nginx-logs.txt'
sudo bash -c 'tail -50 /var/log/nginx/access.log >> nginx-logs.txt'
sudo bash -c 'echo "" >> nginx-logs.txt'
sudo bash -c 'echo "=== NGINX ERROR LOGS (Last 50 lines) ===" >> nginx-logs.txt'
sudo bash -c 'tail -50 /var/log/nginx/error.log >> nginx-logs.txt'
```

---

### Verify the Log File

```bash
# Check if file was created
ls -lh nginx-logs.txt
```

**Expected output:**
```
-rw-r--r-- 1 root root 15K Feb  5 11:45 nginx-logs.txt
```

```bash
# View the contents
cat nginx-logs.txt
```

**📸 Screenshot showing the contents of nginx-logs.txt!**

---

### Move to Home Directory (Optional)

```bash
# Move to your home directory for easier access
sudo mv nginx-logs.txt ~/
sudo chown $USER:$USER ~/nginx-logs.txt
```

**Why?**
- `~/` = Your home directory
- `chown` = Change ownership to your user
- Makes it easier to download via SCP

---

## Step 3: Download Log File to Your Local Machine

### Using SCP (Secure Copy)

**SCP** is like `cp` (copy) but works over SSH for remote files.

**From your LOCAL machine (open a NEW terminal window - don't close the SSH session):**

#### For AWS:

```bash
# Change to your desired directory
cd ~/Desktop

# Download the file
scp -i ~/Downloads/my-devops-key.pem ubuntu@54.123.45.67:~/nginx-logs.txt .
```

**Command breakdown:**
- `scp` = Secure copy command
- `-i key.pem` = Identity file (SSH key)
- `ubuntu@IP` = Remote user and host
- `:~/nginx-logs.txt` = Remote file path
- `.` = Current local directory

**Expected output:**
```
nginx-logs.txt                              100%   15KB  45.3KB/s   00:00
```

---

#### For Utho:

```bash
cd ~/Desktop
scp root@103.123.45.67:~/nginx-logs.txt .
```
Enter password when prompted.

---

### Using SFTP (Alternative)

**SFTP** = SSH File Transfer Protocol (interactive file transfer)

```bash
# Connect via SFTP
sftp -i ~/Downloads/my-devops-key.pem ubuntu@54.123.45.67

# Once connected:
sftp> ls
sftp> get nginx-logs.txt
sftp> bye
```

---

### Using FileZilla (GUI Option for Windows)

1. **Download FileZilla Client**
   - Go to: https://filezilla-project.org
   - Download and install

2. **Configure Connection**
   - **Protocol:** SFTP
   - **Host:** Your instance IP
   - **Port:** 22
   - **Username:** `ubuntu` or `root`
   - **Password:** Leave blank (for key-based auth)

3. **Add Key File (AWS)**
   - Go to: Edit → Settings → SFTP
   - Click "Add key file"
   - Browse to your `.pem` file

4. **Connect and Download**
   - Click "Quickconnect"
   - Navigate to `nginx-logs.txt`
   - Right-click → Download

---

### Verify Downloaded File

**On your local machine:**

```bash
# Mac/Linux
cat ~/Desktop/nginx-logs.txt

# Windows (PowerShell)
type C:\Users\YourName\Desktop\nginx-logs.txt
```

✅ **Success!** You've extracted and downloaded server logs!

---

# Part 5: Customize Your Nginx Website (Bonus)

## Create a Custom HTML Page

```bash
# Create a custom index page
sudo nano /var/www/html/index.html
```

**Replace contents with:**

```html
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>My DevOps Server</title>
    <style>
        body {
            font-family: Arial, sans-serif;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            display: flex;
            justify-content: center;
            align-items: center;
            height: 100vh;
            margin: 0;
        }
        .container {
            text-align: center;
            background: rgba(255, 255, 255, 0.1);
            padding: 50px;
            border-radius: 20px;
            box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
        }
        h1 {
            font-size: 3em;
            margin-bottom: 20px;
        }
        p {
            font-size: 1.2em;
            margin: 10px 0;
        }
        .badge {
            display: inline-block;
            background: rgba(255, 255, 255, 0.2);
            padding: 10px 20px;
            border-radius: 30px;
            margin: 10px;
        }
    </style>
</head>
<body>
    <div class="container">
        <h1>🚀 DevOps Day 08</h1>
        <p>Cloud Server Successfully Deployed!</p>
        <div>
            <span class="badge">✅ Nginx Running</span>
            <span class="badge">✅ Security Configured</span>
            <span class="badge">✅ Logs Extracted</span>
        </div>
        <p style="margin-top: 30px; font-size: 1em;">
            Server IP: <strong>YOUR_IP_HERE</strong>
        </p>
    </div>
</body>
</html>
```

**Save and exit:**
- Press `Ctrl+O` to save
- Press `Enter` to confirm
- Press `Ctrl+X` to exit

**Reload Nginx:**
```bash
sudo systemctl reload nginx
```

**Visit your website again!**

**📸 Screenshot your custom page!**

---

# Commands Reference

## SSH Commands
```bash
# Connect with key (AWS)
ssh -i key.pem ubuntu@<ip>

# Connect with password (Utho)
ssh root@<ip>

# Set key permissions
chmod 400 key.pem

# Copy file from server
scp -i key.pem ubuntu@<ip>:~/file.txt .

# Copy file to server
scp -i key.pem file.txt ubuntu@<ip>:~/
```

## System Commands
```bash
# Update package lists
sudo apt update

# Upgrade installed packages
sudo apt upgrade -y

# Check OS version
cat /etc/os-release

# Check system resources
free -h
df -h
```

## Nginx Commands
```bash
# Install Nginx
sudo apt install nginx -y

# Check status
sudo systemctl status nginx

# Start Nginx
sudo systemctl start nginx

# Stop Nginx
sudo systemctl stop nginx

# Restart Nginx
sudo systemctl restart nginx

# Reload configuration (no downtime)
sudo systemctl reload nginx

# Enable on boot
sudo systemctl enable nginx

# Test configuration
sudo nginx -t

# View version
nginx -v
```

## Log Commands
```bash
# View access logs
sudo tail -20 /var/log/nginx/access.log

# View error logs
sudo tail -20 /var/log/nginx/error.log

# Follow logs in real-time
sudo tail -f /var/log/nginx/access.log

# Search logs
sudo grep "pattern" /var/log/nginx/access.log

# Count log lines
wc -l /var/log/nginx/access.log

# View logs from specific date
sudo grep "05/Feb/2026" /var/log/nginx/access.log
```

## Docker Commands (Optional)
```bash
# Install Docker
sudo apt install docker-ce -y

# Check version
sudo docker --version

# Run test container
sudo docker run hello-world

# Run Nginx in Docker
sudo docker run -d -p 80:80 --name my-nginx nginx

# List running containers
sudo docker ps

# View container logs
sudo docker logs my-nginx

# Stop container
sudo docker stop my-nginx

# Remove container
sudo docker rm my-nginx
```

---

# Troubleshooting Guide

## Issue 1: SSH Connection Refused

**Symptoms:**
```
ssh: connect to host <ip> port 22: Connection refused
```

**Solutions:**
1. Verify instance is running (check cloud console)
2. Check security group allows port 22 from your IP
3. Verify you're using correct username (`ubuntu` vs `root`)
4. Check if your IP changed (use `curl ifconfig.me`)

---

## Issue 2: Permission Denied (SSH Key)

**Symptoms:**
```
Permissions 0644 for 'key.pem' are too open.
```

**Solution:**
```bash
chmod 400 key.pem
```

---

## Issue 3: Nginx Won't Start

**Symptoms:**
```
Job for nginx.service failed because the control process exited with error code.
```

**Solutions:**

```bash
# Check for port conflicts
sudo netstat -tulpn | grep :80

# Check configuration syntax
sudo nginx -t

# View detailed error
sudo journalctl -u nginx -n 50

# Check if Apache is running (conflicts with Nginx)
sudo systemctl status apache2
sudo systemctl stop apache2
```

---

## Issue 4: Can't Access Website from Browser

**Checklist:**
- [ ] Nginx is running: `sudo systemctl status nginx`
- [ ] Security group allows port 80 from 0.0.0.0/0
- [ ] Using correct IP address (public IP, not private)
- [ ] Using `http://` not `https://`
- [ ] Tested from server: `curl http://localhost`
- [ ] Firewall not blocking: `sudo ufw status`

---

## Issue 5: 502 Bad Gateway

**Causes:**
- Nginx can't reach backend application
- Application crashed or not running

**Solutions:**
```bash
# Check what's running on port
sudo netstat -tulpn | grep :80

# Check Nginx error logs
sudo tail -20 /var/log/nginx/error.log

# Restart Nginx
sudo systemctl restart nginx
```

---

# Documentation Template

## My Day 08 Deployment

### Instance Details
- **Cloud Provider:** AWS EC2 / Utho
- **Instance Type:** t2.micro / [Utho plan]
- **Operating System:** Ubuntu 22.04 LTS
- **Public IP Address:** `54.123.45.67`
- **Instance ID:** `i-0123456789abcdef0`

### Commands Used

```bash
# SSH Connection
ssh -i my-devops-key.pem ubuntu@54.123.45.67

# System Update
sudo apt update
sudo apt upgrade -y

# Install Nginx
sudo apt install nginx -y
sudo systemctl start nginx
sudo systemctl enable nginx

# Verify Nginx
sudo systemctl status nginx
curl http://localhost

# Extract Logs
sudo bash -c 'echo "=== ACCESS LOGS ===" > nginx-logs.txt'
sudo bash -c 'tail -50 /var/log/nginx/access.log >> nginx-logs.txt'
sudo bash -c 'echo "=== ERROR LOGS ===" >> nginx-logs.txt'
sudo bash -c 'tail -50 /var/log/nginx/error.log >> nginx-logs.txt'

# Download Logs
scp -i my-devops-key.pem ubuntu@54.123.45.67:~/nginx-logs.txt .
```

### Screenshots
1. **SSH Connection Successful**
   ![SSH Screenshot](screenshot-ssh.png)

2. **Nginx Welcome Page in Browser**
   ![Nginx Screenshot](screenshot-nginx.png)

3. **Log File Contents**
   ![Logs Screenshot](screenshot-logs.png)

### Challenges Faced

**Challenge 1: Connection timeout when accessing website**
- **Problem:** Could not access Nginx from browser, got "connection timed out"
- **Root Cause:** Security group didn't allow HTTP (port 80) traffic
- **Solution:** Added inbound rule for port 80 from 0.0.0.0/0 in AWS security group
- **Learning:** Always verify security groups when deploying web services

**Challenge 2: SSH permission denied with key**
- **Problem:** Got "permissions too open" error
- **Root Cause:** .pem file had 0644 permissions
- **Solution:** Changed permissions with `chmod 400 key.pem`
- **Learning:** SSH requires strict key file permissions for security

### What I Learned

1. **Cloud Infrastructure Basics**
   - How to provision and configure cloud instances
   - Importance of security groups for access control
   - Difference between public and private IP addresses

2. **Remote Server Management**
   - SSH is the standard for remote access
   - Key-based authentication is more secure than passwords
   - Always secure your private keys

3. **Web Server Deployment**
   - Nginx installation and configuration
   - How to verify services are running with systemctl
   - Port 80 is standard for HTTP traffic

4. **Log Management**
   - Access logs show all incoming requests
   - Error logs help debug issues
   - Log analysis is crucial for troubleshooting

5. **DevOps Workflow**
   - Real production workflow: provision → configure → deploy → monitor
   - Documentation is essential
   - Security should be considered at every step

### Next Steps

- [ ] Deploy a custom application instead of default Nginx page
- [ ] Set up HTTPS with SSL certificate (Let's Encrypt)
- [ ] Configure Nginx as reverse proxy for backend application
- [ ] Set up log rotation and monitoring
- [ ] Implement automated backups
- [ ] Explore load balancing with multiple instances

---

# Why This Matters for DevOps

## Skills You've Practiced Today

### 1. Infrastructure as Code (IaC) Foundation
- Manually provisioning prepares you for automation tools like Terraform
- Understanding the manual process helps debug automated deployments

### 2. Remote Server Management
- SSH is used daily by DevOps engineers
- Managing remote servers is core to operations work

### 3. Web Server Configuration
- Nginx powers millions of websites
- Understanding web servers is essential for deploying applications
- Commonly used as reverse proxy in microservices architectures

### 4. Security Best Practices
- Security groups demonstrate defense-in-depth strategy
- Key-based authentication is industry standard
- Principle of least privilege (only open necessary ports)

### 5. Log Management
- Logs are critical for debugging production issues
- Log analysis helps identify security threats
- Understanding log formats helps with SIEM tools

### 6. Troubleshooting Methodology
- Systematic approach: check status → view logs → form hypothesis → test
- This applies to any production incident

---

## Real-World Applications

**Scenario 1: E-commerce Website Deployment**
```
You need to deploy a web application for Black Friday sale.

Skills used:
- Launch multiple EC2 instances for scalability
- Install and configure Nginx as reverse proxy
- Configure security groups for web and database tiers
- Monitor logs for traffic patterns and errors
- Quickly troubleshoot issues under pressure
```

**Scenario 2: Production Incident Response**
```
Website is down at 3 AM. You get paged.

Skills used:
- SSH into production servers
- Check if services are running (systemctl)
- Analyze Nginx error logs to identify issue
- Implement fix and verify recovery
- Extract logs for post-incident analysis
```

**Scenario 3: Security Audit**
```
Security team requests access logs for compliance.

Skills used:
- Extract Nginx access logs
- Filter for specific time periods
- Identify unauthorized access attempts
- Provide documentation of security measures (security groups)
```

---

## Industry Standards You've Learned

✅ **Cloud Computing** - AWS/Utho are industry-standard platforms  
✅ **Linux Administration** - 96% of web servers run Linux  
✅ **Nginx** - Powers 33% of all websites globally  
✅ **SSH** - Universal remote access standard  
✅ **Security Groups** - Cloud firewall best practice  
✅ **Log Management** - Foundation for observability  

---

## Career Relevance

**Interview Questions You Can Now Answer:**

1. **"Have you deployed applications to the cloud?"**
   - ✅ Yes, I've deployed Nginx on AWS EC2/Utho

2. **"How do you troubleshoot a web server that's down?"**
   - ✅ Check systemctl status, analyze logs, verify network configuration

3. **"Explain security groups and why they matter"**
   - ✅ Virtual firewalls that control access, implement least privilege

4. **"How do you access logs on a Linux server?"**
   - ✅ Multiple methods: journalctl for systemd services, /var/log for traditional logs

5. **"What's your experience with SSH?"**
   - ✅ Daily use for remote server management, understand key-based auth

---

# Additional Resources

## Documentation
- [Nginx Official Docs](https://nginx.org/en/docs/)
- [AWS EC2 User Guide](https://docs.aws.amazon.com/ec2/)
- [Ubuntu Server Guide](https://ubuntu.com/server/docs)
- [SSH Configuration Guide](https://www.ssh.com/academy/ssh)

## Tutorials
- [DigitalOcean Community Tutorials](https://www.digitalocean.com/community/tutorials)
- [Nginx Admin Guide](https://docs.nginx.com/nginx/admin-guide/)
- [Linux Journey](https://linuxjourney.com/)

## Practice
- [AWS Free Tier](https://aws.amazon.com/free/)
- [Katacoda Interactive Scenarios](https://www.katacoda.com/)
- [Linux Academy](https://linuxacademy.com/)

---

# Clean Up (Important!)

## Don't Forget to Stop/Terminate Your Instance!

**AWS Charges:**
- Free Tier: 750 hours/month of t2.micro (enough for one instance running 24/7)
- After Free Tier: ~$0.0116/hour ($8.35/month if left running)

**To Avoid Charges:**

### Option 1: Stop Instance (Recommended for Learning)
```
1. Go to EC2 Dashboard
2. Select your instance
3. Instance State → Stop Instance
4. You can restart it later to continue learning
```
**Note:** You'll keep your data and configuration, but IP may change

### Option 2: Terminate Instance (Permanent Deletion)
```
1. Go to EC2 Dashboard
2. Select your instance
3. Instance State → Terminate Instance
4. Confirm termination
```
**Warning:** This permanently deletes everything!

### Utho:
- Stop or delete instance from dashboard
- Check billing section for charges

---