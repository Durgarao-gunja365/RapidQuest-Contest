from django.contrib import admin

# Register your models here.
from django.contrib import admin
from .models import Document, Team, Project, Topic


@admin.register(Team)
class TeamAdmin(admin.ModelAdmin):
    list_display = ['name', 'description']
    search_fields = ['name']


@admin.register(Project)
class ProjectAdmin(admin.ModelAdmin):
    list_display = ['name', 'team', 'description']
    list_filter = ['team']
    search_fields = ['name', 'team__name']


@admin.register(Topic)
class TopicAdmin(admin.ModelAdmin):
    list_display = ['name', 'description']
    search_fields = ['name']


@admin.register(Document)
class DocumentAdmin(admin.ModelAdmin):
    list_display = ['title', 'file_type', 'team', 'project', 'uploaded_by', 'uploaded_at']
    list_filter = ['file_type', 'team', 'project', 'uploaded_at']
    search_fields = ['title', 'description', 'content_text']
    readonly_fields = ['file_size', 'uploaded_at', 'updated_at', 'last_accessed']
    filter_horizontal = ['topics']

    fieldsets = (
        ('Basic Information', {
            'fields': ('title', 'description', 'file', 'file_type', 'file_size')
        }),
        ('Categorization', {
            'fields': ('team', 'project', 'topics')
        }),
        ('Metadata', {
            'fields': ('uploaded_by', 'uploaded_at', 'updated_at', 'last_accessed')
        }),
        ('Search Content', {
            'fields': ('content_extracted', 'content_text'),
            'classes': ('collapse',)
        }),
    )