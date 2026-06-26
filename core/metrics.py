import json
import os
import platform
import shutil
import sqlite3
import subprocess
import uuid
from contextlib import contextmanager
from datetime import datetime, timezone

import psutil
from django.conf import settings

_session_id = None
_process_role = None


def _now_iso():
    return datetime.now(timezone.utc).isoformat()


def _get_connection():
    db_path = settings.METRICS_DB_PATH
    os.makedirs(os.path.dirname(db_path), exist_ok=True)
    conn = sqlite3.connect(db_path, timeout=5)
    conn.execute("PRAGMA journal_mode=WAL;")
    return conn


def _ensure_schema(conn):
    conn.execute("""
        CREATE TABLE IF NOT EXISTS system_info (
            session_id          TEXT PRIMARY KEY,
            recorded_at         TEXT NOT NULL,
            process_role        TEXT,
            os                  TEXT,
            os_version          TEXT,
            cpu_model           TEXT,
            cpu_cores_logical   INTEGER,
            ram_total_gb        REAL,
            gpu_model           TEXT,
            gpu_vram_gb         REAL,
            disk_free_gb        REAL,
            ollama_version      TEXT,
            embedding_model     TEXT,
            generation_model    TEXT,
            whisper_model       TEXT,
            app_version         TEXT
        )
    """)
    conn.execute("""
        CREATE TABLE IF NOT EXISTS events (
            id          TEXT PRIMARY KEY,
            session_id  TEXT NOT NULL,
            event_type  TEXT NOT NULL,
            level       TEXT NOT NULL,
            message     TEXT,
            payload     TEXT,
            started_at  TEXT,
            ended_at    TEXT,
            created_at  TEXT NOT NULL
        )
    """)
    conn.execute("CREATE INDEX IF NOT EXISTS idx_events_session ON events(session_id);")
    conn.execute("CREATE INDEX IF NOT EXISTS idx_events_type ON events(event_type);")
    conn.execute("CREATE INDEX IF NOT EXISTS idx_events_created ON events(created_at);")
    conn.commit()


def set_process_role(role: str):
    global _process_role
    _process_role = role


def init_session():
    global _session_id
    if _session_id is not None:
        return _session_id
    _session_id = str(uuid.uuid4())
    if not settings.METRICS_ENABLED:
        return _session_id
    try:
        conn = _get_connection()
        _ensure_schema(conn)
        conn.close()
    except Exception as e:
        print(f"[metrics] failed to create schema: {e}", flush=True)
        return _session_id
    try:
        specs = _capture_system_specs()
        conn = _get_connection()
        conn.execute(
            """INSERT INTO system_info (
                session_id, recorded_at, process_role, os, os_version,
                cpu_model, cpu_cores_logical, ram_total_gb,
                gpu_model, gpu_vram_gb, disk_free_gb, ollama_version,
                embedding_model, generation_model, whisper_model, app_version
            ) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)""",
            (_session_id, _now_iso(), _process_role, *specs),
        )
        conn.commit()
        conn.close()
    except Exception as e:
        print(f"[metrics] failed to write system_info: {e}", flush=True)
    return _session_id


def _capture_system_specs():
    try:
        from core.models import Config
        cfg = Config.objects.filter(id=1).first()
    except Exception:
        cfg = None
    return (
        platform.system(),
        platform.version(),
        platform.processor() or platform.machine(),
        os.cpu_count(),
        round(psutil.virtual_memory().total / (1024 ** 3), 2),
        *_detect_gpu(),
        round(shutil.disk_usage("/").free / (1024 ** 3), 2),
        _detect_ollama_version(),
        getattr(cfg, "embedding_model_name", None),
        getattr(cfg, "generation_model_name", None),
        getattr(cfg, "whisper_model_name", None),
        _detect_app_version(),
    )


def _detect_gpu():
    try:
        out = subprocess.check_output(
            ["nvidia-smi", "--query-gpu=name,memory.total", "--format=csv,noheader,nounits"],
            timeout=2,
        ).decode().strip()
        name, vram_mb = out.split(",")
        return name.strip(), round(float(vram_mb) / 1024, 2)
    except Exception:
        return None, None


def _detect_ollama_version():
    try:
        return subprocess.check_output(["ollama", "--version"], timeout=2).decode().strip()
    except Exception:
        return None


def _detect_app_version():
    try:
        return subprocess.check_output(
            ["git", "rev-parse", "--short", "HEAD"], timeout=2
        ).decode().strip()
    except Exception:
        return None


def log_event(event_type, level="info", message=None, payload=None,
               started_at=None, ended_at=None):
    if not settings.METRICS_ENABLED:
        return
    session_id = init_session()
    try:
        conn = _get_connection()
        conn.execute(
            """INSERT INTO events (
                id, session_id, event_type, level, message, payload,
                started_at, ended_at, created_at
            ) VALUES (?,?,?,?,?,?,?,?,?)""",
            (
                str(uuid.uuid4()), session_id, event_type, level, message,
                json.dumps(payload) if payload is not None else None,
                started_at, ended_at, _now_iso(),
            ),
        )
        conn.commit()
        conn.close()
    except Exception as e:
        print(f"[metrics] failed to log event: {e}", flush=True)


@contextmanager
def timed_event(event_type, message=None, payload=None):
    started = _now_iso()
    payload = payload if payload is not None else {}
    try:
        yield payload
        log_event(event_type, level="info", message=message,
                  payload=payload, started_at=started, ended_at=_now_iso())
    except Exception as e:
        payload["error"] = str(e)
        log_event(event_type, level="error", message=message,
                  payload=payload, started_at=started, ended_at=_now_iso())
        raise
