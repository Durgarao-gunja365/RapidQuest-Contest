from rest_framework import serializers
from .models import Document, Team, Project, Topic
from django.contrib.auth.models import User
import os


class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['id', 'username', 'first_name', 'last_name', 'email']


class TopicSerializer(serializers.ModelSerializer):
    class Meta:
        model = Topic
        fields = ['id', 'name', 'description']


class TeamSerializer(serializers.ModelSerializer):
    class Meta:
        model = Team
        fields = ['id', 'name', 'description']


class ProjectSerializer(serializers.ModelSerializer):
    team_name = serializers.CharField(source='team.name', read_only=True)

    class Meta:
        model = Project
        fields = ['id', 'name', 'description', 'team', 'team_name']


class DocumentListSerializer(serializers.ModelSerializer):
    uploaded_by_name = serializers.CharField(source='uploaded_by.get_full_name', read_only=True)
    team_name = serializers.CharField(source='team.name', read_only=True)
    project_name = serializers.CharField(source='project.name', read_only=True)
    topics_list = TopicSerializer(source='topics', many=True, read_only=True)
    file_url = serializers.FileField(source='file', read_only=True)
    file_name = serializers.CharField(source='original_filename', read_only=True)

    class Meta:
        model = Document
        fields = [
            'id', 'title', 'description', 'file_url', 'file_name', 'file_type', 'file_size',
            'uploaded_by_name', 'team_name', 'project_name', 'topics_list',
            'uploaded_at', 'updated_at', 'last_accessed', 'status', 'access_count'
        ]


class DocumentDetailSerializer(serializers.ModelSerializer):
    uploaded_by = UserSerializer(read_only=True)
    team = TeamSerializer(read_only=True)
    project = ProjectSerializer(read_only=True)
    topics = TopicSerializer(many=True, read_only=True)
    file_url = serializers.FileField(source='file', read_only=True)
    file_name = serializers.CharField(source='original_filename', read_only=True)
    content_text = serializers.CharField(read_only=True)

    class Meta:
        model = Document
        fields = '__all__'


class DocumentCreateSerializer(serializers.ModelSerializer):
    file = serializers.FileField(required=True)

    class Meta:
        model = Document
        fields = [
            'title', 'description', 'file', 'team', 'project', 'topics'
        ]

    def validate_file(self, value):
        """Validate the uploaded file"""
        # Check file size (50MB limit)
        max_size = 50 * 1024 * 1024  # 50MB in bytes
        if value.size > max_size:
            raise serializers.ValidationError(
                f"File size must be under 50MB. Current size: {value.size / (1024 * 1024):.1f}MB")

        # Check file extension
        allowed_extensions = ['.pdf', '.doc', '.docx', '.ppt', '.pptx', '.xls', '.xlsx', '.txt', '.md', '.jpg', '.jpeg',
                              '.png', '.gif']
        ext = os.path.splitext(value.name)[1].lower()
        if ext not in allowed_extensions:
            raise serializers.ValidationError(
                f"File type {ext} is not supported. Allowed types: {', '.join(allowed_extensions)}")

        return value

    def create(self, validated_data):
        # Get the current user from the request context
        request = self.context.get('request')

        # If no user is authenticated, use a default user
        if request and hasattr(request, 'user') and request.user.is_authenticated:
            validated_data['uploaded_by'] = request.user
        else:
            from django.contrib.auth.models import User
            default_user = User.objects.filter(is_superuser=True).first()
            if not default_user:
                default_user = User.objects.create_user(
                    username='default_uploader',
                    email='upload@example.com',
                    password='defaultpass123'
                )
            validated_data['uploaded_by'] = default_user

        # Extract topics if provided
        topics = validated_data.pop('topics', [])

        # Create document instance
        document = Document.objects.create(**validated_data)

        # Add topics to the document
        if topics:
            document.topics.set(topics)

        # Process the document asynchronously
        from .tasks import process_document_task
        try:
            process_document_task.delay(document.id)
        except:
            # If Celery is not running, process synchronously
            process_document_task(document.id)

        return document


class DocumentUpdateSerializer(serializers.ModelSerializer):
    class Meta:
        model = Document
        fields = [
            'title', 'description', 'team', 'project', 'topics'
        ]