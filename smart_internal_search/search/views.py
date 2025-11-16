from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from rest_framework.permissions import AllowAny
from .utils import document_search
from documents.models import Document
from documents.serializers import DocumentListSerializer


@api_view(['GET'])
@permission_classes([AllowAny])
def search_documents(request):
    """
    SQLite-compatible document search endpoint
    """
    query = request.GET.get('q', '').strip()
    if not query:
        return Response({
            'error': 'Search query is required'
        }, status=status.HTTP_400_BAD_REQUEST)

    # Get filters from query parameters
    filters = {
        'team': request.GET.get('team'),
        'project': request.GET.get('project'),
        'file_type': request.GET.get('file_type'),
        'topic': request.GET.get('topic'),
        'status': request.GET.get('status'),
    }

    # Remove empty filters
    filters = {k: v for k, v in filters.items() if v}

    try:
        # Perform search
        documents = document_search.search_documents(query, filters)

        # Serialize results
        serializer = DocumentListSerializer(documents, many=True)

        return Response({
            'query': query,
            'filters': filters,
            'count': documents.count(),
            'results': serializer.data
        })

    except Exception as e:
        return Response({
            'error': f'Search failed: {str(e)}'
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['GET'])
@permission_classes([AllowAny])
def search_suggestions(request):
    """
    Get search suggestions based on partial query
    """
    query = request.GET.get('q', '').strip()
    if not query or len(query) < 2:
        return Response({'suggestions': []})

    try:
        suggestions = document_search.get_search_suggestions(query)
        return Response({'suggestions': suggestions})

    except Exception as e:
        return Response({
            'error': f'Failed to get suggestions: {str(e)}'
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['GET'])
@permission_classes([AllowAny])
def search_stats(request):
    """
    Get search statistics and available filters
    """
    from django.db.models import Count

    # Get counts for filters
    teams = Document.objects.values('team__id', 'team__name').annotate(
        count=Count('id')
    ).filter(count__gt=0)

    projects = Document.objects.values('project__id', 'project__name').annotate(
        count=Count('id')
    ).filter(count__gt=0)

    file_types = Document.objects.values('file_type').annotate(
        count=Count('id')
    ).filter(count__gt=0)

    topics = Document.objects.values('topics__id', 'topics__name').annotate(
        count=Count('id')
    ).filter(count__gt=0)

    return Response({
        'available_filters': {
            'teams': list(teams),
            'projects': list(projects),
            'file_types': list(file_types),
            'topics': list(topics),
        },
        'total_documents': Document.objects.count(),
        'searchable_documents': Document.objects.filter(
            content_extracted=True
        ).count(),
        'search_engine': 'SQLite (Basic Search)'
    })