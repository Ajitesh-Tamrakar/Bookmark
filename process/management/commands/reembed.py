from django.core.management.base import BaseCommand
from core.models import Bookmark
from process.pipeline import chunking, embedding


class Command(BaseCommand):
    help = (
        'Re-chunk and re-embed every processed bookmark. Run this after changing '
        'chunking logic, chunk size, or embedding prefixes so existing bookmarks '
        'pick up the new behavior.'
    )

    def handle(self, *args, **options):
        bookmarks = Bookmark.objects.filter(processing_status='complete')
        total = bookmarks.count()
        self.stdout.write(f'Re-embedding {total} bookmarks...')

        failures = 0
        for i, bookmark in enumerate(bookmarks, start=1):
            chunk_result = chunking(bookmark)
            if chunk_result['status'] != 'success':
                failures += 1
                self.stderr.write(f'[{i}/{total}] {bookmark.id} chunking failed: {chunk_result["error"]}')
                continue

            embed_result = embedding(bookmark)
            if embed_result['status'] != 'success':
                failures += 1
                self.stderr.write(f'[{i}/{total}] {bookmark.id} embedding failed: {embed_result["error"]}')
                continue

            self.stdout.write(f'[{i}/{total}] {bookmark.id} re-embedded')

        if failures:
            self.stdout.write(self.style.WARNING(f'Re-embed pass complete with {failures} failure(s).'))
        else:
            self.stdout.write(self.style.SUCCESS('Re-embed pass complete.'))
