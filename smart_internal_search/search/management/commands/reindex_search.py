from django.core.management.base import BaseCommand
from search.utils import SearchIndexer


class Command(BaseCommand):
    help = 'Reindex all documents for search'

    def add_arguments(self, parser):
        parser.add_argument(
            '--background',
            action='store_true',
            help='Run reindexing as a background task',
        )

    def handle(self, *args, **options):
        if options['background']:
            from documents.tasks import reindex_all_documents_task
            task = reindex_all_documents_task.delay()
            self.stdout.write(
                self.style.SUCCESS(f'Started background reindexing task: {task.id}')
            )
        else:
            result = SearchIndexer.reindex_all()
            self.stdout.write(
                self.style.SUCCESS(result)
            )