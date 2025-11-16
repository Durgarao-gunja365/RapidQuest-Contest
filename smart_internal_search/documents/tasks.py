import os
from celery import shared_task
from django.conf import settings
from .models import Document
from .utils import DocumentProcessor
from search.utils import SearchIndexer


@shared_task
def process_document_task(document_id):
    """Background task to process document and extract text"""
    try:
        document = Document.objects.get(id=document_id)

        # Get the file path
        file_path = document.file.path

        # Extract text content
        content_text = DocumentProcessor.extract_text_from_file(file_path, document.file_type)

        # Update document status and content
        document.mark_processed(content_text)

        # Index the document for search
        SearchIndexer.index_document(document)

        return f"Successfully processed and indexed document: {document.title}"

    except Document.DoesNotExist:
        return f"Document with id {document_id} does not exist"
    except Exception as e:
        # Update document with error
        document = Document.objects.get(id=document_id)
        document.mark_failed(str(e))
        return f"Error processing document: {str(e)}"


@shared_task
def reindex_all_documents_task():
    """Background task to reindex all documents"""
    try:
        result = SearchIndexer.reindex_all()
        return result
    except Exception as e:
        return f"Error reindexing documents: {str(e)}"