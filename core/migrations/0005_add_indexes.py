from django.db import migrations

class Migration(migrations.Migration):
    dependencies = [
        ('core', '0004_add_embedding_column')
    ]


    operations = [
        #Lookup chunks by parent bookmark (used in deletion and export)
        migrations.RunSQL(
            sql='CREATE INDEX idx_chunks_bookmark_id ON chunks(bookmark_id);',
            reverse_sql='DROP INDEX IF EXISTS idx_chunks_bookmark_id;'
        ),

        #Filter chunk by type (used in type-specific queries)

        migrations.RunSQL(
            sql= 'CREATE INDEX idx_chunks_type ON chunks(chunk_type);',
            reverse_sql='DROP INDEX IF EXISTS idx_chunks_type;'
        ),

        #Lookup bookmarks by tag (used in filter by tag)
        migrations.RunSQL(
            sql= "CREATE INDEX idx_bookmarks_tags_tag_id ON bookmark_tags(tag_id);",
            reverse_sql= "DROP INDEX IF EXISTS idx_bookmarks_tags_tag_id;"
        ),

        #Filter library by platform 
        migrations.RunSQL(
            sql='CREATE INDEX idx_bookmarks_platform ON bookmarks(platform);',
            reverse_sql='DROP INDEX IF EXISTS idx_bookmarks_platform;'
        ),

        #Filter pending/failed items for processing

        migrations.RunSQL(
            sql="CREATE INDEX idx_bookmarks_status ON bookmarks(processing_status);",
            reverse_sql="DROP INDEX IF EXISTS idx_bookmarks_status;"
        ),

        #Vector similarity search -HNSW approximate nearest neighbour

        migrations.RunSQL(
            sql="CREATE INDEX idx_chunks_embedding ON chunks USING hnsw (embedding vector_cosine_ops);",
            reverse_sql="DROP INDEX IF EXISTS idx_chunks_embedding;"
        )
    ]