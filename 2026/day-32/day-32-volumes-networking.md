# Day 32 – Docker Volumes & Networking

---

## Task 1: The Problem – Data Persistence

### 1. Run a Database Container (MySQL Example)

```sh
docker run --name temp-mysql -e MYSQL_ROOT_PASSWORD=root -d mysql:8
```

### 2. Create Some Data

- Connect:
  ```sh
  docker exec -it temp-mysql mysql -u root -p
  # Enter password: root
  ```
- In the MySQL shell:
  ```sql
  CREATE DATABASE testdb;
  USE testdb;
  CREATE TABLE users (id INT PRIMARY KEY, name VARCHAR(30));
  INSERT INTO users VALUES (1, 'Alice'), (2, 'Bob');
  exit;
  ```

### 3. Stop and Remove the Container

```sh
docker stop temp-mysql
docker rm temp-mysql
```

### 4. Run a New Container

```sh
docker run --name new-mysql -e MYSQL_ROOT_PASSWORD=root -d mysql:8
docker exec -it new-mysql mysql -u root -p
# Enter password: root
```
- Try `USE testdb;` — Result: **Database does NOT exist. Data is gone.**

### 5. Write What Happened and Why

> Containers are ephemeral: their filesystem and any data generated inside is deleted when the container is removed.  
> Unless you use a volume or mount, ALL data is lost!

---

## Task 2: Named Volumes

### 1. Create a Named Volume

```sh
docker volume create dbdata
docker volume ls
# Shows: dbdata
```

### 2. Run MySQL with the Named Volume

```sh
docker run --name mysql-vol \
 -e MYSQL_ROOT_PASSWORD=root \
 -v dbdata:/var/lib/mysql \
 -d mysql:8
```

### 3. Add Data

- As before:
  ```sh
  docker exec -it mysql-vol mysql -u root -p
  # Enter password: root
  CREATE DATABASE testdb;
  USE testdb;
  CREATE TABLE users (id INT PRIMARY KEY, name VARCHAR(30));
  INSERT INTO users VALUES (1, 'Alice'), (2, 'Bob');
  exit;
  ```

### 4. Stop and Remove the Container

```sh
docker stop mysql-vol
docker rm mysql-vol
```

### 5. Run a NEW Container Using the Same Volume

```sh
docker run --name mysql-vol2 \
 -e MYSQL_ROOT_PASSWORD=root \
 -v dbdata:/var/lib/mysql \
 -d mysql:8

docker exec -it mysql-vol2 mysql -u root -p
# Enter password: root
USE testdb;
SELECT * FROM users;
```
- **Result:** Data is still there!

### 6. Verify Volume

```sh
docker volume inspect dbdata
```

---

## Task 3: Bind Mounts

### 1. Create a Host Folder with `index.html`

```sh
mkdir -p ~/docker-mount/web
echo '<h1>Hello from a bind mount!</h1>' > ~/docker-mount/web/index.html
```

### 2. Run Nginx with Bind Mount

```sh
docker run --name nginx-bind \
 -v ~/docker-mount/web:/usr/share/nginx/html \
 -p 8080:80 \
 -d nginx:alpine
```

### 3. Access the Page

- Open browser to `http://localhost:8080`
- Should see “Hello from a bind mount!”

### 4. Edit index.html

```sh
echo '<h1>Edited live from the host!</h1>' > ~/docker-mount/web/index.html
```
- Refresh browser — text updates instantly!

### 5. Write: Difference between Named Volume and Bind Mount

> - **Named Volumes:** Managed by Docker, usually stored under `/var/lib/docker/volumes/`, persistent but not tied directly to host filesystem, better for data managed by the container.
> - **Bind Mounts:** Direct mapping between a host folder and container folder—changes reflect instantly both ways, great for live development or host access.

---

## Task 4: Docker Networking Basics

### 1. List All Docker Networks

```sh
docker network ls
```
**Example Output:**
```
NETWORK ID     NAME      DRIVER    SCOPE
c12048c2b4b6   bridge    bridge    local
...
```

### 2. Inspect the Default Bridge Network

```sh
docker network inspect bridge
```
- Shows settings, subnet, attached containers, etc.

### 3. Run Two Containers on Default Bridge

```sh
docker run -d --name alpine1 alpine sleep 1000
docker run -d --name alpine2 alpine sleep 1000
```

#### Can They Ping Each Other by Name?

```sh
docker exec alpine1 ping alpine2
# "ping: unknown host" (default bridge doesn't resolve container names)
```

#### Can They Ping Each Other by IP?

- Find IPs:
  ```sh
  docker inspect alpine2 | grep IPAddress
  ```
- Then:
  ```sh
  docker exec alpine1 ping <alpine2-IP>
  # Success! Containers can ping by IP.
  ```

---

## Task 5: Custom Networks

### 1. Create a Custom Bridge Network

```sh
docker network create my-app-net
docker network ls
# Shows: my-app-net
```

### 2. Run Two Containers on Custom Network

```sh
docker run -d --name net1 --network my-app-net alpine sleep 1000
docker run -d --name net2 --network my-app-net alpine sleep 1000
```

### 3. Can They Ping Each Other by Name?

```sh
docker exec net1 ping net2
# Success! Custom bridge network supports name-resolution.
```

### 4. Write: Why does custom networking allow name-based communication but the default bridge doesn't?

> The **default bridge** network does NOT enable automatic DNS; containers can't resolve each other's names by default.  
> **Custom bridge networks** provide built-in DNS for containers — any container started on a custom bridge can resolve others by name, which is crucial for app communication in microservices.

---

## Task 6: Put It All Together

### 1. Create a Custom Network

```sh
docker network create my-dev-net
```
### 2. Run a Database (MySQL) with Volume on That Network

```sh
docker volume create devdata
docker run -d --name mydb --network my-dev-net \
   -e MYSQL_ROOT_PASSWORD=root \
   -v devdata:/var/lib/mysql \
   mysql:8
```

### 3. Run an App Container (use Alpine for simplicity) on Same Network

```sh
docker run -it --rm --name myapp --network my-dev-net alpine sh
# Inside container:
apk add --no-cache mysql-client
mysql -h mydb -u root -p
# Enter password: root
# Should connect to the MySQL running in mydb container by name (mydb)!
```

---

## Useful Commands Cheat Sheet

| Command                              | Description                         |
|-------------------------------------- |------------------------------------- |
| `docker volume create`                | Create a named persistent volume     |
| `docker volume ls`                    | List volumes                        |
| `docker volume inspect <name>`        | Inspect a volume                    |
| `docker run -v volume:/path`          | Attach volume to container          |
| `docker run -v /host/path:/cont/path` | Bind mount host folder              |
| `docker network create <name>`        | Create a custom network             |
| `docker network ls`                   | List all networks                   |
| `docker network inspect <name>`       | Inspect network details             |
| `docker run --network <name>`         | Launch container on custom network  |
| `docker exec <name> ping <other>`     | Check name-based communication      |
| `docker exec <name> <command>`        | Run command in running container    |

---

## Key Points

- **Volumes** persist data outside containers — essential for databases, config, uploads.
- **Bind mounts** connect host folders directly to containers — great for local development.
- **Default bridge networks** don’t support name-based communication; custom bridges do.
- **Custom networks** are how real microservices communicate reliably.
- **For production:** always use named volumes AND custom bridge networks for stable, secure, scalable container setups!

---


