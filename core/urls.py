from django.urls import path
from . import views

urlpatterns = [
    path('setup/status/', views.setup_status),
    path('setup/dev-wipe/', views.dev_wipe),
    path('setup/', views.setup_embedding),
]