from django.core.management.base import BaseCommand
from django.utils import autoreload
from process.pipeline import run_pipeline
from core.db import repair_unembedded_complete_bookmarks
from core.models import Bookmark
from django.db import transaction
from django.utils.timezone import now
import time


class Command(BaseCommand):
    help = 'Runs the background processing worker.'

    def handle(self, *args, **options):
        autoreload.run_with_reloader(self.run_worker_loop)

    def run_worker_loop(self):
        from core.metrics import set_process_role, init_session
        set_process_role("worker")
        init_session()
        print('Worker started', flush=True)
        Bookmark.objects.filter(processing_status='processing').update(
            processing_status='pending',
            current_step=None,
            processing_started_at=None,
        )
        repaired = repair_unembedded_complete_bookmarks(Bookmark)
        if repaired:
            print(f'Repaired {len(repaired)} complete bookmark(s) with unembedded chunks', flush=True)

        try:
            while True:

                print('Checking for pending bookmarks...', flush=True)
                pending = Bookmark.objects.filter(processing_status='pending').first()
                if pending is None:
                    time.sleep(5)
                    continue

                with transaction.atomic():
                    print('Found pending bookmark:', pending.id, flush=True)
                    process = (
                        Bookmark.objects
                        .select_for_update()
                        .filter(id=pending.id)
                    )
                    process.update(
                        processing_status='processing',
                        processing_started_at=now(),
                        current_step='extraction',
                    )

                pending.refresh_from_db()
                run_pipeline(pending)
                time.sleep(5)
        except KeyboardInterrupt:
            self.stdout.write('Forced stop: keyboard interrupt')
        except Exception as e:
            self.stdout.write(f'error {str(e)}')