const express = require("express");
const { Pool }  = require("pg");
const { createClient } = require("redis");

const app  = express();
app.use(express.json());

// ── PostgreSQL ────────────────────────────────────────────────────────────────
const pool = new Pool({
  host:     process.env.DB_HOST     || "db",
  port:     parseInt(process.env.DB_PORT || "5432"),
  database: process.env.DB_NAME     || "taskdb",
  user:     process.env.DB_USER     || "taskuser",
  password: process.env.DB_PASSWORD || "taskpass",
});

// ── Redis ─────────────────────────────────────────────────────────────────────
const cache = createClient({
  socket: { host: process.env.REDIS_HOST || "redis", port: 6379 },
});
cache.on("error", (err) => console.error("Redis error:", err));

// ── DB Bootstrap ──────────────────────────────────────────────────────────────
async function initDB() {
  let retries = 10;
  while (retries--) {
    try {
      await pool.query(`
        CREATE TABLE IF NOT EXISTS tasks (
          id          SERIAL PRIMARY KEY,
          title       TEXT    NOT NULL,
          done        BOOLEAN NOT NULL DEFAULT FALSE,
          created_at  TIMESTAMPTZ DEFAULT NOW()
        );
      `);
      console.log("✅  Database ready");
      return;
    } catch (err) {
      console.log(`⏳  DB not ready, retrying… (${retries} left)`);
      await new Promise((r) => setTimeout(r, 2000));
    }
  }
  throw new Error("Could not connect to database after multiple retries");
}

// ── Routes ────────────────────────────────────────────────────────────────────

// Health probe — used by Docker healthcheck
app.get("/health", (_req, res) => res.json({ status: "ok" }));

// GET /tasks — list all tasks (cache-aside with Redis)
app.get("/tasks", async (_req, res) => {
  try {
    const cached = await cache.get("tasks:all");
    if (cached) {
      return res.json({ source: "cache", tasks: JSON.parse(cached) });
    }
    const { rows } = await pool.query("SELECT * FROM tasks ORDER BY id;");
    await cache.setEx("tasks:all", 30, JSON.stringify(rows)); // cache 30s
    res.json({ source: "db", tasks: rows });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /tasks — create a task
app.post("/tasks", async (req, res) => {
  const { title } = req.body;
  if (!title) return res.status(400).json({ error: "title is required" });
  try {
    const { rows } = await pool.query(
      "INSERT INTO tasks (title) VALUES ($1) RETURNING *;",
      [title]
    );
    await cache.del("tasks:all"); // invalidate cache
    res.status(201).json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PATCH /tasks/:id — mark task done/undone
app.patch("/tasks/:id", async (req, res) => {
  const { done } = req.body;
  try {
    const { rows } = await pool.query(
      "UPDATE tasks SET done=$1 WHERE id=$2 RETURNING *;",
      [done, req.params.id]
    );
    if (!rows.length) return res.status(404).json({ error: "Task not found" });
    await cache.del("tasks:all");
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE /tasks/:id — delete a task
app.delete("/tasks/:id", async (req, res) => {
  try {
    const { rowCount } = await pool.query(
      "DELETE FROM tasks WHERE id=$1;",
      [req.params.id]
    );
    if (!rowCount) return res.status(404).json({ error: "Task not found" });
    await cache.del("tasks:all");
    res.json({ message: "Task deleted" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── Start ─────────────────────────────────────────────────────────────────────
const PORT = process.env.PORT || 3000;

(async () => {
  await cache.connect();
  console.log("✅  Redis connected");
  await initDB();
  app.listen(PORT, () => console.log(`🚀  API listening on port ${PORT}`));
})();
