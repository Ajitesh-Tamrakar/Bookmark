import logging
import re

from django.db import connection
from django.utils.timezone import now as timezone_now

from core.models import WorkerStatus

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


def find_unembedded_complete_bookmark_ids(Bookmark):
    """IDs of 'complete' bookmarks that still have at least one chunk with a NULL
    embedding -- the B-23 invariant violation: search only matches on embeddings,
    so these are permanently invisible while the UI reports them as finished.
    Takes the Bookmark model class as a parameter so this runs unchanged against
    either the live model or a migration's historical model."""
    return list(
        Bookmark.objects.filter(processing_status='complete', chunk__embedding__isnull=True)
        .distinct()
        .values_list('id', flat=True)
    )


def repair_unembedded_complete_bookmarks(Bookmark):
    """Requeue every 'complete' bookmark with unembedded chunks back to 'pending' so
    the worker's normal pipeline reprocesses it from scratch. Idempotent -- no-ops
    once nothing matches. Returns the list of repaired bookmark IDs."""
    ids = find_unembedded_complete_bookmark_ids(Bookmark)
    if ids:
        Bookmark.objects.filter(id__in=ids).update(
            processing_status='pending',
            current_step=None,
            processing_started_at=None,
            processed_at=None,
            retry_count=0,
            failed_at=None,
            processing_error='Requeued by repair_unembedded_complete_bookmarks: '
                              'was complete with unembedded chunks.',
        )
    return ids


WORKER_ALIVE_THRESHOLD_SEC = 120


def record_worker_idle():
    """Called by the worker loop on every idle tick (no pending work). Direct ORM write from the
    worker's own DB connection -- no HTTP hop through the backend."""
    WorkerStatus.objects.update_or_create(
        id=1, defaults={'state': WorkerStatus.State.IDLE, 'current_bookmark_id': None},
    )


def record_worker_working(bookmark_id):
    """Called when the worker claims a bookmark, and again at every pipeline stage boundary for
    that bookmark, so a hang stuck inside one stage eventually shows up as stale rather than
    looking identical to a bookmark that's just legitimately slow (e.g. a large video)."""
    WorkerStatus.objects.update_or_create(
        id=1, defaults={'state': WorkerStatus.State.WORKING, 'current_bookmark_id': bookmark_id},
    )


def worker_status():
    """Read-only snapshot for /pipeline/status/: {'state', 'current_bookmark_id', 'updated_at',
    'alive'}. 'alive' is a freshness check against WORKER_ALIVE_THRESHOLD_SEC (is the worker still
    ticking), not a live OS-level process check."""
    try:
        status = WorkerStatus.objects.get(id=1)
    except WorkerStatus.DoesNotExist:
        return {'state': None, 'current_bookmark_id': None, 'updated_at': None, 'alive': False}

    alive = (timezone_now() - status.updated_at).total_seconds() < WORKER_ALIVE_THRESHOLD_SEC
    return {
        'state': status.state,
        'current_bookmark_id': str(status.current_bookmark_id) if status.current_bookmark_id else None,
        'updated_at': status.updated_at.isoformat(),
        'alive': alive,
    }
