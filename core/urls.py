from django.urls import path
from . import views
urlpatterns =[
    path('setup/dev-wipe/',views.dev_wipe),
    path('setup/', views.setup_embedding)
]