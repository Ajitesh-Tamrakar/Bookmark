import uuid

from django.db import models

from core.models import Bookmark


class GoldenSetEntry(models.Model):
    class Bucket(models.TextChoices):
        EXACT_NAME = 'exact_name', 'Exact name'
        PARAPHRASE = 'paraphrase', 'Paraphrase'
        VAGUE = 'vague', 'Vague'

    class Source(models.TextChoices):
        UPLOADED = 'uploaded', 'Uploaded'
        PROMOTED_FROM_FEEDBACK = 'promoted_from_feedback', 'Promoted from feedback'

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    query_text = models.TextField()
    expected_bookmark = models.ForeignKey(Bookmark, on_delete=models.CASCADE)
    bucket = models.CharField(max_length=20, choices=Bucket.choices)
    source = models.CharField(max_length=30, choices=Source.choices, default=Source.UPLOADED)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'golden_set_entries'


class EvalRun(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    run_at = models.DateTimeField(auto_now_add=True)
    golden_set_fingerprint = models.CharField(max_length=16)
    embedding_model = models.CharField(max_length=100)
    chunk_size = models.IntegerField(null=True, blank=True)
    chunk_overlap = models.IntegerField(null=True, blank=True)
    prefix_enabled = models.BooleanField(default=False)
    hybrid_enabled = models.BooleanField(default=False)
    num_queries = models.IntegerField()
    recall_at_1 = models.FloatField()
    recall_at_5 = models.FloatField()
    mrr = models.FloatField()
    notes = models.TextField(blank=True, default='')

    class Meta:
        db_table = 'eval_runs'
        ordering = ['-run_at']


class EvalRunQuery(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    eval_run = models.ForeignKey(EvalRun, on_delete=models.CASCADE, related_name='queries')
    golden_set_entry = models.ForeignKey(GoldenSetEntry, on_delete=models.SET_NULL, null=True, blank=True)
    query_text_snapshot = models.TextField()
    expected_bookmark_id_snapshot = models.UUIDField()
    bucket_snapshot = models.CharField(max_length=20)
    found_rank = models.IntegerField(null=True, blank=True)

    class Meta:
        db_table = 'eval_run_queries'


class SearchFeedback(models.Model):
    class Feedback(models.TextChoices):
        YES = 'yes', 'Yes'
        NO = 'no', 'No'

    class Status(models.TextChoices):
        PENDING = 'pending', 'Pending'
        PROMOTED = 'promoted', 'Promoted'
        DISMISSED = 'dismissed', 'Dismissed'

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    query_text = models.TextField()
    searched_at = models.DateTimeField(auto_now_add=True)
    shown_bookmark = models.ForeignKey(Bookmark, null=True, blank=True, on_delete=models.SET_NULL, related_name='+')
    clicked_bookmark = models.ForeignKey(Bookmark, null=True, blank=True, on_delete=models.SET_NULL, related_name='+')
    clicked_rank = models.IntegerField(null=True, blank=True)
    feedback = models.CharField(max_length=10, choices=Feedback.choices, null=True, blank=True)
    status = models.CharField(max_length=20, choices=Status.choices, default=Status.PENDING)

    class Meta:
        db_table = 'search_feedback'
