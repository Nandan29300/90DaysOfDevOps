# Docker Cheat Sheet

---

## Container Commands

| Command | What it Does |
|---------|-------------|
| `docker run -d --name <name> <image>` | Run container in background (detached) |
| `docker run -it <image> sh` | Run container interactively with shell |
| `docker run -p 8080:80 <image>` | Map host port 8080 → container port 80 |
| `docker run -e VAR=value <image>` | Pass environment variable |
| `docker run --rm <image>` | Auto-remove container when it exits |
| `docker run -v myvolume:/data <image>` | Attach named volume |
| `docker run -v $(pwd):/app <image>` | Bind mount current directory |
| `docker run --network <net> <image>` | Connect to a custom network |
| `docker ps` | List running containers |
| `docker ps -a` | List all containers (including stopped) |
| `docker stop <name>` | Gracefully stop a container (SIGTERM) |
| `docker kill <name>` | Force stop a container (SIGKILL) |
| `docker rm <name>` | Remove a stopped container |
| `docker rm -f <name>` | Force remove a running container |
| `docker exec -it <name> sh` | Open shell inside a running container |
| `docker exec <name> <cmd>` | Run a one-off command inside a container |
| `docker logs <name>` | View container logs |
| `docker logs -f <name>` | Follow (tail) container logs |
| `docker inspect <name>` | Full JSON metadata for a container |
| `docker stats` | Live CPU/memory usage for all containers |
| `docker cp <name>:/path ./local` | Copy file from container to host |

---

## Image Commands

| Command | What it Does |
|---------|-------------|
| `docker build -t <name>:<tag> .` | Build image from Dockerfile in current dir |
| `docker build -f Dockerfile.prod -t <name> .` | Build using a specific Dockerfile |
| `docker build --no-cache -t <name> .` | Build ignoring layer cache |
| `docker pull <image>:<tag>` | Pull image from registry |
| `docker push <username>/<repo>:<tag>` | Push image to Docker Hub |
| `docker tag <src>:<tag> <dst>:<tag>` | Tag an existing image with a new name |
| `docker images` | List all local images |
| `docker rmi <image>` | Remove an image |
| `docker rmi -f <image>` | Force remove (even if tagged) |
| `docker history <image>` | Show layers and sizes of an image |
| `docker save <image> > file.tar` | Export image to tar archive |
| `docker load < file.tar` | Import image from tar archive |
| `docker login` | Log in to Docker Hub |
| `docker logout` | Log out |

---

## Volume Commands

| Command | What it Does |
|---------|-------------|
| `docker volume create <name>` | Create a named volume |
| `docker volume ls` | List all volumes |
| `docker volume inspect <name>` | Show volume details + mountpoint |
| `docker volume rm <name>` | Remove a volume |
| `docker volume prune` | Remove all unused volumes |

---

## Network Commands

| Command | What it Does |
|---------|-------------|
| `docker network create <name>` | Create a custom bridge network |
| `docker network ls` | List all networks |
| `docker network inspect <name>` | Show network details + connected containers |
| `docker network connect <net> <container>` | Connect running container to a network |
| `docker network disconnect <net> <container>` | Disconnect container from a network |
| `docker network rm <name>` | Remove a network |
| `docker network prune` | Remove all unused networks |

---

## Docker Compose Commands

| Command | What it Does |
|---------|-------------|
| `docker compose up -d` | Start all services in background |
| `docker compose up --build -d` | Rebuild images then start |
| `docker compose down` | Stop + remove containers and networks |
| `docker compose down -v` | Also remove named volumes (⚠️ data loss!) |
| `docker compose ps` | Show service status |
| `docker compose logs -f <svc>` | Follow logs of a service |
| `docker compose logs -f` | Follow logs of all services |
| `docker compose exec <svc> sh` | Shell into a running service |
| `docker compose build <svc>` | Build/rebuild a specific service |
| `docker compose restart <svc>` | Restart a service |
| `docker compose stop <svc>` | Stop a service without removing it |
| `docker compose pull` | Pull latest images for all services |
| `docker compose config` | Validate and view resolved compose file |
| `docker compose run --rm <svc> <cmd>` | Run a one-off command in a service |

---

## Cleanup Commands

| Command | What it Does |
|---------|-------------|
| `docker system df` | Show disk usage by images, containers, volumes |
| `docker system prune` | Remove all stopped containers, dangling images, unused networks |
| `docker system prune -a` | Also remove all unused images (not just dangling) |
| `docker system prune -a --volumes` | Nuclear option — removes everything unused |
| `docker container prune` | Remove all stopped containers |
| `docker image prune` | Remove dangling images |
| `docker image prune -a` | Remove all unused images |
| `docker volume prune` | Remove all unused volumes |
| `docker network prune` | Remove all unused networks |

---

## Dockerfile Instructions

| Instruction | What it Does |
|------------|-------------|
| `FROM <image>:<tag>` | Set the base image (always first instruction) |
| `FROM <image> AS <name>` | Start a named stage in a multi-stage build |
| `WORKDIR /path` | Set working directory (creates it if not exists) |
| `COPY src dest` | Copy files from build context into image |
| `COPY --from=<stage> src dest` | Copy from a previous build stage |
| `ADD src dest` | Like COPY but also unpacks tar archives and supports URLs |
| `RUN <command>` | Execute a shell command and commit the result as a layer |
| `ENV KEY=value` | Set environment variable (available at runtime too) |
| `ARG NAME=default` | Build-time variable (not available at runtime) |
| `EXPOSE <port>` | Document the port the app listens on (does NOT publish it) |
| `CMD ["exec", "args"]` | Default command — overridable at `docker run` |
| `ENTRYPOINT ["exec"]` | Fixed entry point — CMD becomes its default arguments |
| `USER <user>` | Switch to a non-root user for subsequent instructions |
| `VOLUME ["/path"]` | Declare a mount point for external volumes |
| `HEALTHCHECK --interval=30s CMD <cmd>` | Define a container health probe |
| `.dockerignore` | Exclude files from build context (like `.gitignore`) |

---

## Key Differences — Quick Reference

| Question | Answer |
|----------|--------|
| `CMD` vs `ENTRYPOINT` | `CMD` is overridable default args; `ENTRYPOINT` is the fixed executable |
| `COPY` vs `ADD` | Use `COPY` always; `ADD` only when you need auto-extract or URL fetch |
| Named volume vs bind mount | Named = Docker managed, portable; Bind = host path, great for dev |
| `docker stop` vs `docker kill` | `stop` sends SIGTERM (graceful); `kill` sends SIGKILL (immediate) |
| `docker compose down` vs `down -v` | `down` keeps volumes; `down -v` destroys data |
| Default bridge vs custom network | Default has no DNS; custom networks resolve container names |
| `image:` vs `build:` in Compose | `image:` pulls from registry; `build:` builds from local Dockerfile |
| `docker pull` vs `docker compose pull` | Single image vs all images in compose file |
