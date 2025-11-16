from django.urls import path, include
from rest_framework.routers import DefaultRouter
from . import views

router = DefaultRouter()
router.register(r'teams', views.TeamViewSet)
router.register(r'projects', views.ProjectViewSet)
router.register(r'topics', views.TopicViewSet)
router.register(r'documents', views.DocumentViewSet, basename='document')


urlpatterns = [
    path('', views.api_root, name='api-root'),
    path('', include(router.urls)),
]