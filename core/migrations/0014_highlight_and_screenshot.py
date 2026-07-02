from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("core", "0013_bookmark_user_note"),
    ]

    operations = [
        migrations.AddField(
            model_name="bookmark",
            name="has_highlight",
            field=models.BooleanField(default=False),
        ),
        migrations.AddField(
            model_name="bookmark",
            name="has_screenshot",
            field=models.BooleanField(default=False),
        ),
        migrations.AlterField(
            model_name="chunk",
            name="chunk_type",
            field=models.CharField(
                choices=[
                    ("article", "Article"),
                    ("video", "Video"),
                    ("audio", "Audio"),
                    ("image", "Image"),
                    ("post", "Post"),
                    ("highlight", "Highlight"),
                    ("screenshot", "Screenshot"),
                    ("note", "Note"),
                ],
                max_length=50,
            ),
        ),
    ]
