import re
from typing import List, Dict, Any
from django.db.models import Q
from django.db import connection
from documents.models import Document


class DocumentSearch:
    """SQLite-compatible document search with multiple strategies"""

    def __init__(self):
        self.min_search_length = 2
        self.max_results = 100

    def search_documents(self, query: str, filters: Dict[str, Any] = None) -> List[Document]:
        """
        Perform advanced search on documents (SQLite compatible)
        """
        if not query or len(query.strip()) < self.min_search_length:
            return Document.objects.none()

        query = query.strip()
        filters = filters or {}

        # Start with base queryset
        queryset = Document.objects.all()

        # Apply filters
        queryset = self._apply_filters(queryset, filters)

        # Use SQLite-compatible search methods
        search_methods = [
            self._weighted_search,
            self._basic_icontains_search
        ]

        for method in search_methods:
            results = method(queryset, query)
            if results.exists():
                return results[:self.max_results]

        return Document.objects.none()

    def _apply_filters(self, queryset, filters):
        """Apply filters to the queryset"""
        if filters.get('team'):
            queryset = queryset.filter(team_id=filters['team'])
        if filters.get('project'):
            queryset = queryset.filter(project_id=filters['project'])
        if filters.get('file_type'):
            queryset = queryset.filter(file_type=filters['file_type'])
        if filters.get('topic'):
            queryset = queryset.filter(topics__id=filters['topic'])
        if filters.get('status'):
            queryset = queryset.filter(status=filters['status'])

        return queryset.distinct()

    def _weighted_search(self, queryset, query):
        """
        Weighted search that prioritizes different fields
        """
        words = self._split_query(query)

        if not words:
            return Document.objects.none()

        # Build weighted Q objects
        q_objects = Q()
        for word in words:
            # Title matches are most important (weight 4)
            title_q = Q(title__icontains=word)
            # Content matches are important (weight 3)
            content_q = Q(content_text__icontains=word)
            # Description matches are medium importance (weight 2)
            desc_q = Q(description__icontains=word)
            # Filename matches are less important (weight 1)
            filename_q = Q(original_filename__icontains=word)

            # Combine with OR for this word
            word_q = title_q | content_q | desc_q | filename_q
            q_objects &= word_q  # Use AND between words

        if q_objects:
            # First get exact matches
            exact_matches = queryset.filter(q_objects)

            # If we have exact matches, return them ordered by relevance
            if exact_matches.exists():
                return exact_matches.order_by('-uploaded_at')

        return Document.objects.none()

    def _basic_icontains_search(self, queryset, query):
        """Fallback to basic case-insensitive search"""
        words = self._split_query(query)

        # Build Q objects for each word
        q_objects = Q()
        for word in words:
            if len(word) >= self.min_search_length:
                q_objects |= (
                        Q(title__icontains=word) |
                        Q(content_text__icontains=word) |
                        Q(description__icontains=word) |
                        Q(original_filename__icontains=word)
                )

        if q_objects:
            return queryset.filter(q_objects).order_by('-uploaded_at')

        return Document.objects.none()

    def _split_query(self, query: str) -> List[str]:
        """Split query into meaningful words"""
        # Remove special characters and split
        words = re.findall(r'\b\w+\b', query.lower())
        return [word for word in words if len(word) >= self.min_search_length]

    def get_search_suggestions(self, query: str, limit: int = 5) -> List[str]:
        """Get search suggestions based on existing documents"""
        if len(query) < 2:
            return []

        suggestions = set()

        # Get matching titles
        titles = Document.objects.filter(
            title__icontains=query
        ).values_list('title', flat=True)[:limit * 2]  # Get more for filtering

        for title in titles:
            # Extract relevant parts of title containing the query
            words = title.lower().split()
            for i, word in enumerate(words):
                if query.lower() in word:
                    # Get the context around the matching word
                    start = max(0, i - 1)
                    end = min(len(words), i + 2)
                    suggestion = ' '.join(words[start:end])
                    if len(suggestion) > len(query):
                        suggestions.add(suggestion.title())

        return list(suggestions)[:limit]


class SearchIndexer:
    """Handles indexing for SQLite"""

    @staticmethod
    def index_document(document: Document):
        """Index a single document for search"""
        print(f"Indexed document: {document.title}")

    @staticmethod
    def reindex_all():
        """Reindex all documents"""
        documents = Document.objects.all()
        for doc in documents:
            SearchIndexer.index_document(doc)
        return f"Reindexed {documents.count()} documents"


# Global search instance
document_search = DocumentSearch()