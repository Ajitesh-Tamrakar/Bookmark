from django.shortcuts import render
from .models import Config, Bookmark, BookmarkTag, Tag, Chunk
from django.http import JsonResponse
from core.registry import EMBEDDING_REGISTRY
from django.views.decorators.csrf import csrf_exempt
from django.core.management import call_command


#Setup status — used by frontend root redirect; exempt from SetupRequiredMiddleware via /setup/ prefix
@csrf_exempt
def setup_status(request):
    if request.method != 'GET':
        return JsonResponse({'error': 'Method not allowed'}, status=405)
    try:
        config = Config.get()
        return JsonResponse({'setup_complete': config.setup_complete})
    except Config.DoesNotExist:
        return JsonResponse({'setup_complete': False})


@csrf_exempt
def setup_embedding(request):
    if request.method != 'POST':
        return JsonResponse({'error': 'Invalid request method'}, status=400)

    import json
    try:
        body = json.loads(request.body)
    except (json.JSONDecodeError, ValueError):
        body = request.POST

    embedding_provider = body.get('embedding_provider')
    embedding_model = body.get('embedding_model')
    generation_provider = body.get('generation_provider')
    generation_model = body.get('generation_model')
    whisper_model = body.get('whisper_model')
    dev_mode = body.get('dev_mode', False)

    if not embedding_provider or not embedding_model:
        return JsonResponse({'error': 'embedding_provider and embedding_model are required'}, status=400)
    if not generation_provider or not generation_model:
        return JsonResponse({'error': 'generation_provider and generation_model are required'}, status=400)
    if not whisper_model:
        return JsonResponse({'error': 'whisper_model is required'}, status=400)

    if embedding_provider not in EMBEDDING_REGISTRY:
        return JsonResponse({'error': 'Invalid embedding provider'}, status=400)
    if embedding_model not in EMBEDDING_REGISTRY[embedding_provider]:
        return JsonResponse({'error': 'Invalid embedding model'}, status=400)

    embedding_dimension = EMBEDDING_REGISTRY[embedding_provider][embedding_model]

    Config.objects.filter(id=1).update(
        embedding_provider=embedding_provider,
        embedding_model_name=embedding_model,
        embedding_dimensions=embedding_dimension,
        generation_provider=generation_provider,
        generation_model_name=generation_model,
        whisper_model_name=whisper_model,
        dev_mode=bool(dev_mode),
        setup_complete=True,
    )

    try:
        call_command('migrate', 'core', '0004')
    except Exception as e:
        Config.objects.filter(id=1).update(
            setup_complete=False,
            embedding_provider=None,
            embedding_dimensions=None,
            embedding_model_name=None,
            generation_provider=None,
            generation_model_name=None,
            whisper_model_name=None,
        )
        return JsonResponse({'error': f'Migration failed: {str(e)}'}, status=500)

    return JsonResponse({
        'status': 'Setup complete',
        'embedding_provider': embedding_provider,
        'embedding_model': embedding_model,
        'embedding_dimension': embedding_dimension,
        'generation_provider': generation_provider,
        'generation_model': generation_model,
        'whisper_model': whisper_model,
        'dev_mode': bool(dev_mode),
    })   


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