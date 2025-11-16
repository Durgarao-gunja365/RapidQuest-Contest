from django.db import models
from django.contrib.auth.models import User
from django.utils import timezone
import os
import uuid


def document_file_path(instance, filename):
    """Generate file path for new documents"""
    # Generate unique filename using UUID to avoid conflicts
    ext = filename.split('.')[-1]
    filename = f"{uuid.uuid4()}.{ext}"
    return f"documents/{filename}"


class Team(models.Model):
    name = models.CharField(max_length=100)
    description = models.TextField(blank=True)

    def __str__(self):
        return self.name


class Project(models.Model):
    name = models.CharField(max_length=100)
    description = models.TextField(blank=True)
    team = models.ForeignKey(Team, on_delete=models.CASCADE, related_name='projects')

    def __str__(self):
        return self.name


class Topic(models.Model):
    name = models.CharField(max_length=100)
    description = models.TextField(blank=True)

    def __str__(self):
        return self.name


class Document(models.Model):
    DOCUMENT_TYPES = [
        ('PDF', 'PDF'),
        ('DOCX', 'Word Document'),
        ('PPTX', 'PowerPoint'),
        ('XLSX', 'Excel'),
        ('TXT', 'Text File'),
        ('MD', 'Markdown'),
        ('IMAGE', 'Image'),
        ('OTHER', 'Other'),
    ]

    STATUS_CHOICES = [
        ('PENDING', 'Pending Processing'),
        ('PROCESSED', 'Processed'),
        ('FAILED', 'Processing Failed'),
    ]

    title = models.CharField(max_length=255)
    description = models.TextField(blank=True)
    file = models.FileField(upload_to=document_file_path)
    file_type = models.CharField(max_length=10, choices=DOCUMENT_TYPES)
    file_size = models.PositiveIntegerField(default=0)
    original_filename = models.CharField(max_length=255, blank=True)

    # Relationships
    uploaded_by = models.ForeignKey(User, on_delete=models.CASCADE)
    team = models.ForeignKey(Team, on_delete=models.CASCADE, related_name='documents')
    project = models.ForeignKey(Project, on_delete=models.SET_NULL, related_name='documents', null=True, blank=True)
    topics = models.ManyToManyField(Topic, related_name='documents', blank=True)

    # Metadata
    uploaded_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    last_accessed = models.DateTimeField(auto_now_add=True)
    access_count = models.PositiveIntegerField(default=0)

    # Processing fields
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='PENDING')
    content_extracted = models.BooleanField(default=False)
    content_text = models.TextField(blank=True)
    processing_error = models.TextField(blank=True)

    class Meta:
        ordering = ['-uploaded_at']
        indexes = [
            models.Index(fields=['title', 'uploaded_at']),
            models.Index(fields=['team', 'project']),
            models.Index(fields=['status']),
        ]

    def __str__(self):
        return self.title

    def save(self, *args, **kwargs):
        # Set original filename on first save
        if not self.original_filename and self.file:
            self.original_filename = os.path.basename(self.file.name)

        # Set file type based on extension
        if self.file and not self.file_type:
            ext = os.path.splitext(self.file.name)[1].lower()
            ext_map = {
                '.pdf': 'PDF',
                '.doc': 'DOCX',
                '.docx': 'DOCX',
                '.ppt': 'PPTX',
                '.pptx': 'PPTX',
                '.xls': 'XLSX',
                '.xlsx': 'XLSX',
                '.txt': 'TXT',
                '.md': 'MD',
                '.jpg': 'IMAGE',
                '.jpeg': 'IMAGE',
                '.png': 'IMAGE',
                '.gif': 'IMAGE',
            }
            self.file_type = ext_map.get(ext, 'OTHER')

        # Set file size
        if self.file:
            try:
                self.file_size = self.file.size
            except (ValueError, OSError):
                self.file_size = 0

        # Set title from filename if not provided
        if not self.title and self.original_filename:
            self.title = os.path.splitext(self.original_filename)[0]

        super().save(*args, **kwargs)

    def get_file_extension(self):
        return os.path.splitext(self.original_filename)[1].lower()

    def increment_access_count(self):
        self.access_count += 1
        self.last_accessed = timezone.now()
        self.save(update_fields=['access_count', 'last_accessed'])

    def mark_processed(self, content_text=""):
        self.status = 'PROCESSED'
        self.content_extracted = True
        self.content_text = content_text
        self.save(update_fields=['status', 'content_extracted', 'content_text'])

    def mark_failed(self, error_message):
        self.status = 'FAILED'
        self.processing_error = error_message
        self.save(update_fields=['status', 'processing_error'])