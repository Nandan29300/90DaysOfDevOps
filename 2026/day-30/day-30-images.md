# Day 30 – Docker Images & Container Lifecycle

---
## Task 1: Docker Images

### 1. Pull Common Images

```sh
docker pull nginx
docker pull ubuntu
docker pull alpine
```

### 2. List All Images and Note Their Sizes

```sh
docker images
```
**Example output:**
```
REPOSITORY   TAG       IMAGE ID       CREATED        SIZE
nginx        latest    605c77e624dd   2 weeks ago   187MB
ubuntu       latest    ba6acccedd29   1 week ago    76MB
alpine       latest    c059bfaa849c   1 week ago    7.6MB
```

### 3. Why is Alpine Smaller than Ubuntu?

- **Alpine** is a minimal Linux distribution (just enough OS to run many apps), usually ~7MB.
- **Ubuntu** is a more "full-featured" distribution, ~70–80MB for its Docker image.
- **Alpine is smaller** because it ships the bare minimum utilities; it's great for microservices and when you want tiny images.

### 4. Inspect an Image

```sh
docker inspect alpine
```
- This gives you **JSON output** with config, env, layer info, entrypoint, etc.

**You’ll see:**  
- Architecture  
- Layer IDs (diff IDs)  
- Environment variables  
- Entrypoint / Cmd  

### 5. Remove an Image

```sh
docker rmi ubuntu
```
- This deletes the image (as long as no container is using it).

---

## Task 2: Image Layers

### 1. View Image History

```sh
docker image history nginx
```
**Example output:**
```
IMAGE          CREATED        CREATED BY                                      SIZE      COMMENT
605c77e624dd   2 weeks ago   /bin/sh -c #(nop)  CMD ["nginx" "-g" "daemon…   0B
<missing>      2 weeks ago   /bin/sh -c #(nop)  EXPOSE 80                    0B
<missing>      2 weeks ago   /bin/sh -c #(nop)  COPY file:... in /docker...  133MB
<...>
```

### 2. What are Layers? Why Does Docker Use Them?

- **Layers** are individual filesystem changes (or instructions) in a Docker image, created by each `RUN`, `COPY`, or `ADD` in a Dockerfile.
- Docker uses layers to:
    - Reuse unchanged layers between images (saves disk, speeds up builds/downloads)
    - Cache builds (only rebuilds the new/changed layers)
    - Makes images small and portable
- **Example:** If your base OS doesn’t change, building a new version of your app takes seconds, not minutes.

---

## Task 3: Container Lifecycle

We’ll use an `nginx` container for demonstration.

### 1. Create a Container (Without Starting)

```sh
docker create --name lifecycle-nginx nginx
```
- Output:  
  ```
  1234abcd5678efgh...
  ```

### 2. Start the Container

```sh
docker start lifecycle-nginx
```
- Status: `Up`

### 3. Pause the Container

```sh
docker pause lifecycle-nginx
```
- Status: `Paused`

### 4. Unpause the Container

```sh
docker unpause lifecycle-nginx
```
- Status: `Up`

### 5. Stop the Container

```sh
docker stop lifecycle-nginx
```
- Status: `Exited`

### 6. Restart the Container

```sh
docker restart lifecycle-nginx
```
- Status: `Up`

### 7. Kill the Container

```sh
docker kill lifecycle-nginx
```
- Status: `Exited`

### 8. Remove the Container

```sh
docker rm lifecycle-nginx
```

---

## Task 4: Working with Running Containers

### 1. Run Nginx in Detached Mode

```sh
docker run -d --name my-nginx -p 8080:80 nginx
```

### 2. View Logs

```sh
docker logs my-nginx
```

### 3. View Real-time Logs (follow mode)

```sh
docker logs -f my-nginx
```
Ctrl+C to exit

### 4. Exec into Container

```sh
docker exec -it my-nginx bash
```
- Try `ls`, `cat /etc/os-release`, etc.

### 5. Run a Single Command (not interactive)

```sh
docker exec my-nginx nginx -v
```

### 6. Inspect the Container (find IP, port mappings, mounts)

```sh
docker inspect my-nginx
```
- Find:
    - `"IPAddress"` (inside `NetworkSettings`)
    - `"Ports"`
    - `"Mounts"`

---

## Task 5: Cleanup

### 1. Stop All Running Containers (one command)

```sh
docker stop $(docker ps -q)
```

### 2. Remove All Stopped Containers

```sh
docker rm $(docker ps -aq)
```

### 3. Remove Unused Images

```sh
docker image prune -a
```

### 4. Check Disk Usage

```sh
docker system df
```

---

## Useful Docker Commands

| Command                               | Description                     |
|----------------------------------------|---------------------------------|
| `docker images`                        | List images                     |
| `docker pull <image>`                  | Download image                  |
| `docker rmi <image>`                   | Remove image                    |
| `docker create`                        | Create container (not start)    |
| `docker start` / `stop` / `restart`    | Manage container state          |
| `docker pause` / `unpause`             | Freeze/unfreeze container       |
| `docker kill`                          | Force-stop a container          |
| `docker rm`                            | Remove container                |
| `docker ps` / `docker ps -a`           | Show running/all containers     |
| `docker logs -f`                       | Live logs from container        |
| `docker exec -it <name> bash`          | Shell into a running container  |
| `docker inspect <container|image>`     | Inspect details (JSON)          |
| `docker system prune`                  | Remove unused data              |
| `docker system df`                     | Show disk usage                 |

---

## Key Points

- Docker images use **layers**—each build step is a cached, reusable layer, making builds efficient and images small.
- **Containers** are made from images—running, paused, stopped, removed as needed.
- You can inspect every part (images, containers) to see how Docker works, what’s running, and how much space you are using.
- Cleanup regularly to avoid local disk bloat!

---

## Why This Matters

> Understanding images, layers, and the container lifecycle is essential for debugging, optimizing images, and troubleshooting real production Docker setups.

---

