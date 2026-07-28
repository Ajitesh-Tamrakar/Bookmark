import logging

from django.db import migrations

from core.db import ensure_embedding_index

logger = logging.getLogger(__name__)


def rebuild_chunk_embedding_index(apps, schema_editor):
    """
    Migration 0015 dropped idx_chunks_embedding and widened chunks.embedding to
    an unconstrained `vector` so the real per-install dimension (which depends
    on the embedding provider/model chosen at setup -- see
    core.registry.EMBEDDING_REGISTRY) could be applied later. The only code
    that ever rebuilt the index (core.views.setup_embedding) only runs during
    first-time setup, so any install that had ALREADY completed setup before
    this migration runs never got its index rebuilt -- search silently fell
    back to a full sequential scan, permanently, with no error or signal.

    This migration rebuilds the index (fixed-dimension column + HNSW index) for
    any install where the dimension is already known and consistent. It is
    deliberately conservative about *when* it acts:

      - No Config row yet, or Config.embedding_dimensions is None: this is a
        pre-setup (or brand new) install. There's nothing to fix -- the normal
        setup flow (core.views.setup_embedding) will size the column correctly
        the first time setup completes. No-op.

      - Config row exists with a known embedding_dimensions, but at least one
        existing chunk's embedding has a *different* actual dimension (a
        mixed-dimension table): altering the column would hard-fail (pgvector
        rejects ALTER COLUMN TYPE vector(N) if any existing row doesn't already
        conform to N). Rather than crash the migration -- which would block the
        whole app from starting -- this logs a warning and no-ops, leaving
        today's already-degraded (but at least *working*) sequential-scan
        search in place.

      - Otherwise (dimension known and every existing embedding already
        matches it, or there are no embeddings yet): call the same
        core.db.ensure_embedding_index helper used by setup_embedding and
        reembed, so the column/index end up exactly as they would from a
        fresh setup.
    """
    Config = apps.get_model('core', 'Config')  # historical model: no custom
                                                # classmethods like Config.get()

    config = Config.objects.filter(id=1).first()
    dimension = config.embedding_dimensions if config else None

    with schema_editor.connection.cursor() as cur:
        if dimension is None:
            # No Config row, or setup never got far enough to record a
            # dimension. Fall back to inferring it from real data, if any
            # already exists (covers unusual states where Config.
            # embedding_dimensions is unset despite embedded chunks existing).
            cur.execute(
                "SELECT vector_dims(embedding) FROM chunks "
                "WHERE embedding IS NOT NULL LIMIT 1;"
            )
            row = cur.fetchone()
            dimension = row[0] if row else None

        if dimension is None:
            logger.info(
                "0017_rebuild_chunk_embedding_index: no embedding dimension "
                "known yet (pre-setup install) -- nothing to do."
            )
            return

        cur.execute(
            "SELECT COUNT(*) FROM chunks "
            "WHERE embedding IS NOT NULL AND vector_dims(embedding) != %s;",
            [dimension],
        )
        mismatched = cur.fetchone()[0]

    if mismatched:
        logger.warning(
            "0017_rebuild_chunk_embedding_index: %d chunk(s) have an embedding "
            "dimension different from the expected %d -- skipping index "
            "rebuild to avoid a hard failure. Search will keep using a "
            "sequential scan until this is resolved, e.g. via "
            "`python manage.py reembed`.",
            mismatched, dimension,
        )
        return

    ensure_embedding_index(dimension)


class Migration(migrations.Migration):

    dependencies = [
        ("core", "0016_chunk_metadata_type"),
    ]

    operations = [
        migrations.RunPython(
            rebuild_chunk_embedding_index,
            reverse_code=migrations.RunPython.noop,
        ),
    ]
