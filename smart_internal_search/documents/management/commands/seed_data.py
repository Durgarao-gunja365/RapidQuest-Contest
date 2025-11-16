from django.core.management.base import BaseCommand
from django.contrib.auth.models import User
from documents.models import Team, Project, Topic, Document
from django.core.files.base import ContentFile
import os
from datetime import datetime


class Command(BaseCommand):
    help = 'Seed initial data for testing'

    def handle(self, *args, **options):
        # Create admin user if not exists
        admin_user, created = User.objects.get_or_create(
            username='admin',
            defaults={
                'email': 'admin@example.com',
                'is_staff': True,
                'is_superuser': True
            }
        )
        if created:
            admin_user.set_password('admin123')
            admin_user.save()
            self.stdout.write(self.style.SUCCESS('Created admin user'))

        # Create regular user
        user, created = User.objects.get_or_create(
            username='testuser',
            defaults={
                'email': 'user@example.com',
                'first_name': 'Test',
                'last_name': 'User'
            }
        )
        if created:
            user.set_password('test123')
            user.save()
            self.stdout.write(self.style.SUCCESS('Created test user'))

        # Create teams
        marketing, _ = Team.objects.get_or_create(
            name='Marketing Team',
            defaults={'description': 'Handles all marketing activities'}
        )
        seo, _ = Team.objects.get_or_create(
            name='SEO Team',
            defaults={'description': 'Search Engine Optimization team'}
        )
        content, _ = Team.objects.get_or_create(
            name='Content Team',
            defaults={'description': 'Content creation and management'}
        )

        # Create projects
        q4_campaign, _ = Project.objects.get_or_create(
            name='Q4 Marketing Campaign',
            defaults={'team': marketing, 'description': 'End of year marketing push'}
        )
        website_redesign, _ = Project.objects.get_or_create(
            name='Website Redesign',
            defaults={'team': seo, 'description': 'Complete website overhaul'}
        )
        blog_series, _ = Project.objects.get_or_create(
            name='Product Blog Series',
            defaults={'team': content, 'description': 'Monthly product feature articles'}
        )

        # Create topics
        topics_data = [
            'Strategy', 'Analytics', 'Social Media', 'Email Marketing',
            'SEO', 'Content Marketing', 'PPC', 'Branding'
        ]

        topics = {}
        for topic_name in topics_data:
            topic, _ = Topic.objects.get_or_create(name=topic_name)
            topics[topic_name] = topic

        # Create sample documents with text content
        sample_documents = [
            {
                'title': 'Q4 Marketing Strategy',
                'description': 'Complete marketing strategy for Q4 including budget and timelines',
                'team': marketing,
                'project': q4_campaign,
                'topics': [topics['Strategy'], topics['Analytics']],
                'content': 'This document outlines our Q4 marketing strategy...'
            },
            {
                'title': 'SEO Best Practices Guide',
                'description': 'Internal guide for SEO best practices and procedures',
                'team': seo,
                'project': website_redesign,
                'topics': [topics['SEO']],
                'content': 'SEO best practices include on-page optimization...'
            },
            {
                'title': 'Content Calendar 2024',
                'description': 'Monthly content calendar for blog and social media',
                'team': content,
                'project': blog_series,
                'topics': [topics['Content Marketing'], topics['Social Media']],
                'content': 'January: Product launch content, February: Customer stories...'
            },
            {
                'title': 'Social Media Analytics Report',
                'description': 'Monthly analytics report for social media performance',
                'team': marketing,
                'project': q4_campaign,
                'topics': [topics['Social Media'], topics['Analytics']],
                'content': 'Instagram engagement increased by 15% this month...'
            },
        ]

        for doc_data in sample_documents:
            doc, created = Document.objects.get_or_create(
                title=doc_data['title'],
                defaults={
                    'description': doc_data['description'],
                    'uploaded_by': admin_user,
                    'team': doc_data['team'],
                    'project': doc_data['project'],
                    'file_type': 'TXT',
                    'file_size': len(doc_data['content']),
                    'content_extracted': True,
                    'content_text': doc_data['content']
                }
            )
            if created:
                # Create a dummy file
                dummy_file = ContentFile(doc_data['content'].encode(),
                                         name=f"{doc_data['title'].replace(' ', '_')}.txt")
                doc.file.save(dummy_file.name, dummy_file)
                doc.topics.set(doc_data['topics'])
                self.stdout.write(self.style.SUCCESS(f'Created document: {doc_data["title"]}'))

        self.stdout.write(self.style.SUCCESS('Successfully seeded initial data!'))
        self.stdout.write(self.style.SUCCESS('Admin user: admin / admin123'))
        self.stdout.write(self.style.SUCCESS('Test user: testuser / test123'))