import json
from django.http import JsonResponse
from core.models import Config

EXEMPT_PATH = [
    '/setup/',
    '/admin/',
]

class SetupRequiredMiddleware:
    def __init__(self, get_response):
        self.get_response = get_response
    
    def __call__(self, request):
        #check if path is exempted ?

        for path in EXEMPT_PATH:
            if request.path.startswith(path):
                return self.get_response(request)
            

        #Check setup_complete

        try: 
            config = Config.get()
            if not config.setup_complete:
                return JsonResponse(
                    {'error': 'Setup required. Complete setup before using bookmark.'},
                    status = 503
                )
        except Config.DoesNotExist:
            return JsonResponse(
                {'error': 'Config not found. Run migrations first.'}
            )
        return self.get_response(request)
