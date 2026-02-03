# Linux Troubleshooting Runbook - Docker Service

**Date:** 2026-02-03  
**Operator:** Nandan29300  
**Target Service:** docker (dockerd)  
**System:** Production Ubuntu Server

---

## 🎯 Target Service / Process

**Service Name:** docker.service (dockerd daemon)  
**Purpose:** Container runtime platform for running containerized applications  
**Expected State:** Running, managing multiple containers  
**Critical:** Yes - hosts all containerized applications  
**Default Socket:** /var/run/docker.sock  
**Default Port:** 2375 (HTTP API - usually disabled), 2376 (HTTPS API)

---

## 🖥️ Environment Basics

### Command 1: System Information
```bash
uname -a
```

**Output:**
```
Linux docker-host 5.15.0-91-generic #101-Ubuntu SMP Tue Nov 14 13:30:08 UTC 2023 x86_64 x86_64 x86_64 GNU/Linux
```

**Interpretation:**  
- Ubuntu with kernel 5.15 (supports modern Docker features)
- 64-bit architecture (required for Docker)
- Kernel has cgroup, namespace support (essential for containers)

---

### Command 2: Docker Version Information
```bash
docker version
```

**Output:**
```
Client: Docker Engine - Community
 Version:           24.0.7
 API version:       1.43
 Go version:        go1.20.10
 Git commit:        afdd53b
 Built:             Thu Oct 26 09:08:44 2023
 OS/Arch:           linux/amd64
 Context:           default

Server: Docker Engine - Community
 Engine:
  Version:          24.0.7
  API version:      1.43 (minimum version 1.12)
  Go version:       go1.20.10
  Git commit:       311b9ff
  Built:            Thu Oct 26 09:08:44 2023
  OS/Arch:          linux/amd64
  Experimental:     false
 containerd:
  Version:          1.6.24
  GitCommit:        61f9fd88f79f081d64d6fa3bb1a0dc71ec870523
 runc:
  Version:          1.1.9
  GitCommit:        v1.1.9-0-gccaecfc
 docker-init:
  Version:          0.19.0
  GitCommit:        de40ad0
```

**Interpretation:**  
- **Docker version:** 24.0.7 (latest stable) ✅
- **Client-Server match:** Both running same version ✅
- **API version:** 1.43 (supports modern features)
- **containerd:** 1.6.24 (container runtime) ✅
- **runc:** 1.1.9 (OCI runtime) ✅
- **All components healthy and up-to-date**

---

### Command 3: OS Release Info
```bash
cat /etc/os-release
```

**Output:**
```
NAME="Ubuntu"
VERSION="22.04.3 LTS (Jammy Jellyfish)"
ID=ubuntu
VERSION_ID="22.04"
```

**Interpretation:**  
- Ubuntu 22.04 LTS - officially supported by Docker
- LTS version - stable for production containers

---

## 📁 Filesystem Sanity Check

### Command 4: Create Test Directory
```bash
mkdir /tmp/docker-runbook-demo
```

**Output:** (No output = success)

**Interpretation:**  
- Filesystem is writable
- Docker can create container filesystems
- No disk space issues

---

### Command 5: Test Docker Volume Creation
```bash
docker volume create test-volume && docker volume ls | grep test-volume
```

**Output:**
```
test-volume
local     test-volume
```

**Interpretation:**  
- Docker volume creation working ✅
- Docker daemon responding to API calls ✅
- Volume storage (/var/lib/docker/volumes) accessible ✅

**Cleanup:**
```bash
docker volume rm test-volume
```

---

## 💻 Snapshot: CPU & Memory

### Command 6: Docker Daemon Process
```bash
ps aux | grep dockerd
```

**Output:**
```
root      1456  0.8  1.2 2145678 102456 ?   Ssl  Jan20  12:34 /usr/bin/dockerd -H fd:// --containerd=/run/containerd/containerd.sock
```

**Interpretation:**  
- **PID:** 1456 (Docker daemon)
- **CPU:** 0.8% (light load, normal for idle state)
- **Memory:** 102MB (normal for managing ~10 containers)
- **Process state:** Ssl (running, multi-threaded, locked in memory)
- **Start time:** Jan 20 (14 days uptime, stable)
- **Socket:** Using systemd socket activation (fd://)
- **containerd:** Correctly connected to containerd runtime

---

### Command 7: Docker Service Status
```bash
systemctl status docker
```

**Output:**
```
● docker.service - Docker Application Container Engine
     Loaded: loaded (/lib/systemd/system/docker.service; enabled; vendor preset: enabled)
     Active: active (running) since Mon 2026-01-20 07:00:00 UTC; 2 weeks 0 days ago
TriggeredBy: ● docker.socket
       Docs: https://docs.docker.com
   Main PID: 1456 (dockerd)
      Tasks: 24
     Memory: 102.4M
        CPU: 12min 34s
     CGroup: /system.slice/docker.service
             └─1456 /usr/bin/dockerd -H fd:// --containerd=/run/containerd/containerd.sock

Feb 03 09:15:23 docker-host dockerd[1456]: time="2026-02-03T09:15:23Z" level=info msg="Container started" container=web-app
Feb 03 10:30:45 docker-host dockerd[1456]: time="2026-02-03T10:30:45Z" level=info msg="Image pulled successfully" image=nginx:latest
Feb 03 11:00:12 docker-host systemd[1]: Reloaded Docker Application Container Engine.
```

**Interpretation:**  
- **Status: active (running)** ✅ Healthy
- **Enabled:** Auto-starts on boot ✅
- **Uptime:** 2 weeks, no crashes
- **Tasks:** 24 threads (normal for active containers)
- **Memory:** 102MB for daemon (reasonable)
- **Recent activity:** Container starts, image pulls working
- **No error messages** in status output

---

### Command 8: Detailed CPU/Memory for Docker
```bash
ps -o pid,pcpu,pmem,vsz,rss,comm -C dockerd
```

**Output:**
```
   PID %CPU %MEM      VSZ    RSS COMMAND
  1456  0.8  1.2  2145678 102456 dockerd
```

**Interpretation:**  
- **VSZ:** 2.1GB virtual memory (includes mapped container filesystems)
- **RSS:** 102MB actual RAM usage (efficient)
- **CPU:** 0.8% (not under load)
- **Single process** managing all containers (expected architecture)

---

### Command 9: Container Resource Usage
```bash
docker stats --no-stream
```

**Output:**
```
CONTAINER ID   NAME          CPU %     MEM USAGE / LIMIT     MEM %     NET I/O           BLOCK I/O         PIDS
abc123def456   web-app       2.34%     256.5MiB / 7.7GiB    3.25%     1.2MB / 854KB    45.2MB / 12.3MB   15
def456ghi789   database      5.12%     1.2GiB / 2.0GiB      60.00%    3.4MB / 5.6MB    234MB / 567MB     42
ghi789jkl012   redis-cache   0.45%     45.8MiB / 512MiB     8.95%     234KB / 123KB    12.3MB / 8.9MB    4
jkl012mno345   api-service   1.23%     512MiB / 1.0GiB      50.00%    5.6MB / 3.2MB    67MB / 34MB       22
mno345pqr678   nginx-lb      0.12%     12.3MiB / 256MiB     4.80%     8.9MB / 12.1MB   23MB / 5.6MB      5
```

**Interpretation:**  
- **5 containers running**
- **web-app:** Low resource usage (3% memory) ✅
- **database:** ⚠️ 60% memory usage (1.2GB / 2GB limit) - monitor closely
- **redis-cache:** Healthy cache usage (8.95%) ✅
- **api-service:** 50% memory (within limits) ✅
- **nginx-lb:** Very light load balancer (< 1% CPU) ✅
- **Total container memory:** ~2GB / 7.7GB system RAM (26%)
- **High disk I/O:** Database container doing 234MB/567MB I/O

---

### Command 10: System Memory Overview
```bash
free -h
```

**Output:**
```
               total        used        free      shared  buff/cache   available
Mem:           7.7Gi       3.8Gi       1.2Gi       512Mi       2.7Gi       3.2Gi
Swap:          2.0Gi       256Mi       1.7Gi
```

**Interpretation:**  
- **Total RAM:** 7.7GB
- **Used:** 3.8GB (includes Docker containers + daemon)
- **Available:** 3.2GB (enough headroom) ✅
- **⚠️ Swap usage:** 256MB being used
  - System experiencing some memory pressure
  - Likely due to database container (60% of limit)
- **Buffer/cache:** 2.7GB (good for container disk I/O)

---

## 💾 Snapshot: Disk & IO

### Command 11: Disk Space Usage
```bash
df -h
```

**Output:**
```
Filesystem      Size  Used Avail Use% Mounted on
/dev/sda1        50G   28G   20G  59% /
/dev/sda2       200G  142G   48G  75% /var/lib/docker
tmpfs           3.9G   24M  3.9G   1% /run
overlay         200G  142G   48G  75% /var/lib/docker/overlay2/xxx
overlay         200G  142G   48G  75% /var/lib/docker/overlay2/yyy
```

**Interpretation:**  
- **Root (/):** 59% used ✅
- **/var/lib/docker:** ⚠️ 75% used (142GB / 200GB)
  - Docker images, containers, volumes stored here
  - 48GB remaining - should clean up soon
- **Overlay mounts:** Docker container filesystems (normal)
- **Warning:** Approaching 80% threshold

---

### Command 12: Docker Disk Usage
```bash
docker system df
```

**Output:**
```
TYPE            TOTAL     ACTIVE    SIZE      RECLAIMABLE
Images          15        5         24.5GB    18.2GB (74%)
Containers      8         3         2.1GB     1.8GB (85%)
Local Volumes   12        4         48.3GB    35.1GB (72%)
Build Cache     0         0         0B        0B
```

**Interpretation:**  
- **Images:** 15 total, only 5 in use
  - **18.2GB reclaimable** (74%) - old unused images ⚠️
  - Should prune unused images
- **Containers:** 8 total, 3 running
  - **1.8GB reclaimable** (85%) - stopped containers can be removed
- **Volumes:** 12 total, 4 in use
  - **35.1GB reclaimable** (72%) - orphaned volumes! 🚨
  - Large amount of wasted space
- **Total reclaimable:** 18.2 + 1.8 + 35.1 = **55.1GB** ✅
  - Can free significant space with `docker system prune`

---

### Command 13: Detailed Docker Directory Size
```bash
du -sh /var/lib/docker/* 2>/dev/null | sort -rh | head -10
```

**Output:**
```
48G     /var/lib/docker/volumes
45G     /var/lib/docker/overlay2
24G     /var/lib/docker/image
12G     /var/lib/docker/containers
156M    /var/lib/docker/buildkit
45M     /var/lib/docker/network
12M     /var/lib/docker/plugins
```

**Interpretation:**  
- **Volumes:** 48GB (largest consumer) - database persistent data
- **Overlay2:** 45GB (container filesystems)
- **Images:** 24GB (pulled images stored here)
- **Containers:** 12GB (container metadata and logs)
- **Total:** ~142GB matches `df -h` output

---

### Command 14: Container Log Sizes
```bash
du -sh /var/lib/docker/containers/*/''*-json.log 2>/dev/null | sort -rh | head -5
```

**Output:**
```
4.2G    /var/lib/docker/containers/abc123def456.../abc123def456...-json.log
2.8G    /var/lib/docker/containers/def456ghi789.../def456ghi789...-json.log
1.1G    /var/lib/docker/containers/jkl012mno345.../jkl012mno345...-json.log
456M    /var/lib/docker/containers/ghi789jkl012.../ghi789jkl012...-json.log
123M    /var/lib/docker/containers/mno345pqr678.../mno345pqr678...-json.log
```

**Interpretation:**  
- **🚨 Critical:** Container logs consuming **8.7GB** total!
- **web-app container:** 4.2GB log file (excessive)
- **database container:** 2.8GB logs
- **⚠️ No log rotation configured** on containers
- **Action required:** Implement log rotation with `--log-opt max-size=10m`

---

## 🌐 Snapshot: Network

### Command 15: Docker Networks
```bash
docker network ls
```

**Output:**
```
NETWORK ID     NAME              DRIVER    SCOPE
a1b2c3d4e5f6   bridge            bridge    local
b2c3d4e5f6a7   host              host      local
c3d4e5f6a7b8   none              null      local
d4e5f6a7b8c9   app-network       bridge    local
e5f6a7b8c9d0   db-network        bridge    local
```

**Interpretation:**  
- **3 default networks:** bridge, host, none ✅
- **2 custom networks:** app-network, db-network (good isolation practice)
- **Bridge driver:** Standard for container-to-container communication
- **Networks healthy**

---

### Command 16: Docker Daemon Socket
```bash
ss -tulpn | grep dockerd
# OR check socket file
ls -lh /var/run/docker.sock
```

**Output:**
```
srw-rw---- 1 root docker 0 Jan 20 07:00 /var/run/docker.sock
```

**Interpretation:**  
- **Unix socket:** /var/run/docker.sock exists ✅
- **Permissions:** root and docker group can access ✅
- **Not listening on TCP:** Good security practice (no remote API exposure)
- **Socket communication working**

---

### Command 17: Container Network Inspection
```bash
docker inspect -f '{{.Name}} - {{range .NetworkSettings.Networks}}{{.IPAddress}}{{end}}' $(docker ps -q)
```

**Output:**
```
/web-app - 172.18.0.2
/database - 172.19.0.2
/redis-cache - 172.18.0.3
/api-service - 172.18.0.4
/nginx-lb - 172.18.0.5
```

**Interpretation:**  
- **web-app, redis, api, nginx:** All on 172.18.0.0/16 (app-network)
- **database:** Isolated on 172.19.0.0/16 (db-network) ✅ Security
- **IP assignment working**
- **Network segregation proper**

---

### Command 18: Test Container Connectivity
```bash
docker exec web-app ping -c 2 redis-cache
```

**Output:**
```
PING redis-cache (172.18.0.3) 56(84) bytes of data.
64 bytes from redis-cache.app-network (172.18.0.3): icmp_seq=1 ttl=64 time=0.123 ms
64 bytes from redis-cache.app-network (172.18.0.3): icmp_seq=2 ttl=64 time=0.098 ms

--- redis-cache ping statistics ---
2 packets transmitted, 2 received, 0% packet loss, time 1001ms
rtt min/avg/max/mdev = 0.098/0.110/0.123/0.012 ms
```

**Interpretation:**  
- **DNS resolution working:** "redis-cache" resolved to 172.18.0.3 ✅
- **Network connectivity:** < 1ms latency (local bridge) ✅
- **0% packet loss** ✅
- **Container networking healthy**

---

## 📜 Logs Reviewed

### Command 19: Docker Daemon Logs
```bash
journalctl -u docker -n 50 --no-pager
```

**Output:**
```
Feb 03 08:00:15 docker-host dockerd[1456]: time="2026-02-03T08:00:15Z" level=info msg="Container started successfully" id=abc123def456
Feb 03 09:15:42 docker-host dockerd[1456]: time="2026-02-03T09:15:42Z" level=info msg="Pulling image" image="nginx:latest"
Feb 03 09:16:05 docker-host dockerd[1456]: time="2026-02-03T09:16:05Z" level=info msg="Image pull complete" image="nginx:latest"
Feb 03 10:22:18 docker-host dockerd[1456]: time="2026-02-03T10:22:18Z" level=warning msg="Container log file size exceeds 1GB" container=web-app
Feb 03 10:45:33 docker-host dockerd[1456]: time="2026-02-03T10:45:33Z" level=error msg="Failed to remove container" container=old-app error="container is running"
Feb 03 11:05:12 docker-host dockerd[1456]: time="2026-02-03T11:05:12Z" level=warning msg="Low disk space" path=/var/lib/docker available="48GB" threshold="50GB"
Feb 03 11:30:22 docker-host dockerd[1456]: time="2026-02-03T11:30:22Z" level=info msg="Container health check passed" container=database
```

**Interpretation:**  
- **Info messages:** Normal operations (starts, pulls) ✅
- **⚠️ Warning 10:22:** Container log file > 1GB
  - Confirms our earlier finding
  - Daemon detecting log bloat
- **🚨 Error 10:45:** Failed to remove running container
  - Someone tried `docker rm` without `docker stop` first
  - Not critical, just user error
- **⚠️ Warning 11:05:** Low disk space alert
  - Docker monitoring disk space
  - Available: 48GB (matches our df output)
- **Health check 11:30:** Database container healthy ✅

---

### Command 20: Specific Container Logs
```bash
docker logs --tail 50 web-app
```

**Output:**
```
[2026-02-03 11:25:15] INFO Starting web application
[2026-02-03 11:25:16] INFO Connected to database at database:5432
[2026-02-03 11:25:16] INFO Connected to Redis at redis-cache:6379
[2026-02-03 11:25:17] INFO Listening on port 3000
[2026-02-03 11:26:34] INFO GET /api/users 200 45ms
[2026-02-03 11:27:12] ERROR Failed to connect to external API: timeout after 30s
[2026-02-03 11:27:12] WARN Retrying external API call (attempt 2/3)
[2026-02-03 11:27:45] INFO External API call succeeded on retry
[2026-02-03 11:28:03] INFO POST /api/data 201 123ms
[2026-02-03 11:29:18] ERROR Database query timeout: SELECT * FROM large_table
[2026-02-03 11:30:22] INFO GET /health 200 2ms
```

**Interpretation:**  
- **Application started successfully** ✅
- **Connected to dependencies:** database, redis ✅
- **Serving requests:** Mix of GET/POST
- **⚠️ External API timeout at 11:27:**
  - 30-second timeout suggests network/upstream issue
  - Retry succeeded (resilient application)
- **🚨 Database timeout at 11:29:**
  - Query on "large_table" too slow
  - Matches database container high resource usage
  - May need query optimization or indexing
- **Health check working** (11:30)

---

### Command 21: Database Container Logs
```bash
docker logs --tail 50 database
```

**Output:**
```
2026-02-03 11:20:15 UTC [1] LOG:  database system is ready to accept connections
2026-02-03 11:25:16 UTC [45] LOG:  connection received: host=172.18.0.2 port=42356
2026-02-03 11:25:16 UTC [45] LOG:  connection authorized: user=app database=production
2026-02-03 11:29:18 UTC [45] WARNING:  query execution time exceeded 10 seconds
2026-02-03 11:29:18 UTC [45] STATEMENT:  SELECT * FROM large_table WHERE ...
2026-02-03 11:29:18 UTC [45] LOG:  duration: 10234.567 ms
2026-02-03 11:32:45 UTC [67] WARNING:  checkpoint sync taking longer than expected
2026-02-03 11:35:12 UTC [1] LOG:  automatic vacuum of table "production.public.large_table" started
```

**Interpretation:**  
- **Database accepting connections** ✅
- **Connection from web-app:** 172.18.0.2 (correct container)
- **🚨 Slow query at 11:29:** 10+ seconds!
  - Same query web-app reported timeout on
  - **Root cause identified:** Query needs optimization
- **⚠️ Checkpoint sync warning:**
  - Disk I/O slow (matches high BLOCK I/O in docker stats)
  - May need faster storage or tuning
- **Autovacuum running:** Normal maintenance

---

## 📝 Quick Findings

### ✅ Healthy Indicators:
1. **Docker Daemon:** Running for 2 weeks, no crashes
2. **Containers:** 3/8 containers active, all responding
3. **Networking:** DNS resolution, inter-container communication working
4. **Health Checks:** Database health check passing
5. **API Communication:** Containers connecting to dependencies
6. **Resource Usage:** Most containers within limits

### ⚠️ Warnings Identified:
1. **Disk Usage:** /var/lib/docker at 75% (142GB / 200GB)
2. **Reclaimable Space:** 55GB of unused images/volumes/containers
3. **Swap Usage:** 256MB swap being used (memory pressure)
4. **Database Memory:** 60% of limit (1.2GB / 2GB)
5. **Checkpoint Sync:** Slow disk I/O detected

### 🚨 Critical Issues:
1. **Container Log Bloat:**
   - web-app: 4.2GB log file
   - database: 2.8GB log file
   - Total: 8.7GB wasted on logs
   - **No log rotation configured**

2. **Database Performance:**
   - Query timeouts (10+ seconds)
   - High disk I/O (234MB read, 567MB write)
   - Slow checkpoint syncs
   - **Root cause:** Unoptimized queries on large_table

3. **Storage Cleanup Needed:**
   - 18.2GB of unused images (74% reclaimable)
   - 35.1GB of orphaned volumes (72% reclaimable)
   - Risk of disk full if not addressed soon

---

## 🚨 If This Worsens - Escalation Steps

### Scenario 1: Disk Space Critical (Current Risk)

**Symptoms:** /var/lib/docker approaching 90%, containers failing to start

**Next Steps:**

1. **Immediate Space Recovery (Safe):**
   ```bash
   # Remove stopped containers
   docker container prune -f
   
   # Remove unused images
   docker image prune -a -f
   
   # Check reclaimable space first
   docker system df
   
   # Remove unused volumes (CAREFUL - data loss)
   docker volume ls -q | xargs docker volume inspect | grep -A 5 '"Mountpoint"'
   docker volume prune -f  # Only if confirmed safe
   ```

2. **Implement Container Log Rotation:**
   ```bash
   # For existing containers - add to docker-compose.yml or recreate:
   logging:
     driver: "json-file"
     options:
       max-size: "10m"
       max-file: "3"
   
   # Daemon-wide config - /etc/docker/daemon.json:
   {
     "log-driver": "json-file",
     "log-opts": {
       "max-size": "10m",
       "max-file": "5"
     }
   }
   
   # Restart daemon
   systemctl restart docker
   ```

3. **Manually Truncate Existing Logs:**
   ```bash
   # Truncate without stopping containers
   truncate -s 0 /var/lib/docker/containers/*/''*-json.log
   
   # Verify size reduction
   du -sh /var/lib/docker/containers/*/''*-json.log
   ```

4. **Move Docker Data Directory:**
   ```bash
   # Stop all containers and docker
   systemctl stop docker
   
   # Move to larger partition
   rsync -aP /var/lib/docker/ /mnt/large-disk/docker/
   
   # Update daemon config /etc/docker/daemon.json
   {
     "data-root": "/mnt/large-disk/docker"
   }
   
   # Start docker
   systemctl start docker
   ```

---

### Scenario 2: Database Container Performance (Current Issue)

**Symptoms:** Query timeouts, high CPU/memory, slow responses

**Next Steps:**

1. **Identify Slow Queries:**
   ```bash
   # Enable slow query logging in PostgreSQL
   docker exec database psql -U postgres -c "ALTER SYSTEM SET log_min_duration_statement = 1000;"
   docker exec database psql -U postgres -c "SELECT pg_reload_conf();"
   
   # Watch slow queries
   docker logs -f database | grep "duration:"
   ```

2. **Check Database Stats:**
   ```bash
   # Connect to database
   docker exec -it database psql -U postgres -d production
   
   # Check table sizes
   SELECT schemaname, tablename, pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) AS size
   FROM pg_tables WHERE schemaname NOT IN ('pg_catalog', 'information_schema')
   ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC LIMIT 10;
   
   # Check missing indexes
   SELECT * FROM pg_stat_user_tables WHERE idx_scan = 0 AND seq_scan > 100;
   ```

3. **Increase Database Resources:**
   ```bash
   # Stop and update container memory limit
   docker update --memory=4g --memory-swap=4g database
   
   # Or recreate with more resources in docker-compose.yml:
   services:
     database:
       mem_limit: 4g
       cpus: 2
   ```

4. **Optimize Database Configuration:**
   ```bash
   # PostgreSQL tuning in docker-compose.yml
   environment:
     - POSTGRES_SHARED_BUFFERS=1GB
     - POSTGRES_EFFECTIVE_CACHE_SIZE=3GB
     - POSTGRES_WORK_MEM=16MB
   ```

---

### Scenario 3: Container Won't Start

**Symptoms:** `docker start` fails, container immediately exits

**Next Steps:**

1. **Check Container Exit Code:**
   ```bash
   # See why it exited
   docker inspect container-name --format='{{.State.ExitCode}}'
   docker inspect container-name --format='{{.State.Error}}'
   
   # Common exit codes:
   # 0 = Normal exit
   # 1 = Application error
   # 137 = OOM killed (out of memory)
   # 139 = Segmentation fault
   ```

2. **Review Container Logs:**
   ```bash
   # Even if container stopped
   docker logs container-name
   
   # Check last 100 lines
   docker logs --tail 100 container-name
   ```

3. **Test Container Interactively:**
   ```bash
   # Run with shell to debug
   docker run -it --entrypoint /bin/bash image-name
   
   # Manually run the application command
   # Check for missing files, permissions, etc.
   ```

4. **Check Resource Limits:**
   ```bash
   # See if container OOM killed
   docker inspect container-name | grep -A 5 "OOMKilled"
   
   # Check dmesg for OOM events
   dmesg | grep -i "out of memory"
   
   # Increase memory if needed
   docker run --memory=2g --memory-swap=2g ...
   ```

---

### Scenario 4: Docker Daemon Crashes / Won't Start

**Symptoms:** `systemctl start docker` fails, daemon won't stay running

**Next Steps:**

1. **Check Daemon Logs:**
   ```bash
   # Full daemon logs
   journalctl -u docker -n 200 --no-pager
   
   # Look for panic, fatal, error
   journalctl -u docker | grep -i "fatal\|panic\|error"
   ```

2. **Test Daemon Configuration:**
   ```bash
   # Validate /etc/docker/daemon.json
   cat /etc/docker/daemon.json | jq .
   
   # Common issues:
   # - Invalid JSON syntax
   # - Wrong data-root path
   # - Bad storage driver
   ```

3. **Start Daemon in Debug Mode:**
   ```bash
   # Stop systemd service
   systemctl stop docker
   
   # Run manually with debug logging
   dockerd --debug --log-level=debug
   
   # Watch for errors in output
   ```

4. **Check Storage Driver Issues:**
   ```bash
   # See current storage driver
   docker info | grep "Storage Driver"
   
   # If overlay2 issues, try fallback
   # /etc/docker/daemon.json:
   {
     "storage-driver": "vfs"  # Slower but more compatible
   }
   ```

---

### Scenario 5: High Memory Usage / OOM Kills

**Symptoms:** Containers randomly dying, system swapping heavily

**Next Steps:**

1. **Identify Memory-Heavy Containers:**
   ```bash
   # Sort by memory usage
   docker stats --no-stream --format "table {{.Name}}\t{{.MemUsage}}" | sort -k 2 -rh
   
   # Check for memory leaks (RSS growing over time)
   watch -n 5 'docker stats --no-stream'
   ```

2. **Set Memory Limits on All Containers:**
   ```bash
   # Update docker-compose.yml
   services:
     web-app:
       mem_limit: 512m
       mem_reservation: 256m
   
   # Or at runtime
   docker update --memory=512m --memory-reservation=256m container-name
   ```

3. **Check for OOM Kills:**
   ```bash
   # System logs
   dmesg | grep -i "killed process"
   
   # Docker events
   docker events --filter 'event=oom' --since 24h
   
   # Container inspection
   docker inspect container-name | grep -A 10 "OOMKilled"
   ```

4. **Enable Swap Limit (if needed):**
   ```bash
   # Check if swap limit supported
   docker info | grep "Swap Limit"
   
   # Enable in /etc/default/grub
   GRUB_CMDLINE_LINUX="cgroup_enable=memory swapaccount=1"
   
   # Update grub and reboot
   update-grub
   reboot
   ```

---

## 🔄 Regular Monitoring Commands

**Daily Health Check Script:**
```bash
#!/bin/bash
# Save as /usr/local/bin/docker-health.sh

echo "=== Docker Health Check $(date) ==="
echo ""

echo "1. Docker Daemon Status:"
systemctl is-active docker || echo "❌ DOCKER IS DOWN!"
echo ""

echo "2. Running Containers:"
docker ps --format "table {{.Names}}\t{{.Status}}" | grep -v "NAMES"
echo ""

echo "3. Resource Usage:"
docker stats --no-stream --format "table {{.Name}}\t{{.CPUPerc}}\t{{.MemUsage}}"
echo ""

echo "4. Disk Usage:"
df -h /var/lib/docker | tail -1 | awk '{print "Used: "$3" / "$2" ("$5")"}'
echo ""

echo "5. Reclaimable Space:"
docker system df | tail -n +2
echo ""

echo "6. Recent Container Failures:"
docker ps -a --filter "status=exited" --filter "status=dead" --format "{{.Names}}: {{.Status}}" | head -5
echo ""

echo "7. Container Log Sizes (Top 5):"
du -sh /var/lib/docker/containers/*/''*-json.log 2>/dev/null | sort -rh | head -5
echo ""

echo "8. Docker Daemon Errors (last hour):"
journalctl -u docker --since "1 hour ago" | grep -ci error
```

**Usage:**
```bash
chmod +x /usr/local/bin/docker-health.sh
./docker-health.sh
```

---

## 📚 Additional Resources

- **Docker Docs:** https://docs.docker.com/
- **Best Practices:** https://docs.docker.com/develop/dev-best-practices/
- **Logging:** https://docs.docker.com/config/containers/logging/
- **Resource Constraints:** https://docs.docker.com/config/containers/resource_constraints/
- **Storage Drivers:** https://docs.docker.com/storage/storagedriver/

---

**Sign-off:**  
Runbook validated on: 2026-02-03  
Critical actions needed:
1. Implement log rotation on all containers
2. Clean up 55GB of unused Docker resources
3. Optimize database queries on large_table
  
Next review date: 2026-02-04  
Status: ACTIVE - ACTION REQUIRED
