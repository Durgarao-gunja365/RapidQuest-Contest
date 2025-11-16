from rest_framework import viewsets, status, generics
from rest_framework.decorators import action, api_view, permission_classes
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.parsers import MultiPartParser, FormParser
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework import filters
from django.db.models import Q
from .models import Document, Team, Project, Topic
from .serializers import (
    DocumentListSerializer, DocumentDetailSerializer, DocumentCreateSerializer,
    DocumentUpdateSerializer, TeamSerializer, ProjectSerializer, TopicSerializer
)


# Public view for testing
@api_view(['GET'])
@permission_classes([AllowAny])
def api_root(request):
    return Response({
        'message': 'Smart Internal Search API',
        'endpoints': {
            'teams': '/api/documents/teams/',
            'projects': '/api/documents/projects/',
            'documents': '/api/documents/documents/',
            'topics': '/api/documents/topics/',
            'upload': '/api/documents/documents/upload/',
        }
    })


class TeamViewSet(viewsets.ModelViewSet):
    queryset = Team.objects.all()
    serializer_class = TeamSerializer
    permission_classes = [IsAuthenticated]

    def get_permissions(self):
        if self.action in ['list', 'retrieve']:
            return [AllowAny()]
        return [IsAuthenticated()]


class ProjectViewSet(viewsets.ModelViewSet):
    queryset = Project.objects.all()
    serializer_class = ProjectSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend]
    filterset_fields = ['team']

    def get_permissions(self):
        if self.action in ['list', 'retrieve']:
            return [AllowAny()]
        return [IsAuthenticated()]


class TopicViewSet(viewsets.ModelViewSet):
    queryset = Topic.objects.all()
    serializer_class = TopicSerializer
    permission_classes = [IsAuthenticated]

    def get_permissions(self):
        if self.action in ['list', 'retrieve']:
            return [AllowAny()]
        return [IsAuthenticated()]


from rest_framework import viewsets, status, generics
from rest_framework.decorators import action, api_view, permission_classes
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, AllowAny, IsAuthenticatedOrReadOnly
from rest_framework.parsers import MultiPartParser, FormParser
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework import filters
from django.db.models import Q
from .models import Document, Team, Project, Topic
from .serializers import (
    DocumentListSerializer, DocumentDetailSerializer, DocumentCreateSerializer,
    DocumentUpdateSerializer, TeamSerializer, ProjectSerializer, TopicSerializer
)


# ... existing code ...

class DocumentViewSet(viewsets.ModelViewSet):
    # Change to IsAuthenticatedOrReadOnly to allow uploads without auth in development
    permission_classes = [AllowAny]  # For development - change to IsAuthenticatedOrReadOnly in production
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['team', 'project', 'file_type', 'topics', 'status']
    search_fields = ['title', 'description', 'content_text', 'original_filename']
    ordering_fields = ['uploaded_at', 'updated_at', 'last_accessed', 'file_size', 'access_count']
    ordering = ['-uploaded_at']
    parser_classes = [MultiPartParser, FormParser]

    def get_queryset(self):
        queryset = Document.objects.all()

        # Filter by search query if provided
        search_query = self.request.query_params.get('search', None)
        if search_query:
            queryset = queryset.filter(
                Q(title__icontains=search_query) |
                Q(description__icontains=search_query) |
                Q(content_text__icontains=search_query) |
                Q(original_filename__icontains=search_query)
            )

        return queryset

    def get_serializer_class(self):
        if self.action == 'list':
            return DocumentListSerializer
        elif self.action == 'retrieve':
            return DocumentDetailSerializer
        elif self.action == 'create':
            return DocumentCreateSerializer
        elif self.action in ['update', 'partial_update']:
            return DocumentUpdateSerializer
        return DocumentListSerializer

    # Remove get_permissions override since we're using AllowAny for development
    # def get_permissions(self):
    #     if self.action in ['list', 'retrieve', 'recent', 'by_team', 'stats']:
    #         return [AllowAny()]
    #     return [IsAuthenticated()]

    def perform_create(self, serializer):
        # For development, create a default user if none is authenticated
        if not self.request.user.is_authenticated:
            from django.contrib.auth.models import User
            default_user = User.objects.filter(is_superuser=True).first()
            if default_user:
                serializer.save(uploaded_by=default_user)
            else:
                # Create a default user if none exists
                default_user = User.objects.create_user(
                    username='default_user',
                    email='default@example.com',
                    password='defaultpass123'
                )
                serializer.save(uploaded_by=default_user)
        else:
            serializer.save()

    def retrieve(self, request, *args, **kwargs):
        instance = self.get_object()
        instance.increment_access_count()
        serializer = self.get_serializer(instance)
        return Response(serializer.data)

    @action(detail=False, methods=['get'])
    def recent(self, request):
        """Get recently accessed documents"""
        recent_docs = Document.objects.all().order_by('-last_accessed')[:10]
        serializer = DocumentListSerializer(recent_docs, many=True)
        return Response(serializer.data)

    @action(detail=False, methods=['get'])
    def by_team(self, request):
        """Get documents grouped by team"""
        team_id = request.query_params.get('team_id')
        if team_id:
            documents = Document.objects.filter(team_id=team_id)
        else:
            documents = Document.objects.all()

        serializer = DocumentListSerializer(documents, many=True)
        return Response(serializer.data)

    @action(detail=False, methods=['get'])
    def stats(self, request):
        """Get document statistics"""
        from django.db.models import Count, Sum
        total_docs = Document.objects.count()
        by_type = Document.objects.values('file_type').annotate(count=Count('id'))
        by_team = Document.objects.values('team__name').annotate(count=Count('id'))
        by_status = Document.objects.values('status').annotate(count=Count('id'))
        total_size = Document.objects.aggregate(total_size=Sum('file_size'))['total_size'] or 0

        return Response({
            'total_documents': total_docs,
            'total_size_mb': round(total_size / (1024 * 1024), 2),
            'by_file_type': list(by_type),
            'by_team': list(by_team),
            'by_status': list(by_status),
        })

    @action(detail=False, methods=['post'], parser_classes=[MultiPartParser, FormParser])
    def upload(self, request):
        """Custom upload endpoint with better error handling"""
        # For development, allow uploads without authentication
        if not request.user.is_authenticated:
            from django.contrib.auth.models import User
            default_user = User.objects.filter(is_superuser=True).first()
            if not default_user:
                default_user = User.objects.create_user(
                    username='upload_user',
                    email='upload@example.com',
                    password='uploadpass123'
                )
            request.user = default_user

        serializer = DocumentCreateSerializer(data=request.data, context={'request': request})

        if serializer.is_valid():
            try:
                document = serializer.save()
                return Response({
                    'message': 'File uploaded successfully',
                    'document_id': document.id,
                    'status': 'Processing started'
                }, status=status.HTTP_201_CREATED)
            except Exception as e:
                return Response({
                    'error': f'Error during upload: {str(e)}'
                }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)