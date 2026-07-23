from django.urls import path
from . import views

urlpatterns = [
    path('runs/', views.runs_list),
    path('runs/<uuid:run_id>/queries/', views.run_queries),
    path('golden-set/active/', views.golden_set_active),
    path('golden-set/upload/', views.golden_set_upload),
    path('golden-set/confirm/', views.golden_set_confirm),
    path('feedback/', views.feedback_list),
    path('feedback/<uuid:pk>/promote/', views.feedback_promote),
    path('feedback/<uuid:pk>/dismiss/', views.feedback_dismiss),
]
