from django.core.management.base import BaseCommand, CommandError
from django.db import connection

from core.models import Chunk, Config
from core.registry import EMBEDDING_REGISTRY
from process.embeddings import embed_texts

BATCH_SIZE = 64


class Command(BaseCommand):
    help = (
        'Switch the embedding provider/model and re-embed every chunk. Destructive: '
        'clears all existing embeddings before recomputing them, since a dimension '
        'change makes the old vectors incompatible with the new column.'
    )

    def add_arguments(self, parser):
        parser.add_argument('--provider', required=True, help='e.g. ollama, openai, google')
        parser.add_argument('--model', required=True, help='e.g. text-embedding-3-small')
        parser.add_argument('--yes', action='store_true', help='skip the confirmation prompt')

    def handle(self, *args, **options):
        provider = options['provider']
        model = options['model']

        if provider not in EMBEDDING_REGISTRY:
            raise CommandError(f"Unknown embedding provider '{provider}'")
        if model not in EMBEDDING_REGISTRY[provider]:
            raise CommandError(f"Unknown embedding model '{model}' for provider '{provider}'")
        dimension = EMBEDDING_REGISTRY[provider][model]

        total = Chunk.objects.count()
        if not options['yes']:
            confirm = input(
                f"This will clear embeddings for all {total} chunks and re-embed them with "
                f"{provider}/{model} ({dimension}d). Continue? [y/N] "
            )
            if confirm.strip().lower() != 'y':
                self.stdout.write('Aborted.')
                return

        self.stdout.write('Dropping index and resizing embedding column...')
        with connection.cursor() as cur:
            cur.execute("DROP INDEX IF EXISTS idx_chunks_embedding;")
            cur.execute("UPDATE chunks SET embedding = NULL;")
            cur.execute(f"ALTER TABLE chunks ALTER COLUMN embedding TYPE vector({dimension});")
            cur.execute(
                "CREATE INDEX idx_chunks_embedding ON chunks USING hnsw (embedding vector_cosine_ops);"
            )

        Config.objects.update_or_create(
            id=1,
            defaults=dict(
                embedding_provider=provider,
                embedding_model_name=model,
                embedding_dimensions=dimension,
                embedding_locked=True,
            ),
        )

        self.stdout.write(f'Re-embedding {total} chunks...')
        chunk_ids = list(Chunk.objects.values_list('id', flat=True))
        done = 0
        for i in range(0, len(chunk_ids), BATCH_SIZE):
            batch = list(Chunk.objects.filter(id__in=chunk_ids[i:i + BATCH_SIZE]))
            texts = [c.text for c in batch]
            try:
                vectors = embed_texts(texts, task='document')
            except Exception as e:
                raise CommandError(f'Embedding batch failed at offset {i}: {e}')
            for chunk, vector in zip(batch, vectors):
                Chunk.objects.filter(id=chunk.id).update(embedding=vector)
            done += len(batch)
            self.stdout.write(f'  {done}/{total}')

        self.stdout.write(self.style.SUCCESS(
            f'Done. {done} chunks re-embedded with {provider}/{model}.'
        ))
