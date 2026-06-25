from django.urls import path
from . import views

urlpatterns = [
    path('setup/status/', views.setup_status),
    path('setup/dev-wipe/', views.dev_wipe),
    path('setup/pull-models/', views.pull_models),
    path('setup/pull-status/', views.pull_status),
    path('setup/', views.setup_embedding),
]