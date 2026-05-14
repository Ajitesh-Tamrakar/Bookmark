from django.core.management.base import BaseCommand
from process.pipeline import run_pipeline
from core.models import Bookmark
from django.db import transaction
import time
class Command(BaseCommand):

    help = 'Runs the background processing worker.'

    def handle(self, *args, **options):
        Bookmark.objects.filter(processing_status='processing').update(
            processing_status = 'pending'
        )

        try:
            while True:
                pending = Bookmark.objects.filter(processing_status ='pending').first()
                if pending is None:
                    time.sleep(5)
                    continue

                with transaction.atomic():
                    
                    process = (
                        Bookmark.objects
                        .select_for_update()
                        .filter(id=pending.id)
                    )             

                    process.processing_status = 'processing'
                    
                    process.save()
        
                run_pipeline(process)


                time.sleep(5)
        except KeyboardInterrupt:
            self.stdout.write('Forced stop: keyboard interrupt')
        except Exception as e:
            self.stdout.write(f'error {str(e)}')



















        # for process in stuck_processes:
        #     bad_process = Bookmark(id = process.id)
        #     if bad_process.processing_status == 'processing':
        #         Bookmark.objects.filter(id = process.id).update(
        #             processing_status = 'pending'
        #         )
