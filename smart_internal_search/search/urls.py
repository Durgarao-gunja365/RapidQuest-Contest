from django.urls import path
from . import views

urlpatterns = [
    path('search/', views.search_documents, name='search-documents'),
    path('search/suggestions/', views.search_suggestions, name='search-suggestions'),
    path('search/stats/', views.search_stats, name='search-stats'),
]