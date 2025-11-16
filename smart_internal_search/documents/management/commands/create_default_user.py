from django.core.management.base import BaseCommand
from django.contrib.auth.models import User


class Command(BaseCommand):
    help = 'Create a default superuser for development'

    def handle(self, *args, **options):
        if not User.objects.filter(username='admin').exists():
            User.objects.create_superuser(
                username='admin',
                email='admin@example.com',
                password='admin123'
            )
            self.stdout.write(self.style.SUCCESS('Created default admin user: admin / admin123'))
        else:
            self.stdout.write(self.style.SUCCESS('Admin user already exists'))

        # Create a default user for uploads
        if not User.objects.filter(username='upload_user').exists():
            User.objects.create_user(
                username='upload_user',
                email='upload@example.com',
                password='uploadpass123'
            )
            self.stdout.write(self.style.SUCCESS('Created upload user: upload_user / uploadpass123'))