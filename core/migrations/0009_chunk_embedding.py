from django.db import migrations


class Migration(migrations.Migration):

    dependencies = [
        ('core', '0008_config_dev_mode'),
    ]

    operations = [
        migrations.RunSQL(
            sql="""
            ALTER TABLE chunks
            ADD COLUMN IF NOT EXISTS embedding vector(768);
            """,
            reverse_sql="""
            ALTER TABLE chunks
            DROP COLUMN IF EXISTS embedding;
            """
        ),
    ]