import hashlib
import json

from django.http import JsonResponse
from django.db import connection
from django.db.models import Count
from django.views.decorators.csrf import csrf_exempt
from core.models import Chunk, Bookmark, BookmarkTag, Tag, Config
from core.metrics import timed_event
from ollama import embed
import logging

logger = logging.getLogger(__name__)


def _embedding_model():
    try:
        return Config.get().embedding_model_name or 'nomic-embed-text-v2-moe'
    except Exception:
        return 'nomic-embed-text-v2-moe'


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
        response = embed(model=_embedding_model(), input=q)
        rows = _best_chunks(response.embeddings[0])

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
    return JsonResponse({'status': 'updated'})
