from django.db import migrations
from pgvector.django import VectorField


class Migration(migrations.Migration):
    """
    The embedding dimension is no longer fixed at migration time — it depends on
    whichever embedding provider/model the user picks during setup (Ollama, OpenAI,
    Google all use different dimensions). The column is unconstrained here; it gets
    sized to a concrete vector(N) + HNSW index at setup-completion time in
    core.views.setup_embedding, and re-sized by the `reembed` management command if
    the user changes embedding model later.

    pgvector requires a fixed-dimension column to carry an HNSW index, so the index
    must be dropped before the column can be relaxed to an unconstrained `vector`.
    """

    dependencies = [
        ("core", "0014_highlight_and_screenshot"),
    ]

    operations = [
        migrations.RunSQL(
            sql="DROP INDEX IF EXISTS idx_chunks_embedding;",
            reverse_sql=(
                "CREATE INDEX IF NOT EXISTS idx_chunks_embedding "
                "ON chunks USING hnsw (embedding vector_cosine_ops);"
            ),
        ),
        migrations.RunSQL(
            sql="ALTER TABLE chunks ALTER COLUMN embedding TYPE vector;",
            reverse_sql="ALTER TABLE chunks ALTER COLUMN embedding TYPE vector(768);",
        ),
        migrations.AlterField(
            model_name="chunk",
            name="embedding",
            field=VectorField(dimensions=None, null=True, blank=True),
        ),
    ]
