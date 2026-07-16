import json
from django.http import JsonResponse
from core.models import Config

EXEMPT_PATH = [
    '/setup/',
    '/admin/',
    '/health/',
]
CAPTURE_PREFIX = '/capture/'
SETUP_MESSAGE = 'Please complete setup to get started'
SETUP_REDIRECT_PATH = '/setup'

class SetupRequiredMiddleware:
    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        #check if path is exempted ?

        normalized = request.path.rstrip('/') + '/'
        for path in EXEMPT_PATH:
            if normalized.startswith(path):
                return self.get_response(request)


        #Check setup_complete

        try:
            config = Config.get()
            if not config.setup_complete:
                return self._setup_required_response(
                    normalized,
                    'Setup required. Complete setup before using bookmark.'
                )
        except Exception:
            return self._setup_required_response(
                normalized,
                'Config not found. Run migrations first.'
            )
        return self.get_response(request)

    def _setup_required_response(self, normalized_path, error_text):
        payload = {'error': error_text, 'message': SETUP_MESSAGE}
        if not normalized_path.startswith(CAPTURE_PREFIX):
            payload['redirect'] = SETUP_REDIRECT_PATH
        return JsonResponse(payload, status=503)
