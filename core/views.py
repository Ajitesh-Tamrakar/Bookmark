from django.shortcuts import render
from .models import Config, Bookmark, BookmarkTag, Tag, Chunk
from django.http import JsonResponse
from core.registry import EMBEDDING_REGISTRY
from django.core.management import call_command


#Get embedding model 

def setup_embedding(request):
    if request.method != 'POST':
        return JsonResponse({'error': 'Invalid request method'}, status = 400)
    embedding_provider = request.POST.get('embedding_provider')
    embedding_model = request.POST.get('embedding_model')
    if not embedding_provider or not embedding_model: 
        return JsonResponse({'error': 'embedding_provider and embedding model are required'}, status = 400)

    if embedding_provider not in EMBEDDING_REGISTRY:
        return JsonResponse({'error': 'Invalid embedding provider'}, status = 400)
    if embedding_model not in  EMBEDDING_REGISTRY[embedding_provider]:
        return JsonResponse({'error': 'Invalid embedding model'}, status=400)
    
    embedding_dimension =  EMBEDDING_REGISTRY[embedding_provider][embedding_model]

    Config.objects.filter(id=1).update(

        embedding_provider=embedding_provider,
        embedding_model_name = embedding_model,
        embedding_dimensions = embedding_dimension,
        setup_complete = True,

        ) 
    try:         
        call_command('migrate', 'core', '0004')
    except Exception as e:
        
        #Roll back
        Config.objects.filter(id =1).update(
            setup_complete = False,
            embedding_provider = None,
            embedding_dimensions = None,
            embedding_model_name=None,
        )
        
        return JsonResponse(
            {
                'error': f'Migration failed: {str(e)}'
            },
            status = 500
        )


    return JsonResponse(
        {'status': 'Embedding locked',
         'Provider': embedding_provider,
         'Model': embedding_model,
         'Dimension': embedding_dimension
         },
        )   


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