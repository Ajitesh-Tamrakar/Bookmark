import logging
import time
import traceback

from django.core.management.base import BaseCommand
from django.db import transaction
from django.utils import autoreload
from django.utils.timezone import now

from core.db import record_worker_idle, record_worker_working, repair_unembedded_complete_bookmarks
from core.models import Bookmark
from process.pipeline import run_pipeline

logger = logging.getLogger(__name__)


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

        while True:
            pending = None
            try:
                print('Checking for pending bookmarks...', flush=True)
                pending = Bookmark.objects.filter(processing_status='pending').first()
                if pending is None:
                    record_worker_idle()
                    time.sleep(5)
                    continue

                with transaction.atomic():
                    print('Found pending bookmark:', pending.id, flush=True)
                    claimed = (
                        Bookmark.objects
                        .select_for_update()
                        .filter(id=pending.id)
                    )
                    claimed.update(
                        processing_status='processing',
                        processing_started_at=now(),
                        current_step='extraction',
                    )

                pending.refresh_from_db()
                record_worker_working(pending.id)
                run_pipeline(pending)
                time.sleep(5)

            except (KeyboardInterrupt, SystemExit):
                self.stdout.write('Forced stop: keyboard interrupt')
                break

            except Exception:
                logger.exception(
                    'Unhandled exception in worker loop (bookmark=%s)',
                    pending.id if pending else None,
                )
                if pending is not None:
                    new_retry_count = pending.retry_count + 1
                    Bookmark.objects.filter(id=pending.id).update(
                        retry_count=new_retry_count,
                        processing_status='pending' if new_retry_count < 3 else 'failed',
                        current_step=None,
                        processing_started_at=None,
                        failed_at=pending.current_step or 'extraction',
                        processing_error=traceback.format_exc(),
                    )
                time.sleep(5)
