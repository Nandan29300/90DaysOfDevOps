# Task Manager API — Day 36 Docker Project

A minimal **Task Manager REST API** built with **Node.js + Express**, backed by **PostgreSQL** (persistent storage) and **Redis** (cache layer).  
Fully Dockerized with multi-stage build, non-root user, named volumes, custom networks, healthchecks, and `.env`-based configuration.

---

## Quick Start

```sh
git clone https://github.com/Nandan29300/90-days-of-devops
cd 2026/day-36

# Bring up the full stack
docker compose up --build -d

# Test the API
curl http://localhost:3000/health
curl http://localhost:3000/tasks
```

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/health` | Health probe |
| GET | `/tasks` | List all tasks (cached) |
| POST | `/tasks` | Create a task `{"title":"..."}` |
| PATCH | `/tasks/:id` | Update done status `{"done":true}` |
| DELETE | `/tasks/:id` | Delete a task |

## Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `PORT` | `3000` | API listen port |
| `DB_HOST` | `db` | Postgres hostname |
| `DB_NAME` | `taskdb` | Database name |
| `DB_USER` | `taskuser` | Database user |
| `DB_PASSWORD` | `taskpass` | Database password |
| `REDIS_HOST` | `redis` | Redis hostname |

## Docker Hub

```sh
docker pull nandan29300/day36-taskapi:latest
```
