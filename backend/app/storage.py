import json
import os
import sqlite3
from pathlib import Path


def db_path() -> Path:
    configured = Path(os.getenv("APP_DB_PATH", "data/plans.db"))
    return configured if configured.is_absolute() else Path(__file__).resolve().parents[1] / configured


def connect() -> sqlite3.Connection:
    path = db_path()
    path.parent.mkdir(parents=True, exist_ok=True)
    connection = sqlite3.connect(path)
    connection.row_factory = sqlite3.Row
    connection.execute(
        "CREATE TABLE IF NOT EXISTS plans (id TEXT PRIMARY KEY, created_at TEXT NOT NULL, current_date TEXT NOT NULL, task_count INTEGER NOT NULL, summary TEXT NOT NULL, payload TEXT NOT NULL)"
    )
    return connection


def save_plan(plan: dict) -> None:
    tasks = plan["tasks"]
    upcoming = [task["title"] for task in tasks if task["bucket"] in {"Do Today", "This Week"}]
    fallback = [task["title"] for task in tasks]
    summary = ", ".join((upcoming or fallback)[:2]) if tasks else "No tasks identified"
    with connect() as connection:
        connection.execute(
            "INSERT OR REPLACE INTO plans (id, created_at, current_date, task_count, summary, payload) VALUES (?, ?, ?, ?, ?, ?)",
            (plan["id"], plan["created_at"], plan["current_date"], len(tasks), summary, json.dumps(plan)),
        )


def list_plans() -> list[dict]:
    with connect() as connection:
        rows = connection.execute(
            "SELECT id, created_at, current_date, task_count, summary FROM plans ORDER BY created_at DESC LIMIT 20"
        ).fetchall()
    return [dict(row) for row in rows]


def get_plan(plan_id: str) -> dict | None:
    with connect() as connection:
        row = connection.execute("SELECT payload FROM plans WHERE id = ?", (plan_id,)).fetchone()
    return json.loads(row["payload"]) if row else None
