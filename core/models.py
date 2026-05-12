from django.db import models
from pgvector.django import VectorField
import uuid
# Create your models here.
class Bookmark(models.Model):

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

    class Stages(models.TextChoices):
        EXTRACTION = 'extraction'
        TAGGING = 'tagging'
        CHUNKING = 'chunking'
        EMBEDDING = 'embedding'


    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    url = models.TextField(null=False)
    title = models.CharField(max_length=255, null=True, blank=True)
    platform = models.CharField(max_length=50, choices=Platform.choices)
    content_type = models.CharField(max_length=50, choices= ContentType.choices )
    processing_status = models.CharField(max_length=50, choices=Processing_Status.choices, default=Processing_Status.PENDING)
    processing_error = models.TextField(null=True, blank=True)
    retry_count = models.IntegerField(default=0)
    failed_at = models.CharField(null=True, choices=Stages)
    capture_method = models.CharField(max_length=50, choices=CaptureMethod.choices, null=True, blank=True)     
    raw_text = models.TextField(null=True, blank=True)
    author = models.CharField(max_length=100, null=True, blank=True)
    transcript_source = models.CharField(max_length=50, choices=TranscriptSource.choices, null=True, blank=True)
    saved_at = models.DateTimeField(auto_now_add=True)
    processed_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        db_table = 'bookmarks'

class Tag(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    name = models.CharField(max_length=50, null=False, blank=False, unique=True)

    class Meta:
        db_table = 'tags'

class BookmarkTag(models.Model):
    class Source(models.TextChoices):
        AI = 'ai', 'AI Generated'
        MANUAL = 'manual', 'Manually Added'

    bookmark = models.ForeignKey('Bookmark', on_delete=models.CASCADE, db_column='bookmark_id')
    tag = models.ForeignKey('Tag', on_delete=models.CASCADE, db_column='tag_id' )
    source = models.CharField(max_length=50, choices=Source.choices)

    class Meta:
        db_table = 'bookmark_tags'
        constraints = [
            models.UniqueConstraint(
                fields= ['bookmark', 'tag'],
                name = 'bookmark_tag'
            )
        ]

class Chunk(models.Model):
    class ChunkType(models.TextChoices):
        ARTICLE = 'article', 'Article'
        VIDEO   = 'video',   'Video'
        AUDIO   = 'audio',   'Audio'
        IMAGE   = 'image',   'Image'
        POST    = 'post',    'Post'
        NOTE    = 'note',    'Note'

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False )
    bookmark = models.ForeignKey('Bookmark', on_delete=models.CASCADE, db_column='bookmark_id')
    text = models.TextField(null=False)
    chunk_type = models.CharField(max_length=50, choices=ChunkType.choices)
    chunk_index = models.IntegerField(null=True, blank=True)
    timestamp_seconds = models.IntegerField(null=True, blank=True) #To Store youtube timestamps to jump to
    is_note = models.BooleanField(default=False)
    word_count = models.IntegerField()
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'chunks'
        ordering = ['chunk_index']

class Config(models.Model):
    
    class EmbeddingProvider(models.TextChoices):
        OLLAMA = 'ollama', 'Ollama'
        OPENAI = 'openai', 'OpenAI'
        GOOGLE = 'google', 'Google'

    class GenerationProvider(models.TextChoices):
        OLLAMA    = 'ollama',    'Ollama'
        OPENAI    = 'openai',    'OpenAI'
        ANTHROPIC = 'anthropic', 'Anthropic'
        GOOGLE    = 'google',    'Google'

    class WhisperModel(models.TextChoices):
        TINY   = 'tiny',   'Tiny'
        BASE   = 'base',   'Base'
        SMALL  = 'small',  'Small'
        MEDIUM = 'medium', 'Medium'
        LARGE  = 'large',  'Large'
    
    id = models.IntegerField(primary_key=True, default=1)
    
    #Embedding -- locked after setup 
    embedding_provider = models.CharField(max_length=50, choices=EmbeddingProvider.choices, null=True, blank=True)
    embedding_model_name = models.CharField(max_length=100, null=True, blank=True)
    embedding_dimensions = models.IntegerField(null=True, blank=True)
    embedding_locked = models.BooleanField(default=False)

    #Generation 
    generation_provider = models.CharField(max_length=20, choices=GenerationProvider.choices, null=True, blank=True)
    generation_model_name = models.CharField(max_length=100, null=True, blank=True)

    #Whisper
    whisper_model_name = models.CharField(max_length=20, choices=WhisperModel.choices, null=True, blank=True)

    #System 
    setup_complete = models.BooleanField(default=False)
    server_port = models.IntegerField(default=8080)

    def save(self, *args, **kwargs):
        self.id = 1
        super().save(*args, **kwargs)
    
    @classmethod
    def get(cls):
        return cls.objects.get(id=1)

    class Meta:
        db_table = 'config'
