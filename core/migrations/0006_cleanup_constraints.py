from django.db import migrations


class Migration(migrations.Migration):

    dependencies = [
        ('core', '0005_add_indexes'),
    ]

    operations = [

        # --- DB-level defaults ---
        migrations.RunSQL(
            sql="ALTER TABLE bookmarks ALTER COLUMN saved_at SET DEFAULT now();",
            reverse_sql="ALTER TABLE bookmarks ALTER COLUMN saved_at DROP DEFAULT;"
        ),
        migrations.RunSQL(
            sql="ALTER TABLE bookmarks ALTER COLUMN retry_count SET DEFAULT 0;",
            reverse_sql="ALTER TABLE bookmarks ALTER COLUMN retry_count DROP DEFAULT;"
        ),
        migrations.RunSQL(
            sql="ALTER TABLE bookmarks ALTER COLUMN processing_status SET DEFAULT 'pending';",
            reverse_sql="ALTER TABLE bookmarks ALTER COLUMN processing_status DROP DEFAULT;"
        ),
        migrations.RunSQL(
            sql="ALTER TABLE chunks ALTER COLUMN is_note SET DEFAULT false;",
            reverse_sql="ALTER TABLE chunks ALTER COLUMN is_note DROP DEFAULT;"
        ),
        migrations.RunSQL(
            sql="ALTER TABLE chunks ALTER COLUMN created_at SET DEFAULT now();",
            reverse_sql="ALTER TABLE chunks ALTER COLUMN created_at DROP DEFAULT;"
        ),

        # --- Proper ON DELETE CASCADE for chunks ---
        migrations.RunSQL(
            sql="""
                ALTER TABLE chunks 
                DROP CONSTRAINT IF EXISTS chunks_bookmark_id_9c30be89_fk_bookmarks_id;
                ALTER TABLE chunks
                DROP CONSTRAINT IF EXISTS chunks_bookmark_id_fk;
                ALTER TABLE chunks
                ADD CONSTRAINT chunks_bookmark_id_fk
                FOREIGN KEY (bookmark_id) REFERENCES bookmarks(id) ON DELETE CASCADE;
            """,
            reverse_sql="""
                ALTER TABLE chunks DROP CONSTRAINT IF EXISTS chunks_bookmark_id_fk;
            """
        ),

        # --- Proper ON DELETE CASCADE for bookmark_tags ---
        migrations.RunSQL(
            sql="""
                ALTER TABLE bookmark_tags
                DROP CONSTRAINT IF EXISTS bookmark_tags_bookmark_id_89db5e43_fk_bookmarks_id;
                ALTER TABLE bookmark_tags
                DROP CONSTRAINT IF EXISTS bookmark_tags_bookmark_id_fk;
                ALTER TABLE bookmark_tags
                ADD CONSTRAINT bookmark_tags_bookmark_id_fk
                FOREIGN KEY (bookmark_id) REFERENCES bookmarks(id) ON DELETE CASCADE;
            """,
            reverse_sql="""
                ALTER TABLE bookmark_tags DROP CONSTRAINT IF EXISTS bookmark_tags_bookmark_id_fk;
            """
        ),

        # --- CHECK (id = 1) on config ---
        migrations.RunSQL(
            sql="""
                ALTER TABLE config 
                DROP CONSTRAINT IF EXISTS config_id_must_be_1;
                ALTER TABLE config 
                ADD CONSTRAINT config_id_must_be_1 CHECK (id = 1);
            """,
            reverse_sql="ALTER TABLE config DROP CONSTRAINT IF EXISTS config_id_must_be_1;"
        ),
    ]