from statistics import mean

from django.core.management.base import BaseCommand

from core.models import Config
from evaluate.models import EvalRun, EvalRunQuery, GoldenSetEntry
from evaluate.utils import compute_fingerprint
from process.chunk_builders import CHUNK_OVERLAP_WORDS
from process.embeddings import embed_texts
from retrieve.views import _best_chunks


class Command(BaseCommand):
    help = 'Run the golden-set retrieval eval (Recall@1, Recall@5, MRR) and record an EvalRun.'

    def add_arguments(self, parser):
        parser.add_argument('--notes', default='', help='Freeform notes to store on the EvalRun')

    def handle(self, *args, **options):
        entries = list(GoldenSetEntry.objects.select_related('expected_bookmark').all())
        if not entries:
            self.stdout.write(self.style.WARNING('No golden set entries — nothing to evaluate.'))
            return

        fingerprint = compute_fingerprint(e.id for e in entries)

        run_results = []
        for entry in entries:
            query_vector = embed_texts([entry.query_text], task='query')[0]
            rows = _best_chunks(query_vector)
            rows.sort(key=lambda r: r[1])
            bid_list = [r[0] for r in rows]
            expected_id = str(entry.expected_bookmark_id)
            found_rank = bid_list.index(expected_id) + 1 if expected_id in bid_list[:20] else None
            run_results.append((entry, found_rank))
            self.stdout.write(f'  {entry.query_text!r}: rank={found_rank}')

        recall_at_1 = mean(1 if rank == 1 else 0 for _, rank in run_results)
        recall_at_5 = mean(1 if rank is not None and rank <= 5 else 0 for _, rank in run_results)
        mrr = mean(1 / rank if rank else 0 for _, rank in run_results)

        eval_run = EvalRun.objects.create(
            golden_set_fingerprint=fingerprint,
            embedding_model=Config.get().embedding_model_name,
            chunk_size=None,
            chunk_overlap=CHUNK_OVERLAP_WORDS,
            prefix_enabled=False,
            hybrid_enabled=False,
            num_queries=len(run_results),
            recall_at_1=recall_at_1,
            recall_at_5=recall_at_5,
            mrr=mrr,
            notes=options['notes'],
        )
        EvalRunQuery.objects.bulk_create([
            EvalRunQuery(
                eval_run=eval_run,
                golden_set_entry=entry,
                query_text_snapshot=entry.query_text,
                expected_bookmark_id_snapshot=entry.expected_bookmark_id,
                bucket_snapshot=entry.bucket,
                found_rank=rank,
            )
            for entry, rank in run_results
        ])

        self.stdout.write(self.style.SUCCESS(
            f'Done. {len(run_results)} queries — Recall@1={recall_at_1:.3f} '
            f'Recall@5={recall_at_5:.3f} MRR={mrr:.3f}'
        ))
