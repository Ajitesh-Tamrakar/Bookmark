from django.urls import path
from . import views

urlpatterns = [
    path('search/', views.search, name='search'),
    path('tags/', views.tags_list, name='tags_list'),
    path('bookmarks/', views.bookmarks_list, name='bookmarks_list'),
    path('bookmarks/<uuid:pk>/', views.bookmark_delete, name='bookmark_delete'),
]
