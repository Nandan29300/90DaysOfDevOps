import os
import time
import redis
import psycopg2
from flask import Flask, jsonify

app = Flask(__name__)

# ── Redis ──────────────────────────────────────────────────────────────────────
redis_client = redis.Redis(
    host=os.environ.get("REDIS_HOST", "redis"),
    port=6379,
    decode_responses=True,
)

# ── Postgres ───────────────────────────────────────────────────────────────────
def get_db():
    return psycopg2.connect(
        host=os.environ.get("DB_HOST", "db"),
        port=5432,
        dbname=os.environ.get("DB_NAME", "appdb"),
        user=os.environ.get("DB_USER", "appuser"),
        password=os.environ.get("DB_PASSWORD", "apppass"),
    )


def init_db():
    """Create the visits table if it doesn't exist yet."""
    retries = 5
    while retries:
        try:
            conn = get_db()
            cur = conn.cursor()
            cur.execute(
                """
                CREATE TABLE IF NOT EXISTS visits (
                    id      SERIAL PRIMARY KEY,
                    visited_at TIMESTAMP DEFAULT NOW()
                );
                """
            )
            conn.commit()
            cur.close()
            conn.close()
            return
        except Exception as e:
            retries -= 1
            print(f"DB not ready, retrying… ({e})")
            time.sleep(2)


init_db()


# ── Routes ─────────────────────────────────────────────────────────────────────
@app.route("/")
def index():
    # 1. Increment a hit-counter in Redis
    hits = redis_client.incr("hits")

    # 2. Log this visit to Postgres
    conn = get_db()
    cur = conn.cursor()
    cur.execute("INSERT INTO visits DEFAULT VALUES;")
    conn.commit()

    # 3. Read total visits from Postgres
    cur.execute("SELECT COUNT(*) FROM visits;")
    total = cur.fetchone()[0]
    cur.close()
    conn.close()

    return jsonify(
        message="Hello from the Flask app!",
        redis_hits=hits,
        postgres_visits=total,
    )


@app.route("/health")
def health():
    return jsonify(status="ok"), 200


if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000)
