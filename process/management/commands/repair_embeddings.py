from django.core.management.base import BaseCommand

from core.db import find_unembedded_complete_bookmark_ids, repair_unembedded_complete_bookmarks
from core.models import Bookmark


class Command(BaseCommand):
    help = (
        'Requeue "complete" bookmarks that have chunks with no embedding (the B-23 '
        'invariant violation) back to "pending" so the worker reprocesses them.'
    )

    def add_arguments(self, parser):
        parser.add_argument('--dry-run', action='store_true', help='List affected bookmarks without changing anything.')

    def handle(self, *args, **options):
        if options['dry_run']:
            ids = find_unembedded_complete_bookmark_ids(Bookmark)
            if not ids:
                self.stdout.write(self.style.SUCCESS('No complete bookmarks with unembedded chunks found.'))
                return
            self.stdout.write(f'{len(ids)} bookmark(s) would be requeued:')
            for b in Bookmark.objects.filter(id__in=ids).values('id', 'title'):
                self.stdout.write(f"  {b['id']}  {b['title']}")
            return

        ids = repair_unembedded_complete_bookmarks(Bookmark)
        if not ids:
            self.stdout.write(self.style.SUCCESS('No complete bookmarks with unembedded chunks found.'))
        else:
            self.stdout.write(self.style.SUCCESS(f'Requeued {len(ids)} bookmark(s) as pending: {ids}'))
