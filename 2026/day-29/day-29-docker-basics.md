# Day 29 – Introduction to Docker 🚢

## Task 1: What is Docker?

### 1. What is a Container and Why Do We Need Them?

- **Containers** are lightweight, portable, and isolated environments that run applications and all their dependencies.  
- Unlike traditional "install and run" (which can cause “it works on my machine” issues), containers package everything needed: app code, runtime, libraries, settings.
- **Why we need them:**  
  - Consistency across dev, test, and prod environments  
  - Fast, resource-efficient (compared to virtual machines)  
  - Easy to share and deploy applications

---

### 2. Containers vs Virtual Machines (VMs)

| Feature               | Containers                   | Virtual Machines                |
|-----------------------|-----------------------------|---------------------------------|
| Isolation             | OS-level (share host kernel) | Hardware-level (separate OS)    |
| Size                  | Tiny (MBs)                   | Large (GBs)                     |
| Startup Time          | Seconds                      | Minutes                         |
| Performance           | Minimal overhead             | Heavier, needs more resources   |
| Use Cases             | App deployment, microservices| Full system emulation           |

**Bottom line:**  
- **Containers** are lightweight and portable.  
- **VMs** emulate an entire OS, far heavier and slower.

---

### 3. Docker Architecture (Daemon, Client, Images, Containers, Registry)

- **Docker Daemon (`dockerd`):** The background service running on the host, manages images, containers, and networks.
- **Docker Client (`docker` command):** CLI tool to interact with Docker (users run commands here).
- **Docker Images:** Read-only templates for containers (contains OS + app code + dependencies).
- **Docker Containers:** Running instances of Docker images (isolated environment).
- **Docker Registry:** Central storage (like Docker Hub) for images.

---

### 4. Docker Architecture: Description

**Docker Architecture (in words):**

1. **Developer/User** interacts through the Docker CLI (`docker ...` commands).
2. **Docker CLI** talks to the **Docker Daemon** (`dockerd`), which runs on the host system.
3. **Docker Daemon** manages:
    - **Images** (downloaded from a Registry, like Docker Hub)
    - **Containers** (created and run from Images)
4. **Docker Registry** (remote server, e.g., Docker Hub) stores/publishes images which the Daemon can pull from/push to.


**ASCII Diagram:**
```
[Developer/You]
      |
      v
 [Docker CLI] <----> [Docker Daemon] -----> [Images/Containers]
      |                                         |
      v                                         v
[Docker Registry] <-----------------------> [Images]
```

**Or, in words:**

> You (the developer) use the Docker CLI (terminal) to talk to the Docker daemon. The daemon pulls images from a remote registry (like Docker Hub). The daemon then creates and manages containers using those images.

---

## Task 2: Install Docker

#### Install Docker Engine

- Follow official docs: [Docker Install Guide](https://docs.docker.com/get-docker/)
- Usual steps for Ubuntu:
    ```sh
    sudo apt update
    sudo apt install apt-transport-https ca-certificates curl gnupg lsb-release
    curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo gpg --dearmor -o /usr/share/keyrings/docker-archive-keyring.gpg
    echo \
      "deb [arch=$(dpkg --print-architecture) signed-by=/usr/share/keyrings/docker-archive-keyring.gpg] https://download.docker.com/linux/ubuntu \
      $(lsb_release -cs) stable" | sudo tee /etc/apt/sources.list.d/docker.list > /dev/null
    sudo apt update
    sudo apt install docker-ce docker-ce-cli containerd.io
    ```
- *Or use Docker Desktop for Windows/Mac.*

#### Verify Docker Installation

```sh
docker --version
```
**Example output:**
```sh
Docker version 25.0.0, build dea939
```

#### Run Hello World Container

```sh
sudo docker run hello-world
```

**Example output summary:**
```
Hello from Docker!
This message shows that your installation appears to be working correctly.
...
```
Add a screenshot of this output!

---

## Task 3: Run Real Containers

### 1. Run Nginx Container (Web Server)

```sh
sudo docker run --name my-nginx -d -p 8080:80 nginx
```
- `-d` runs container in *detached* mode (background)
- `-p 8080:80` maps host port 8080 to container’s port 80

**Check in your browser:** http://localhost:8080  
You’ll see the default Nginx welcome page.

---

### 2. Run Ubuntu Container (Interactive)

```sh
sudo docker run -it ubuntu
```
- `-it` for interactive terminal; you will get a shell inside Ubuntu

**Example output:**
```
root@a1b2c3d4e5:/#
```
Try commands inside (`ls`, `cat /etc/os-release`, `exit` to quit)

---

### 3. List Running Containers

```sh
sudo docker ps
```
**Example output:**
```
CONTAINER ID   IMAGE     COMMAND                  ...   STATUS          PORTS                  NAMES
20c1d0b12345   nginx     "/docker-entrypoint.…"   ...   Up 3 mins      0.0.0.0:8080->80/tcp   my-nginx
```

### 4. List All Containers (Including Stopped)

```sh
sudo docker ps -a
```

### 5. Stop and Remove a Container

```sh
sudo docker stop my-nginx
sudo docker rm my-nginx
```

**Result:** `my-nginx` container stops and is deleted.

---

## Task 4: Explore More Docker Features

### 1. Run in Detached Mode (`-d`)
```sh
sudo docker run -d --name det-nginx -p 8081:80 nginx
```
- Container runs in the background (not attached to terminal).

### 2. Assign a Custom Name
```sh
sudo docker run --name custom-ubuntu -it ubuntu
```

### 3. Map Container Port to Host
- Already shown above (`-p 8080:80`). You can set any host:container pair.

### 4. Check Logs of a Running Container
```sh
sudo docker logs det-nginx
```
- Shows the output/logs of the container.

### 5. Run a Command Inside a Running Container
```sh
sudo docker exec -it det-nginx nginx -v
```
- Or open a shell:
```sh
sudo docker exec -it det-nginx bash
```
- Now you’re "inside" the running container.

---

## Useful Docker Commands Cheat Sheet

| Command | Purpose |
|---------|---------|
| `docker ps` | Show running containers |
| `docker ps -a` | Show all (incl. stopped) containers |
| `docker run image` | Run a new container |
| `docker run -it image` | Run interactively |
| `docker run -d image` | Detached mode (background) |
| `docker run --name xyz image` | Name the container |
| `docker stop name/id` | Stop a running container |
| `docker rm name/id` | Delete a stopped container |
| `docker images` | List local images |
| `docker rmi id` | Remove an image |
| `docker exec -it name bash` | Exec a bash shell inside running container |
| `docker logs name` | View logs of a running container |

---

## Key Points to Remember

- **Containers** allow consistent, isolated dev and prod environments.
- **They are lighter, faster, and more portable than VMs.**
- Docker's main roles:
    - *daemon* (backend service that does the work),
    - *client* (CLI you use),
    - *images* (templates to run apps),
    - *containers* (apps running in isolated sandboxes),
    - *registries* (online image storage).
- Docker’s the starting point for most DevOps and cloud-native workflows!

---

## Why This Matters for DevOps

> Containers (like Docker) are the backbone of cloud, CI/CD, and microservices. Understanding them is essential for all modern DevOps tasks.

---

