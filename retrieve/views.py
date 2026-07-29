import hashlib
import json
import time

from django.http import JsonResponse
from django.db import connection, transaction
from django.db.models import Count
from django.views.decorators.csrf import csrf_exempt
from core.db import embedding_index_status
from core.models import Chunk, Bookmark, BookmarkTag, Tag, Config
from core.metrics import timed_event
from process.embeddings import embed_texts
from process.chunk_builders import upsert_note_chunk
import logging

from evaluate.models import SearchFeedback

logger = logging.getLogger(__name__)

# bookmark_note() retries embedding just the note chunk inline rather than
# requeuing the whole bookmark for a full pipeline re-run over one chunk.
NOTE_EMBED_ATTEMPTS = 3
NOTE_EMBED_RETRY_DELAY_SECONDS = 0.5

# B-13: _best_chunks_fast()'s two-stage search. candidate_k is how many nearest
# chunks (system-wide, before grouping by bookmark) the HNSW index is asked for;
# ef_search is set to match it so the ANN search is actually thorough enough to
# fill that candidate set well (see _best_chunks_fast's docstring). Widened for
# tag-filtered searches since tag filtering still happens in Python afterward,
# over whatever this pool contains -- see the "out of scope" note in the
# implementing doc about why this is a stopgap, not a full fix, for that case.
DEFAULT_CANDIDATE_K = 200
TAG_FILTERED_CANDIDATE_K = 1000
DEFAULT_RESULT_LIMIT = 25
MAX_RESULT_LIMIT = 100


def _best_chunks(query_embedding):
    """Return [(bookmark_id_str, distance, timestamp_seconds)] via DISTINCT ON."""
    vec = '[' + ','.join(str(x) for x in query_embedding) + ']'
    sql = """
        SELECT DISTINCT ON (c.bookmark_id)
            c.bookmark_id::text,
            (c.embedding <=> %s::vector)::float AS distance,
            c.timestamp_seconds
        FROM chunks c
        WHERE c.embedding IS NOT NULL
        ORDER BY c.bookmark_id, (c.embedding <=> %s::vector) ASC
    """
    with connection.cursor() as cur:
        cur.execute(sql, [vec, vec])
        return cur.fetchall()


def _best_chunks_fast(query_embedding, candidate_k=DEFAULT_CANDIDATE_K, ef_search=DEFAULT_CANDIDATE_K):
    """Two-stage ANN search: first ask for the `candidate_k` nearest chunks
    system-wide (a plain top-K ORDER BY -- the shape an HNSW index can actually
    serve, unlike _best_chunks's grouped DISTINCT ON), then keep only the closest
    chunk per bookmark from that already-small pool. This is the default/fast
    path used by search(); _best_chunks() (unbounded, exact) stays unchanged and
    is used for deep search and run_golden_eval.

    ef_search must be set via SET LOCAL inside the *same* transaction as the
    query below -- outside an explicit transaction, each cursor.execute() is its
    own implicit transaction in Postgres, so a SET LOCAL in one execute() call
    would not carry over to the next. Postgres's SET command also does not
    accept bound parameters (no `SET x = %s`), so ef_search is inlined as a
    validated int rather than passed as a query param -- safe here because it is
    always DEFAULT_CANDIDATE_K or TAG_FILTERED_CANDIDATE_K, never user input.
    """
    vec = '[' + ','.join(str(x) for x in query_embedding) + ']'
    sql = """
        WITH nearest AS (
            SELECT bookmark_id, (embedding <=> %s::vector)::float AS distance, timestamp_seconds
            FROM chunks
            WHERE embedding IS NOT NULL
            ORDER BY embedding <=> %s::vector
            LIMIT %s
        )
        SELECT DISTINCT ON (bookmark_id) bookmark_id::text, distance, timestamp_seconds
        FROM nearest
        ORDER BY bookmark_id, distance
    """
    with transaction.atomic(), connection.cursor() as cur:
        cur.execute(f"SET LOCAL hnsw.ef_search = {int(ef_search)};")
        cur.execute(sql, [vec, vec, candidate_k])
        return cur.fetchall()


def _fetch_tags(bookmark_ids):
    """Return {bookmark_id_str: [{"name": ..., "source": ...}]}."""
    if not bookmark_ids:
        return {}
    result = {}
    for bt in (
        BookmarkTag.objects
        .filter(bookmark_id__in=bookmark_ids)
        .select_related('tag')
    ):
        bid = str(bt.bookmark_id)
        result.setdefault(bid, []).append({'name': bt.tag.name, 'source': bt.source})
    return result


def _serialize(b, tags, extra=None):
    out = {
        'id': str(b['id']),
        'title': b['title'],
        'url': b['url'],
        'platform': b['platform'],
        'author': b['author'],
        'saved_at': b['saved_at'].isoformat() if b['saved_at'] else None,
        'tags': tags,
    }
    highlighted = (b.get('platform_metadata') or {}).get('highlighted_text')
    if highlighted:
        out['highlighted_text'] = highlighted   # C1: only this one field, never the full dict
    if extra:
        out.update(extra)
    return out


def search(request):
    q = request.GET.get('q', '').strip()
    if not q:
        return JsonResponse({'error': 'q is required'}, status=400)

    tags_param = request.GET.get('tags', '').strip()
    tag_list = [t.strip() for t in tags_param.split(',') if t.strip()] if tags_param else []
    logic = request.GET.get('logic', 'and')
    deep = request.GET.get('deep', '').strip().lower() in ('1', 'true')

    try:
        limit = max(1, min(int(request.GET.get('limit', DEFAULT_RESULT_LIMIT)), MAX_RESULT_LIMIT))
    except ValueError:
        limit = DEFAULT_RESULT_LIMIT
    try:
        offset = max(0, int(request.GET.get('offset', 0)))
    except ValueError:
        offset = 0

    query_hash = hashlib.sha256(q.encode()).hexdigest()[:16]
    results = []

    with timed_event(
        "search_query",
        payload={"query_hash": query_hash, "used_tag_filter": bool(tag_list), "deep": deep},
    ) as p:
        query_vector = embed_texts([q], task='query')[0]

        if deep:
            rows = _best_chunks(query_vector)
        else:
            candidate_k = TAG_FILTERED_CANDIDATE_K if tag_list else DEFAULT_CANDIDATE_K
            rows = _best_chunks_fast(query_vector, candidate_k=candidate_k, ef_search=candidate_k)

        # Tag filtering (unchanged logic -- still Python-side; see the
        # implementing doc's "out of scope" note on moving this into SQL)
        if tag_list:
            if logic == 'or':
                allowed = set(
                    str(x) for x in BookmarkTag.objects
                    .filter(tag__name__in=tag_list)
                    .values_list('bookmark_id', flat=True)
                )
            else:
                allowed = None
                for name in tag_list:
                    ids = set(
                        str(x) for x in BookmarkTag.objects
                        .filter(tag__name=name)
                        .values_list('bookmark_id', flat=True)
                    )
                    allowed = ids if allowed is None else allowed & ids
            rows = [(bid, dist, ts) for bid, dist, ts in rows if bid in allowed]

        rows.sort(key=lambda r: r[1])

        page = rows[offset:offset + limit]
        has_more = (offset + limit) < len(rows)

        bid_list = [r[0] for r in page]
        chunk_map = {r[0]: {'distance': r[1], 'timestamp_seconds': r[2]} for r in page}

        b_map = {
            str(b['id']): b
            for b in Bookmark.objects.filter(id__in=bid_list)
            .values('id', 'title', 'url', 'platform', 'author', 'saved_at', 'platform_metadata')
        }
        tag_map = _fetch_tags(bid_list)

        for bid in bid_list:
            b = b_map.get(bid)
            if not b:
                continue
            c = chunk_map[bid]
            results.append(_serialize(b, tag_map.get(bid, []), extra={
                'distance': c['distance'],
                'timestamp_seconds': c['timestamp_seconds'],
            }))

        p["result_count"] = len(results)
        p["top_score"] = results[0]['distance'] if results else None
        p["fallback_triggered"] = False

    if Config.get().dev_mode:
        top_bookmark_id = results[0]['id'] if results else None
        SearchFeedback.objects.create(query_text=q, shown_bookmark_id=top_bookmark_id)

    return JsonResponse({'query': q, 'results': results, 'has_more': has_more})


def tags_list(request):
    tags = (
        Tag.objects
        .annotate(count=Count('bookmarktag'))
        .filter(count__gt=0)
        .values('name', 'count')
        .order_by('-count', 'name')
    )
    return JsonResponse({'tags': list(tags)})


def bookmarks_list(request):
    tags_param = request.GET.get('tags', '').strip()
    tag_list = [t.strip() for t in tags_param.split(',') if t.strip()] if tags_param else []
    logic = request.GET.get('logic', 'and')

    qs = Bookmark.objects.filter(processing_status='complete').order_by('-saved_at')

    if tag_list:
        if logic == 'or':
            qs = qs.filter(bookmarktag__tag__name__in=tag_list).distinct()
        else:
            for t in tag_list:
                qs = qs.filter(bookmarktag__tag__name=t)
        bookmarks = list(qs.values('id', 'title', 'url', 'platform', 'author', 'saved_at', 'platform_metadata'))
    else:
        bookmarks = list(qs[:20].values('id', 'title', 'url', 'platform', 'author', 'saved_at', 'platform_metadata'))

    bid_list = [str(b['id']) for b in bookmarks]
    tag_map = _fetch_tags(bid_list)

    results = [_serialize(b, tag_map.get(str(b['id']), [])) for b in bookmarks]
    return JsonResponse({'results': results})


@csrf_exempt
def bookmark_delete(request, pk):
    if request.method != 'DELETE':
        return JsonResponse({'error': 'Method not allowed'}, status=405)
    deleted, _ = Bookmark.objects.filter(id=pk).delete()
    if not deleted:
        return JsonResponse({'error': 'Not found'}, status=404)
    return JsonResponse({'status': 'deleted'})


@csrf_exempt
def bookmark_note(request, pk):
    if request.method != 'PATCH':
        return JsonResponse({'error': 'Method not allowed'}, status=405)
    try:
        body = json.loads(request.body)
    except (ValueError, TypeError):
        return JsonResponse({'error': 'Invalid JSON'}, status=400)
    note = body.get('note', '')
    updated = Bookmark.objects.filter(id=pk).update(user_note=note)
    if not updated:
        return JsonResponse({'error': 'Not found'}, status=404)

    bookmark = Bookmark.objects.get(id=pk)
    note_indexed = True
    result = upsert_note_chunk(bookmark)
    if result['status'] == 'success':
        chunk = Chunk.objects.filter(bookmark=bookmark, chunk_type=Chunk.ChunkType.NOTE).first()
        if chunk is not None:
            last_error = None
            for attempt in range(1, NOTE_EMBED_ATTEMPTS + 1):
                try:
                    vector = embed_texts([chunk.text], task='document')[0]
                    Chunk.objects.filter(id=chunk.id).update(embedding=vector)
                    last_error = None
                    break
                except Exception as e:
                    last_error = e
                    if attempt < NOTE_EMBED_ATTEMPTS:
                        time.sleep(NOTE_EMBED_RETRY_DELAY_SECONDS)

            if last_error is not None:
                # Bookmark stays processing_status='complete' with this one chunk
                # unembedded -- the same B-23 invariant violation run_pipeline now
                # guards against -- but only after retrying inline first, so a
                # transient blip doesn't cost a full pipeline re-run. Left in this
                # state, repair_embeddings (core.db) still picks it up on the next
                # worker restart or migration run as a last-resort backstop.
                logger.error(
                    f'Failed to embed note chunk for bookmark {pk} after '
                    f'{NOTE_EMBED_ATTEMPTS} attempts: {last_error}'
                )
                note_indexed = False
    else:
        logger.error(f'Failed to upsert note chunk for bookmark {pk}: {result["error"]}')
        note_indexed = False

    return JsonResponse({'status': 'updated', 'note_indexed': note_indexed})


def status_summary(request):
    """Minimal, non-dev-gated system status signal. Reports pgvector index health
    and the count of 'complete' bookmarks that still have unembedded chunks (the
    B-23 invariant violation -- these are saved but invisible to search). The
    shape is left extensible so more fields (pending/processing/failed counts,
    etc.) can be added later without breaking existing consumers."""
    try:
        dimension = Config.get().embedding_dimensions
    except Config.DoesNotExist:
        dimension = None

    unembedded_complete_count = (
        Bookmark.objects
        .filter(processing_status='complete', chunk__embedding__isnull=True)
        .distinct()
        .count()
    )

    return JsonResponse({
        'pgvector_index': {
            'present': embedding_index_status()['present'],
            'dimension': dimension,
        },
        'unembedded_complete_count': unembedded_complete_count,
    })
