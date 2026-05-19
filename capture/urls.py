from django.urls import path
from . import views

urlpatterns = [
    path('save/', views.capture, name='capture'),
]