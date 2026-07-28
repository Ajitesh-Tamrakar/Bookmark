from django.test import TestCase

from core.db import find_unembedded_complete_bookmark_ids, repair_unembedded_complete_bookmarks
from core.models import Bookmark, Chunk


def _bookmark(**overrides):
    defaults = dict(
        url='https://example.com',
        platform=Bookmark.Platform.WEB,
        processing_status=Bookmark.Processing_Status.COMPLETE,
    )
    defaults.update(overrides)
    return Bookmark.objects.create(**defaults)


def _chunk(bookmark, embedding=None, **overrides):
    defaults = dict(
        bookmark=bookmark,
        text='some chunk text',
        chunk_type=Chunk.ChunkType.ARTICLE,
        word_count=3,
        embedding=embedding,
    )
    defaults.update(overrides)
    return Chunk.objects.create(**defaults)


class FindUnembeddedCompleteBookmarkIdsTests(TestCase):
    def test_finds_complete_bookmark_with_unembedded_chunk(self):
        bookmark = _bookmark()
        _chunk(bookmark, embedding=None)

        self.assertEqual(find_unembedded_complete_bookmark_ids(Bookmark), [bookmark.id])

    def test_ignores_complete_bookmark_with_all_chunks_embedded(self):
        bookmark = _bookmark()
        _chunk(bookmark, embedding=[0.1] * 8)

        self.assertEqual(find_unembedded_complete_bookmark_ids(Bookmark), [])

    def test_ignores_non_complete_bookmark_with_unembedded_chunk(self):
        bookmark = _bookmark(processing_status=Bookmark.Processing_Status.PENDING)
        _chunk(bookmark, embedding=None)

        self.assertEqual(find_unembedded_complete_bookmark_ids(Bookmark), [])

    def test_does_not_duplicate_id_for_multiple_unembedded_chunks(self):
        bookmark = _bookmark()
        _chunk(bookmark, embedding=None)
        _chunk(bookmark, embedding=None, chunk_index=1)

        self.assertEqual(find_unembedded_complete_bookmark_ids(Bookmark), [bookmark.id])


class RepairUnembeddedCompleteBookmarksTests(TestCase):
    def test_requeues_as_pending_and_resets_retry_state(self):
        bookmark = _bookmark(retry_count=2, failed_at=Bookmark.Stages.EMBEDDING)
        _chunk(bookmark, embedding=None)

        repaired = repair_unembedded_complete_bookmarks(Bookmark)

        bookmark.refresh_from_db()
        self.assertEqual(repaired, [bookmark.id])
        self.assertEqual(bookmark.processing_status, Bookmark.Processing_Status.PENDING)
        self.assertEqual(bookmark.retry_count, 0)
        self.assertIsNone(bookmark.failed_at)
        self.assertIsNone(bookmark.current_step)
        self.assertIsNone(bookmark.processed_at)

    def test_is_idempotent_when_nothing_matches(self):
        self.assertEqual(repair_unembedded_complete_bookmarks(Bookmark), [])

    def test_leaves_healthy_complete_bookmark_untouched(self):
        bookmark = _bookmark()
        _chunk(bookmark, embedding=[0.1] * 8)

        repaired = repair_unembedded_complete_bookmarks(Bookmark)

        bookmark.refresh_from_db()
        self.assertEqual(repaired, [])
        self.assertEqual(bookmark.processing_status, Bookmark.Processing_Status.COMPLETE)
