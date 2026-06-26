from django.urls import path
from . import views

urlpatterns = [
    path('health/', views.health),
    path('setup/status/', views.setup_status),
    path('setup/dev-wipe/', views.dev_wipe),
    path('setup/pull-models/', views.pull_models),
    path('setup/pull-status/', views.pull_status),
    path('setup/complete/', views.setup_embedding),
    path('pipeline/status/', views.pipeline_status),
    path('pipeline/retry/<uuid:bookmark_id>/', views.pipeline_retry),
    path('setup/set-dev-mode/', views.set_dev_mode),
]