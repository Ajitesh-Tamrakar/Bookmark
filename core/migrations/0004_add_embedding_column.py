from django.db import migrations


def add_embedding_column(apps, schema_editor):
    with schema_editor.connection.cursor() as cursor:
        cursor.execute("SELECT embedding_dimensions FROM config WHERE id = 1")
        row = cursor.fetchone()

        if row is None:
            raise RuntimeError(
                "Config row not found. Run setup before this migration."
            )
        # row[0] is the embedding_dimensions value
        dimensions = 768 # Default to 768 if not set, as it's a common dimension for many embedding models

        if dimensions is None:
            raise RuntimeError(
                "embedding_dimension is not set in config. "
                "Complete setup and choose an embedding model first."
            )
        cursor.execute(
            f"ALTER TABLE chunks ADD COLUMN embedding vector({dimensions});"
        )

def remove_embedding_column(apps, schema_editor):
    with schema_editor.connection.cursor() as cursor:
        cursor.execute(
            "ALTER TABLE chunks DROP COLUMN IF EXISTS embedding;"
        )

class Migration(migrations.Migration):
    dependencies = [
        ('core', '0003_config_rename_bookmarktags_bookmarktag_and_more'),
    ]

    operations = [
        migrations.RunPython(
            add_embedding_column,
            reverse_code=remove_embedding_column
        ),
    ]