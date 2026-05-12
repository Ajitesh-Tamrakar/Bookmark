from django.shortcuts import render
from .models import Config, Bookmark, BookmarkTag, Tag, Chunk
from django.http import JsonResponse
# Create your views here.

#Dev check 
def dev_wipe(request):
    Config = Config.get()
    if not Config.dev_mode:
        return JsonResponse({'error': 'dev mode is not enabled'}, status = 403)
    
    #Wipe data

    BookmarkTag.objects.all().delete()
    Chunk.objects.all().delete()
    Tag.objects.all().delete()
    Bookmark.objects.all().delete()

    #Reset config

    Config.objects.filter(id=1).update(
        embedding_locked =False,
        setup_complete = False,
        embedding_provider = None,
        embedding_model_name = None, 
        embedding_dimensions = None, 
       generation_provider = None, 
       generation_model_name = None,
    )

    return JsonResponse({'status': 'Wiped'})

def set_dev_mode(request):
    enabled = request.POST.get('enabled') == 'true'
    Config.objects.filter(id=1).update(dev_mode = enabled)
    return JsonResponse({'dev_mode': enabled})