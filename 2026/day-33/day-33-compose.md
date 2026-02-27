# Day 33 – Docker Compose: Multi-Container Basics

---

## What is Docker Compose?

Docker Compose is a tool for defining and running multi-container Docker applications.  
- You describe your app (services, volumes, networks, environment variables) in a YAML file called `docker-compose.yml`.
- Compose spins up all containers, networks, and volumes with a single command, and manages their lifecycle together.

---

## Task 1: Install & Verify

### 1. Check if Docker Compose is installed

- For Docker Compose v2 (integrated CLI):
    ```sh
    docker compose version
    ```
- For legacy Docker Compose v1:
    ```sh
    docker-compose version
    ```

### 2. Example Output

```
Docker Compose version v2.5.0
```

*(Screenshot output here)*

---

## Task 2: Your First Compose File

### 1. Create Folder

```sh
mkdir compose-basics
cd compose-basics
```

### 2. Create docker-compose.yml

```yaml name=2026/day-33/compose-basics/docker-compose.yml
version: '3.8'
services:
  web:
    image: nginx:alpine
    ports:
      - "8080:80"
```

### 3. Start and Access

```sh
docker compose up
# or detached: docker compose up -d
```
- Open browser: `http://localhost:8080` — see Nginx default page.

### 4. Stop

```sh
docker compose down
```

*(Screenshot browser and terminal output)*

---

## Task 3: Two-Container Setup: WordPress + MySQL

### 1. Create Folder

```sh
mkdir compose-wordpress
cd compose-wordpress
```

### 2. docker-compose.yml

```yaml name=2026/day-33/compose-wordpress/docker-compose.yml
version: '3.8'
services:
  db:
    image: mysql:8
    restart: always
    environment:
      MYSQL_ROOT_PASSWORD: root
      MYSQL_DATABASE: wpdb
      MYSQL_USER: wpuser
      MYSQL_PASSWORD: wppass
    volumes:
      - wp-data:/var/lib/mysql

  wordpress:
    image: wordpress:latest
    restart: always
    ports:
      - "8081:80"
    environment:
      WORDPRESS_DB_HOST: db
      WORDPRESS_DB_NAME: wpdb
      WORDPRESS_DB_USER: wpuser
      WORDPRESS_DB_PASSWORD: wppass

volumes:
  wp-data:
```

### 3. Start, Setup, and Verify

```sh
docker compose up
# detached: docker compose up -d
```

- Open browser: `http://localhost:8081`
- Complete WordPress setup, create a post/page.

### 4. Stop, Restart, Verify Data

```sh
docker compose down
docker compose up -d
# Is WordPress data still there? (Yes, volume preserves it)
```

*(Screenshot proof, e.g., after restart your post/page remains)*

---

## Task 4: Compose Commands Practice

| Command                          | What it Does                                |
|-----------------------------------|----------------------------------------------|
| `docker compose up`               | Start services (in foreground)               |
| `docker compose up -d`            | Start services (detached/background)         |
| `docker compose ps`               | List running services                        |
| `docker compose logs -f`          | View all service logs (follow/live)          |
| `docker compose logs -f wordpress`| View logs for one service                    |
| `docker compose stop`             | Stop containers, but don’t remove them       |
| `docker compose down`             | Stop and remove containers, networks, volumes|
| `docker compose build`            | Rebuild images if Dockerfile changed         |

**Demo:**
```sh
docker compose up -d            # start detached
docker compose ps               # list running
docker compose logs -f          # live logs
docker compose logs -f db       # logs for MySQL
docker compose stop             # stop containers
docker compose up               # restart (if stopped)
docker compose down             # remove everything, but named volumes
docker compose build            # rebuild custom images
```
*(Screenshot output for each command)*

---

## Task 5: Environment Variables

### 1. Directly in Compose YAML

```yaml name=2026/day-33/compose-env-demo/docker-compose.yml
version: '3.8'
services:
  demo:
    image: alpine
    environment:
      GREETING: "Hello from Compose!"
    command: echo $GREETING
```

### 2. Using a .env File

**.env file (in same directory):**
```
GREETING=Hello from .env file!
```

**docker-compose.yml:**
```yaml name=2026/day-33/compose-env-demo/docker-compose.yml
version: '3.8'
services:
  demo:
    image: alpine
    environment:
      GREETING: ${GREETING}
    command: echo $GREETING
```

### 3. Run and Verify

```sh
docker compose up
# output should be: Hello from .env file!
```

*(Screenshot output)*

---

## Points to Remember

- Docker Compose lets you run **multi-container** apps with a single command.
- **Networks** and **volumes** are defined and managed automatically by Compose.
    - Every service gets a DNS name (service name), enabling intra-container communication.
- Compose files use YAML syntax, grouping services, volumes, networks, environment.
- Compose is ideal for local development, testing, and small app deployments.

---

## Key Tips

- Use `docker compose up -d` for background, `down` to tear down.
- **Service names in YAML become DNS aliases:** containers can ping/talk to each other by service name.
- Place sensitive environment variables in `.env` files — Compose loads them implicitly.
- Define shared volumes for persistent data.
- Change images or Dockerfiles? Run `docker compose build` then `up` to update.
- All Compose commands can be run from the folder holding your `docker-compose.yml`.

---

## Extra Tips

- You can add more services (like redis, postgres, etc.) for practice but above covers the required tasks.
- Compose automatically creates a network; service names are DNS names. WordPress using db for host is proof.
- .env file should live in same directory as docker-compose.yml
- Make sure all YAML is indented properly and follows Compose syntax.
---

## Final Takeaways

- Docker Compose streamlines multi-container setups, replacing manual volumes/networks with easy YAML declarations.
- Compose **volume persistence** and **service name networking** are essential for real-world apps.
- Compose is widely used for local dev/test, CI, and microservice orchestration.

---

# End of Day 33 🚀
