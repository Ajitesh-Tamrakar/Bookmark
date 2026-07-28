from django.core.management.base import BaseCommand

from core.db import ensure_embedding_index
from core.models import Config


class Command(BaseCommand):
    help = (
        'Ensure chunks.embedding is sized to the configured embedding dimension '
        'and has a matching HNSW index (idempotent -- safe to run on every '
        'container boot). No-ops quietly if setup has not chosen an embedding '
        'model yet.'
    )

    def handle(self, *args, **options):
        config = Config.objects.filter(id=1).first()
        dimension = config.embedding_dimensions if config else None

        if dimension is None:
            self.stdout.write(
                'No embedding dimension configured yet (setup not complete) -- '
                'nothing to do.'
            )
            return

        result = ensure_embedding_index(dimension)

        if result['action'] == 'skipped':
            self.stdout.write(
                f"chunks.embedding already vector({result['dimension']}) "
                f"(index present={result['index_built']}) -- nothing to do."
            )
        elif result['index_built']:
            self.stdout.write(self.style.SUCCESS(
                f"chunks.embedding resized to vector({result['dimension']}) "
                f"and HNSW index rebuilt."
            ))
        else:
            self.stdout.write(self.style.WARNING(
                f"chunks.embedding resized to vector({result['dimension']}) but "
                f"the dimension exceeds pgvector's HNSW limit -- index NOT "
                f"built; search will use a sequential scan."
            ))
