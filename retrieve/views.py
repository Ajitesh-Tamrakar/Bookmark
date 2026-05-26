from django.shortcuts import render
from django.http import JsonResponse
from core.models import Chunk, Bookmark, BookmarkTag
from pgvector.django import CosineDistance
from ollama import embed
from django.db.models import Min
import logging
logger = logging.getLogger(__name__)
# Create your views here.


def search(request):
    query = request.GET.get("q")

    response = embed(model="nomic-embed-text-v2-moe", input=query)

    query_embedding = response.embeddings[0]
    results = (
        Chunk.objects.annotate(distance=CosineDistance("embedding", query_embedding))
        .values("bookmark_id")
        .annotate(min_distance=Min("distance"))
        .order_by("min_distance")[:5]
    )

    distance_values = list(results.values("bookmark_id", "min_distance"))
    playload = {
        'query': query,
        'results': [],
        'message': ''
    }
    for i in distance_values:
        if i["min_distance"] < 0.6:
            bookmark = Bookmark.objects.filter(id=i["bookmark_id"]).values("id", "title", "url", 'platform', 'author', 'saved_at' ).first()
            tags = list(BookmarkTag.objects.filter(bookmark_id=i["bookmark_id"]).values_list('tag__name', flat=True))
            bookmark['distance'] = i["min_distance"] #type: ignore
            playload['results'].append(bookmark)
            bookmark['tags'] = tags #type: ignore
    if len(playload['results']) == 0:
        playload['message'] = 'No relevant results found'
        return JsonResponse(playload, status=200)
    
    return JsonResponse(playload, status=200)
