import csv
import io
import json
import uuid

from django.db import transaction
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt

from core.models import Bookmark, Config
from evaluate.models import EvalRun, GoldenSetEntry, SearchFeedback
from evaluate.utils import compute_fingerprint

BUCKET_CHOICES = {c for c, _ in GoldenSetEntry.Bucket.choices}

# Holds the last validated golden-set upload so /confirm/ can commit it without
# requiring the client to resend the full (possibly large) parsed entry list.
# Single-process, dev-mode-only, single-user tool — a module-level cache is fine.
_UPLOAD_CACHE = {'entries': None}


def _dev_mode_or_error():
    """Returns (config, None) or (None, error_response), matching
    core/views.py:pipeline_status's gating precedent."""
    try:
        config = Config.get()
    except Config.DoesNotExist:
        return None, JsonResponse({'error': 'config not found'}, status=404)
    if not config.dev_mode:
        return None, JsonResponse({'error': 'dev mode not enabled'}, status=403)
    return config, None


def runs_list(request):
    config, error = _dev_mode_or_error()
    if error:
        return error
    if request.method != 'GET':
        return JsonResponse({'error': 'Method not allowed'}, status=405)

    runs = list(EvalRun.objects.all())  # Meta.ordering = ['-run_at']
    out = []
    for i, run in enumerate(runs):
        prev = runs[i + 1] if i + 1 < len(runs) else None
        delta = None
        if prev:
            delta = {
                'recall_at_1': run.recall_at_1 - prev.recall_at_1,
                'recall_5': run.recall_at_5 - prev.recall_at_5,
                'mrr': run.mrr - prev.mrr,
            }
        out.append({
            'id': str(run.id),
            'run_at': run.run_at.isoformat(),
            'golden_set_fingerprint': run.golden_set_fingerprint,
            'embedding_model': run.embedding_model,
            'chunk_size': run.chunk_size,
            'chunk_overlap': run.chunk_overlap,
            'prefix_enabled': run.prefix_enabled,
            'hybrid_enabled': run.hybrid_enabled,
            'num_queries': run.num_queries,
            'recall_at_1': run.recall_at_1,
            'recall_at_5': run.recall_at_5,
            'mrr': run.mrr,
            'notes': run.notes,
            'delta': delta,
        })
    return JsonResponse({'runs': out})


def run_queries(request, run_id):
    config, error = _dev_mode_or_error()
    if error:
        return error
    if request.method != 'GET':
        return JsonResponse({'error': 'Method not allowed'}, status=405)

    run = EvalRun.objects.filter(id=run_id).first()
    if not run:
        return JsonResponse({'error': 'Not found'}, status=404)

    queries = []
    for q in run.queries.select_related('golden_set_entry', 'golden_set_entry__expected_bookmark').all():
        entry = q.golden_set_entry
        if entry and entry.expected_bookmark:
            title = entry.expected_bookmark.title or '(untitled)'
        else:
            title = '(deleted bookmark)'
        queries.append({
            'id': str(q.id),
            'query_text': q.query_text_snapshot,
            'expected_bookmark_title': title,
            'bucket': q.bucket_snapshot,
            'found_rank': q.found_rank,
        })
    return JsonResponse({'queries': queries})


def golden_set_active(request):
    config, error = _dev_mode_or_error()
    if error:
        return error
    if request.method != 'GET':
        return JsonResponse({'error': 'Method not allowed'}, status=405)

    entries = GoldenSetEntry.objects.all()
    entry_count = entries.count()
    if entry_count == 0:
        return JsonResponse({'fingerprint': '', 'entry_count': 0, 'last_updated': None})

    fingerprint = compute_fingerprint(entries.values_list('id', flat=True))
    last_updated = entries.order_by('-created_at').values_list('created_at', flat=True).first()
    return JsonResponse({
        'fingerprint': fingerprint,
        'entry_count': entry_count,
        'last_updated': last_updated.isoformat(),
    })


def _parse_golden_set_rows(rows):
    """Validate parsed CSV rows. Returns (valid_entries, errors); collects every
    row's errors instead of failing fast on the first bad row."""
    parsed = []
    for row in rows:
        raw_id = (row.get('expected_bookmark_id') or '').strip()
        parsed_id = None
        if raw_id:
            try:
                parsed_id = str(uuid.UUID(raw_id))
            except ValueError:
                parsed_id = None
        parsed.append({
            'query': (row.get('query') or '').strip(),
            'bucket': (row.get('bucket') or '').strip(),
            'raw_id': raw_id,
            'parsed_id': parsed_id,
        })

    candidate_ids = [r['parsed_id'] for r in parsed if r['parsed_id']]
    existing_ids = set(
        str(x) for x in Bookmark.objects.filter(id__in=candidate_ids).values_list('id', flat=True)
    ) if candidate_ids else set()

    valid_entries = []
    errors = []
    for i, r in enumerate(parsed, start=1):
        row_errors = []
        if not r['query']:
            row_errors.append(f"Row {i}: missing query")
        if not r['raw_id']:
            row_errors.append(f"Row {i}: missing expected_bookmark_id")
        elif r['parsed_id'] is None or r['parsed_id'] not in existing_ids:
            row_errors.append(
                f"Row {i}: expected_bookmark_id '{r['raw_id']}' does not resolve to an existing Bookmark"
            )
        if r['bucket'] not in BUCKET_CHOICES:
            row_errors.append(f"Row {i}: invalid bucket '{r['bucket']}'")

        if row_errors:
            errors.extend(row_errors)
        else:
            valid_entries.append({'query': r['query'], 'expected_bookmark_id': r['parsed_id'], 'bucket': r['bucket']})

    return valid_entries, errors


@csrf_exempt
def golden_set_upload(request):
    config, error = _dev_mode_or_error()
    if error:
        return error
    if request.method != 'POST':
        return JsonResponse({'error': 'Method not allowed'}, status=405)

    uploaded = request.FILES.get('file')
    if not uploaded:
        return JsonResponse({'error': 'file is required'}, status=400)

    try:
        text = uploaded.read().decode('utf-8-sig')
    except UnicodeDecodeError:
        return JsonResponse({'error': 'file must be UTF-8 encoded CSV'}, status=400)

    rows = list(csv.DictReader(io.StringIO(text)))
    valid_entries, errors = _parse_golden_set_rows(rows)

    _UPLOAD_CACHE['entries'] = valid_entries

    return JsonResponse({
        'total': len(rows),
        'preview_entries': valid_entries[:10],
        'errors': errors,
    })


@csrf_exempt
def golden_set_confirm(request):
    config, error = _dev_mode_or_error()
    if error:
        return error
    if request.method != 'POST':
        return JsonResponse({'error': 'Method not allowed'}, status=405)

    entries = None
    if request.body:
        try:
            body = json.loads(request.body)
        except (ValueError, TypeError):
            body = None
        if isinstance(body, dict) and isinstance(body.get('entries'), list):
            entries = body['entries']
    if entries is None:
        entries = _UPLOAD_CACHE.get('entries')

    if not entries:
        return JsonResponse(
            {'error': 'No validated golden set to confirm. Upload a file first.'}, status=400
        )

    with transaction.atomic():
        GoldenSetEntry.objects.all().delete()
        new_entries = [
            GoldenSetEntry(
                query_text=e['query'],
                expected_bookmark_id=e['expected_bookmark_id'],
                bucket=e['bucket'],
                source=GoldenSetEntry.Source.UPLOADED,
            )
            for e in entries
        ]
        GoldenSetEntry.objects.bulk_create(new_entries)

    _UPLOAD_CACHE['entries'] = None

    return JsonResponse({
        'fingerprint': compute_fingerprint(e.id for e in new_entries),
        'entry_count': len(new_entries),
    })


def feedback_list(request):
    config, error = _dev_mode_or_error()
    if error:
        return error
    if request.method != 'GET':
        return JsonResponse({'error': 'Method not allowed'}, status=405)

    all_feedback = SearchFeedback.objects.all()
    total_searches = all_feedback.count()
    yes_count = all_feedback.filter(feedback=SearchFeedback.Feedback.YES).count()
    no_count = all_feedback.filter(feedback=SearchFeedback.Feedback.NO).count()
    yes_pct = (yes_count / total_searches * 100) if total_searches else 0.0
    no_pct = (no_count / total_searches * 100) if total_searches else 0.0

    rows_qs = (
        SearchFeedback.objects
        .filter(feedback=SearchFeedback.Feedback.NO, status=SearchFeedback.Status.PENDING)
        .select_related('shown_bookmark')
        .order_by('-searched_at')
    )
    rows = [{
        'id': str(r.id),
        'query_text': r.query_text,
        'searched_at': r.searched_at.isoformat(),
        'shown_title': r.shown_bookmark.title if r.shown_bookmark else None,
        'clicked_rank': r.clicked_rank,
    } for r in rows_qs]

    return JsonResponse({
        'total_searches': total_searches,
        'yes_pct': yes_pct,
        'no_pct': no_pct,
        'rows': rows,
    })


@csrf_exempt
def feedback_promote(request, pk):
    config, error = _dev_mode_or_error()
    if error:
        return error
    if request.method != 'POST':
        return JsonResponse({'error': 'Method not allowed'}, status=405)

    try:
        body = json.loads(request.body)
    except (ValueError, TypeError):
        return JsonResponse({'error': 'Invalid JSON'}, status=400)

    expected_bookmark_id = body.get('expected_bookmark_id')
    bucket = body.get('bucket')
    if not expected_bookmark_id or not bucket:
        return JsonResponse({'error': 'expected_bookmark_id and bucket are required'}, status=400)
    if bucket not in BUCKET_CHOICES:
        return JsonResponse({'error': f"invalid bucket '{bucket}'"}, status=400)

    try:
        bookmark_exists = Bookmark.objects.filter(id=expected_bookmark_id).exists()
    except ValueError:
        bookmark_exists = False
    if not bookmark_exists:
        return JsonResponse({'error': 'expected_bookmark_id does not resolve to an existing Bookmark'}, status=400)

    feedback = SearchFeedback.objects.filter(id=pk).first()
    if not feedback:
        return JsonResponse({'error': 'Not found'}, status=404)

    GoldenSetEntry.objects.create(
        query_text=feedback.query_text,
        expected_bookmark_id=expected_bookmark_id,
        bucket=bucket,
        source=GoldenSetEntry.Source.PROMOTED_FROM_FEEDBACK,
    )
    feedback.status = SearchFeedback.Status.PROMOTED
    feedback.save(update_fields=['status'])

    return JsonResponse({'ok': True})


@csrf_exempt
def feedback_dismiss(request, pk):
    config, error = _dev_mode_or_error()
    if error:
        return error
    if request.method != 'POST':
        return JsonResponse({'error': 'Method not allowed'}, status=405)

    updated = SearchFeedback.objects.filter(id=pk).update(status=SearchFeedback.Status.DISMISSED)
    if not updated:
        return JsonResponse({'error': 'Not found'}, status=404)

    return JsonResponse({'ok': True})
