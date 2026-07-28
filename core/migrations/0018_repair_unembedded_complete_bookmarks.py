import logging

from django.db import migrations

from core.db import repair_unembedded_complete_bookmarks

logger = logging.getLogger(__name__)


def repair(apps, schema_editor):
    """One-time self-heal for the B-23 invariant violation: a 'complete' bookmark
    with at least one unembedded chunk (invisible to search despite showing as
    finished). Existing installs may already have rows in this state from before
    the run_pipeline invariant check (process/pipeline.py, added alongside this
    migration) existed. Requeues them as 'pending' so the worker's normal
    pipeline picks them back up. Idempotent -- no-ops if nothing matches.

    This only catches rows that already exist at upgrade time; run_worker.py
    also calls the same helper on every worker boot to catch anything created
    afterward (e.g. by retrieve.views.bookmark_note's out-of-pipeline re-embed).
    """
    Bookmark = apps.get_model('core', 'Bookmark')  # historical model
    ids = repair_unembedded_complete_bookmarks(Bookmark)
    if ids:
        logger.warning(
            '0018_repair_unembedded_complete_bookmarks: requeued %d bookmark(s) as pending: %s',
            len(ids), ids,
        )


class Migration(migrations.Migration):

    dependencies = [
        ("core", "0017_rebuild_chunk_embedding_index"),
    ]

    operations = [
        migrations.RunPython(repair, reverse_code=migrations.RunPython.noop),
    ]
