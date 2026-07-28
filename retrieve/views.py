import hashlib
import json

from django.http import JsonResponse
from django.db import connection
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

    query_hash = hashlib.sha256(q.encode()).hexdigest()[:16]
    results = []

    with timed_event(
        "search_query",
        payload={"query_hash": query_hash, "used_tag_filter": bool(tag_list)},
    ) as p:
        query_vector = embed_texts([q], task='query')[0]
        rows = _best_chunks(query_vector)

        # Tag filtering
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

        bid_list = [r[0] for r in rows]
        chunk_map = {r[0]: {'distance': r[1], 'timestamp_seconds': r[2]} for r in rows}

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

    return JsonResponse({'query': q, 'results': results})


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
    result = upsert_note_chunk(bookmark)
    if result['status'] == 'success':
        chunk = Chunk.objects.filter(bookmark=bookmark, chunk_type=Chunk.ChunkType.NOTE).first()
        if chunk is not None:
            try:
                vector = embed_texts([chunk.text], task='document')[0]
                Chunk.objects.filter(id=chunk.id).update(embedding=vector)
            except Exception as e:
                logger.error(f'Failed to embed note chunk for bookmark {pk}: {e}')
    else:
        logger.error(f'Failed to upsert note chunk for bookmark {pk}: {result["error"]}')

    return JsonResponse({'status': 'updated'})


def status_summary(request):
    """Minimal, non-dev-gated system status signal. Only reports pgvector index
    health for now; the shape is left extensible so more fields (pending/
    processing/failed/unembedded_complete counts, etc.) can be added later
    without breaking existing consumers."""
    try:
        dimension = Config.get().embedding_dimensions
    except Config.DoesNotExist:
        dimension = None

    return JsonResponse({
        'pgvector_index': {
            'present': embedding_index_status()['present'],
            'dimension': dimension,
        },
    })
