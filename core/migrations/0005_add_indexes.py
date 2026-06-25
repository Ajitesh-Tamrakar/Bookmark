from django.db import migrations

class Migration(migrations.Migration):
    dependencies = [
        ('core', '0004_add_embedding_column')
    ]

    operations = [
        migrations.RunSQL(
            sql='CREATE INDEX IF NOT EXISTS idx_chunks_bookmark_id ON chunks(bookmark_id);',
            reverse_sql='DROP INDEX IF EXISTS idx_chunks_bookmark_id;'
        ),
        migrations.RunSQL(
            sql='CREATE INDEX IF NOT EXISTS idx_chunks_type ON chunks(chunk_type);',
            reverse_sql='DROP INDEX IF EXISTS idx_chunks_type;'
        ),
        migrations.RunSQL(
            sql="CREATE INDEX IF NOT EXISTS idx_bookmarks_tags_tag_id ON bookmark_tags(tag_id);",
            reverse_sql="DROP INDEX IF EXISTS idx_bookmarks_tags_tag_id;"
        ),
        migrations.RunSQL(
            sql='CREATE INDEX IF NOT EXISTS idx_bookmarks_platform ON bookmarks(platform);',
            reverse_sql='DROP INDEX IF EXISTS idx_bookmarks_platform;'
        ),
        migrations.RunSQL(
            sql="CREATE INDEX IF NOT EXISTS idx_bookmarks_status ON bookmarks(processing_status);",
            reverse_sql="DROP INDEX IF EXISTS idx_bookmarks_status;"
        ),
        migrations.RunSQL(
            sql="CREATE INDEX IF NOT EXISTS idx_chunks_embedding ON chunks USING hnsw (embedding vector_cosine_ops);",
            reverse_sql="DROP INDEX IF EXISTS idx_chunks_embedding;"
        ),
    ]
