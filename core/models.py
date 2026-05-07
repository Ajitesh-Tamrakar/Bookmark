from django.db import models
import uuid
# Create your models here.
class bookmark(models.Model):

    class Platform(models.TextChoices):
        YOUTUBE = 'youtube', 'YouTube'
        LINKEDIN = 'linkedin', 'LinkedIn'
        PINTEREST = 'pinterest', 'Pinterest'
        TWITTER = 'twitter', 'Twitter/X'
        WEB = 'web', 'Web'

    class ContentType(models.TextChoices):
        VIDEO      = 'video',      'Video'
        ARTICLE    = 'article',    'Article'
        POST       = 'post',       'Post'
        IMAGE_PAGE = 'image_page', 'Image Page'
        WEB_PAGE   = 'web_page',   'Web Page'

    class Processing_Status(models.TextChoices):
        PENDING    = 'pending',    'Pending'
        PROCESSING = 'processing', 'Processing'
        COMPLETE   = 'complete',   'Complete'
        FAILED     = 'failed',     'Failed'
    
    class CaptureMethod(models.TextChoices):
        PLATFORM_INJECTION = 'platform_injection', 'Platform Injection'
        TOOLBAR_POPUP      = 'toolbar_popup',      'Toolbar Popup'
        CONTEXT_MENU       = 'context_menu',       'Context Menu'

    class TranscriptSource(models.TextChoices):
        API     = 'api',     'YouTube Transcript API'
        WHISPER = 'whisper', 'Whisper (local)'


    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    url = models.TextField(null=False)
    title = models.CharField(max_length=255, null=True, blank=True)
    platform = models.CharField(max_length=50, choices=Platform.choices)
    content_type = models.CharField(max_length=50, choices= ContentType.choices )
    processing_status = models.CharField(max_length=50, choices=Processing_Status.choices, default=Processing_Status.PENDING)
    processing_error = models.TextField(null=True, blank=True)
    retry_count = models.IntegerField(default=0)
    capture_method = models.CharField(max_length=50, choices=CaptureMethod.choices, null=True, blank=True)     
    raw_text = models.TextField(null=True, blank=True)
    author = models.CharField(max_length=100, null=True, blank=True)
    transcript_source = models.CharField(max_length=50, choices=TranscriptSource.choices, null=True, blank=True)
    saved_at = models.DateTimeField(auto_now_add=True)
    processed_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        db_table = 'bookmarks'