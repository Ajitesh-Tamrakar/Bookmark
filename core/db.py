import logging
import re

from django.db import connection

logger = logging.getLogger(__name__)

# pgvector cannot build an HNSW index for vectors over this many dimensions
# (e.g. openai/text-embedding-3-large is 3072d — core.registry.EMBEDDING_REGISTRY).
# Storage has no such limit — only the index build does — so above this cap the
# column still resizes correctly and the index build is just skipped.
HNSW_MAX_DIMENSIONS = 2000

INDEX_NAME = "idx_chunks_embedding"


def _index_exists(cur):
    cur.execute(
        "SELECT 1 FROM pg_indexes WHERE tablename = 'chunks' AND indexname = %s;",
        [INDEX_NAME],
    )
    return cur.fetchone() is not None


def _current_column_dimension(cur):
    """Return chunks.embedding's current fixed dimension, or None if unconstrained.
    Uses Postgres's own format_type() (the same routine `\\d chunks` uses) rather
    than hand-decoding atttypmod, so this doesn't depend on assumptions about
    pgvector's internal typmod encoding."""
    cur.execute(
        """
        SELECT format_type(a.atttypid, a.atttypmod)
        FROM pg_attribute a
        JOIN pg_class c ON c.oid = a.attrelid
        WHERE c.relname = 'chunks' AND a.attname = 'embedding'
          AND a.attnum > 0 AND NOT a.attisdropped;
        """
    )
    row = cur.fetchone()
    if not row:
        return None
    match = re.match(r'^vector\((\d+)\)$', row[0])
    return int(match.group(1)) if match else None


def embedding_index_status():
    """Read-only snapshot: {'present': bool, 'dimension': int|None}. No writes —
    safe to call from a request handler (e.g. /retrieve/status/summary/)."""
    with connection.cursor() as cur:
        return {"present": _index_exists(cur), "dimension": _current_column_dimension(cur)}


def ensure_embedding_index(dimension):
    """Idempotently make chunks.embedding a fixed vector(dimension) column with a
    matching HNSW index (skipping the index, with a warning, if dimension exceeds
    HNSW_MAX_DIMENSIONS). Cheap no-op if already in the target state — safe to call
    unconditionally on every container boot without rebuilding a large index on
    every restart.

    Callers must ensure the table has no existing embeddings whose dimension
    differs from `dimension` before calling this — pgvector's ALTER COLUMN TYPE
    vector(N) hard-fails otherwise. `reembed` clears embeddings first; migration
    0017 checks existing data before calling this.
    """
    if dimension is None:
        return {"action": "skipped", "dimension": None, "index_built": False}

    wants_index = dimension <= HNSW_MAX_DIMENSIONS
    status = embedding_index_status()

    if status["dimension"] == dimension and status["present"] == wants_index:
        logger.info(
            "ensure_embedding_index: chunks.embedding already vector(%s) (index present=%s); skipping.",
            dimension, status["present"],
        )
        return {"action": "skipped", "dimension": dimension, "index_built": status["present"]}

    with connection.cursor() as cur:
        cur.execute(f"DROP INDEX IF EXISTS {INDEX_NAME};")
        cur.execute(f"ALTER TABLE chunks ALTER COLUMN embedding TYPE vector({dimension});")
        if wants_index:
            cur.execute(
                f"CREATE INDEX IF NOT EXISTS {INDEX_NAME} ON chunks USING hnsw (embedding vector_cosine_ops);"
            )
        else:
            logger.warning(
                "ensure_embedding_index: dimension %s exceeds HNSW_MAX_DIMENSIONS (%s); "
                "column resized but index NOT built — search will use a sequential scan.",
                dimension, HNSW_MAX_DIMENSIONS,
            )

    logger.info("ensure_embedding_index: resized to vector(%s); index_built=%s.", dimension, wants_index)
    return {"action": "rebuilt", "dimension": dimension, "index_built": wants_index}
