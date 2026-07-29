import json
from unittest.mock import patch

from django.test import Client, TestCase

from core.models import Bookmark, Chunk, Config


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


class StatusSummaryUnembeddedCountTests(TestCase):
    def setUp(self):
        self.client = Client()
        # Migration 0003 already seeds Config(id=1) with setup_complete=False;
        # SetupRequiredMiddleware 503s every non-exempt path until it's True.
        Config.objects.filter(id=1).update(setup_complete=True)

    def test_reports_zero_when_no_bad_bookmarks(self):
        bookmark = _bookmark()
        _chunk(bookmark, embedding=[0.1] * 8)

        response = self.client.get('/retrieve/status/summary/')

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json()['unembedded_complete_count'], 0)

    def test_reports_complete_bookmark_with_unembedded_chunk(self):
        bookmark = _bookmark()
        _chunk(bookmark, embedding=None)

        response = self.client.get('/retrieve/status/summary/')

        self.assertEqual(response.json()['unembedded_complete_count'], 1)

    def test_does_not_double_count_bookmark_with_multiple_unembedded_chunks(self):
        bookmark = _bookmark()
        _chunk(bookmark, embedding=None)
        _chunk(bookmark, embedding=None, chunk_index=1)

        response = self.client.get('/retrieve/status/summary/')

        self.assertEqual(response.json()['unembedded_complete_count'], 1)

    def test_ignores_non_complete_bookmark(self):
        bookmark = _bookmark(processing_status=Bookmark.Processing_Status.FAILED)
        _chunk(bookmark, embedding=None)

        response = self.client.get('/retrieve/status/summary/')

        self.assertEqual(response.json()['unembedded_complete_count'], 0)


class BookmarkNoteEmbedRetryTests(TestCase):
    """bookmark_note() retries embedding just the note chunk inline instead of
    requeuing the whole bookmark for a full pipeline re-run over one chunk."""

    def setUp(self):
        self.client = Client()
        Config.objects.filter(id=1).update(setup_complete=True)
        self.bookmark = _bookmark()

    def _patch_note(self, note='a note'):
        return self.client.patch(
            f'/retrieve/bookmarks/{self.bookmark.id}/note/',
            data=json.dumps({'note': note}),
            content_type='application/json',
        )

    @patch('retrieve.views.time.sleep')
    @patch('retrieve.views.embed_texts', return_value=[[0.1] * 8])
    def test_successful_embed_reports_note_indexed_true(self, mock_embed, mock_sleep):
        response = self._patch_note()

        self.assertEqual(response.status_code, 200)
        self.assertTrue(response.json()['note_indexed'])
        mock_embed.assert_called_once()
        mock_sleep.assert_not_called()

    @patch('retrieve.views.time.sleep')
    @patch('retrieve.views.embed_texts', side_effect=Exception('ollama down'))
    def test_all_attempts_failing_reports_note_indexed_false(self, mock_embed, mock_sleep):
        response = self._patch_note()

        self.assertEqual(response.status_code, 200)
        self.assertFalse(response.json()['note_indexed'])
        self.assertEqual(mock_embed.call_count, 3)
        self.assertEqual(mock_sleep.call_count, 2)

    @patch('retrieve.views.time.sleep')
    @patch('retrieve.views.embed_texts', side_effect=[Exception('transient'), [[0.1] * 8]])
    def test_succeeds_on_retry_reports_note_indexed_true(self, mock_embed, mock_sleep):
        response = self._patch_note()

        self.assertEqual(response.status_code, 200)
        self.assertTrue(response.json()['note_indexed'])
        self.assertEqual(mock_embed.call_count, 2)
        mock_sleep.assert_called_once()

        chunk = Chunk.objects.get(bookmark=self.bookmark, chunk_type=Chunk.ChunkType.NOTE)
        self.assertIsNotNone(chunk.embedding)


class SearchPaginationTests(TestCase):
    """B-13: search() should cap results to a page instead of returning every
    embedded bookmark, and deep=1 should be able to page past that cap."""

    FIXTURE_SIZE = 30

    def setUp(self):
        self.client = Client()
        Config.objects.filter(id=1).update(setup_complete=True)
        for i in range(self.FIXTURE_SIZE):
            bookmark = _bookmark(url=f'https://example.com/{i}')
            _chunk(bookmark, embedding=[0.1 + i * 0.001] * 8)

    @patch('retrieve.views.embed_texts', return_value=[[0.1] * 8])
    def test_default_search_caps_at_default_limit_with_has_more(self, mock_embed):
        response = self.client.get('/retrieve/search/?q=test')

        data = response.json()
        self.assertEqual(response.status_code, 200)
        self.assertEqual(len(data['results']), 25)
        self.assertTrue(data['has_more'])

    @patch('retrieve.views.embed_texts', return_value=[[0.1] * 8])
    def test_deep_search_with_higher_limit_returns_more_than_default(self, mock_embed):
        response = self.client.get('/retrieve/search/?q=test&deep=1&limit=100')

        data = response.json()
        self.assertEqual(response.status_code, 200)
        self.assertEqual(len(data['results']), self.FIXTURE_SIZE)
        self.assertGreater(len(data['results']), 25)
        self.assertFalse(data['has_more'])
