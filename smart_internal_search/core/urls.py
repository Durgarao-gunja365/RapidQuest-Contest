from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/auth/', include('rest_framework.urls')),
    path('api/documents/', include('documents.urls')),
    # Only include search URLs if the search app is properly set up
]

# Conditionally include search URLs to avoid import errors
try:
    from search.urls import urlpatterns as search_urlpatterns
    urlpatterns += [
        path('api/', include('search.urls')),
    ]
except ImportError:
    print("Search app not configured yet. Skipping search URLs.")

if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)