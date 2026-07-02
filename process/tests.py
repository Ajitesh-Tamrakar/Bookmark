import base64
import os
import tempfile
from types import SimpleNamespace
from unittest.mock import Mock, patch

from django.test import SimpleTestCase

from core.models import Bookmark
from process.image_description import extract_image, extract_screenshot
from process.media_download import decode_base64_image
from process.pipeline import chunking
from process.video_extraction import extract_video_twitter, extract_video_youtube


def _words(prefix, count):
    return " ".join(f"{prefix}_{i}" for i in range(count))


def _bookmark(**overrides):
    defaults = {
        "id": "bookmark-id",
        "url": "https://example.com",
        "platform": Bookmark.Platform.LINKEDIN,
        "has_text": False,
        "has_image": False,
        "has_video": False,
        "has_highlight": False,
        "has_screenshot": False,
        "raw_text": {"text": None, "image": None, "video": None, "screenshot": None},
        "platform_metadata": {},
        "refresh_from_db": Mock(),
    }
    defaults.update(overrides)
    return SimpleNamespace(**defaults)


class ChunkingTests(SimpleTestCase):
    def test_text_only_bookmark_creates_post_chunk_without_index(self):
        bookmark = _bookmark(
            url="https://example.com/post",
            platform=Bookmark.Platform.LINKEDIN,
            has_text=True,
            raw_text={"text": "short social post", "image": None, "video": None},
        )

        with patch("process.chunk_builders.Chunk.objects.create") as create_chunk:
            result = chunking(bookmark)

        self.assertEqual(result, {'stage': 'chunking', 'status': 'success', 'error': ''})
        create_chunk.assert_called_once()
        self.assertEqual(create_chunk.call_args.kwargs["text"], "short social post")
        self.assertEqual(create_chunk.call_args.kwargs["chunk_type"], "post")
        self.assertIsNone(create_chunk.call_args.kwargs["chunk_index"])
        self.assertIsNone(create_chunk.call_args.kwargs["timestamp_seconds"])
        self.assertEqual(create_chunk.call_args.kwargs["word_count"], 3)

    def test_youtube_segments_create_timestamped_overlapping_video_chunks(self):
        segments = [
            {"text": _words(f"segment{index}", 100), "start": index * 10, "duration": 10}
            for index in range(6)
        ]
        bookmark = _bookmark(
            url="https://www.youtube.com/watch?v=abc123",
            platform=Bookmark.Platform.YOUTUBE,
            has_video=True,
            raw_text={"text": None, "image": None, "video": segments},
        )

        with patch("process.chunk_builders.Chunk.objects.create") as create_chunk:
            result = chunking(bookmark)

        self.assertEqual(result, {'stage': 'chunking', 'status': 'success', 'error': ''})
        chunks = [call.kwargs for call in create_chunk.call_args_list]
        self.assertEqual(len(chunks), 2)
        self.assertEqual([chunk["chunk_type"] for chunk in chunks], ["video", "video"])
        self.assertEqual([chunk["chunk_index"] for chunk in chunks], [0, 1])
        self.assertEqual([chunk["timestamp_seconds"] for chunk in chunks], [0, 30])
        self.assertGreater(chunks[0]["word_count"], chunks[1]["word_count"])
        self.assertEqual(chunks[0]["text"].split()[-100:], chunks[1]["text"].split()[:100])

    def test_none_image_value_creates_zero_chunks_successfully(self):
        bookmark = _bookmark(
            url="https://example.com/image",
            platform=Bookmark.Platform.PINTEREST,
            has_image=True,
            raw_text={"text": None, "image": None, "video": None},
        )

        with patch("process.chunk_builders.Chunk.objects.create") as create_chunk:
            result = chunking(bookmark)

        self.assertEqual(result, {'stage': 'chunking', 'status': 'success', 'error': ''})
        create_chunk.assert_not_called()

    def test_unregistered_video_platform_fails_explicitly(self):
        bookmark = _bookmark(
            url="https://example.com/video",
            platform=Bookmark.Platform.WEB,
            has_video=True,
            raw_text={"text": None, "image": None, "video": "flat video text"},
        )

        with patch("process.chunk_builders.Chunk.objects.create") as create_chunk:
            result = chunking(bookmark)

        self.assertEqual(result["stage"], "chunking")
        self.assertEqual(result["status"], "failed")
        self.assertIn("no chunker registered for platform 'web'", result["error"])
        create_chunk.assert_not_called()

    def test_highlight_bookmark_creates_highlight_chunk(self):
        bookmark = _bookmark(
            url="https://example.com/article",
            platform=Bookmark.Platform.WEB,
            has_highlight=True,
            platform_metadata={"highlighted_text": "a selected passage"},
        )

        with patch("process.chunk_builders.Chunk.objects.create") as create_chunk:
            result = chunking(bookmark)

        self.assertEqual(result, {'stage': 'chunking', 'status': 'success', 'error': ''})
        create_chunk.assert_called_once()
        self.assertEqual(create_chunk.call_args.kwargs["text"], "a selected passage")
        self.assertEqual(create_chunk.call_args.kwargs["chunk_type"], "highlight")
        self.assertEqual(create_chunk.call_args.kwargs["chunk_index"], 0)
        self.assertIsNone(create_chunk.call_args.kwargs["timestamp_seconds"])

    def test_highlight_bookmark_with_missing_text_creates_zero_chunks(self):
        bookmark = _bookmark(
            url="https://example.com/article",
            platform=Bookmark.Platform.WEB,
            has_highlight=True,
            platform_metadata={},
        )

        with patch("process.chunk_builders.Chunk.objects.create") as create_chunk:
            result = chunking(bookmark)

        self.assertEqual(result, {'stage': 'chunking', 'status': 'success', 'error': ''})
        create_chunk.assert_not_called()

    def test_screenshot_bookmark_creates_screenshot_chunk(self):
        bookmark = _bookmark(
            url="https://example.com/article",
            platform=Bookmark.Platform.WEB,
            has_screenshot=True,
            raw_text={"text": None, "image": None, "video": None, "screenshot": "a landing page vibe"},
        )

        with patch("process.chunk_builders.Chunk.objects.create") as create_chunk:
            result = chunking(bookmark)

        self.assertEqual(result, {'stage': 'chunking', 'status': 'success', 'error': ''})
        create_chunk.assert_called_once()
        self.assertEqual(create_chunk.call_args.kwargs["text"], "a landing page vibe")
        self.assertEqual(create_chunk.call_args.kwargs["chunk_type"], "screenshot")
        self.assertEqual(create_chunk.call_args.kwargs["chunk_index"], 0)


class ExtractionImageTests(SimpleTestCase):

    def _image_bookmark(self, platform='pinterest', metadata=None):
        return _bookmark(
            platform=platform,
            has_image=True,
            platform_metadata=metadata if metadata is not None else {'image_url': 'https://example.com/img.jpg'},
        )

    @patch('process.image_description.cleanup_temp_file')
    @patch('process.image_description.temp_file_path', return_value='/tmp/test_image.jpg')
    @patch('process.image_description.update_raw_text_key')
    @patch('process.image_description.analyze_image', return_value='A beautiful sunset over mountains')
    @patch('process.image_description.download_image', return_value={'status': 'success', 'error': ''})
    def test_successful_image_description_is_written(self, mock_dl, mock_vlm, mock_update, mock_path, mock_cleanup):
        bookmark = self._image_bookmark()
        result = extract_image(bookmark)
        self.assertEqual(result, {'status': 'success', 'error': ''})
        mock_update.assert_called_once_with(bookmark, 'image', 'A beautiful sunset over mountains')
        mock_cleanup.assert_called_once_with('/tmp/test_image.jpg')

    @patch('process.image_description.cleanup_temp_file')
    @patch('process.image_description.temp_file_path', return_value='/tmp/test_image.jpg')
    @patch('process.image_description.download_image', return_value={'status': 'failed', 'error': 'connection timeout'})
    def test_image_download_failure_returns_explicit_failed(self, mock_dl, mock_path, mock_cleanup):
        bookmark = self._image_bookmark()
        result = extract_image(bookmark)
        self.assertEqual(result['status'], 'failed')
        self.assertIn('download failed', result['error'])
        self.assertIn('connection timeout', result['error'])
        mock_cleanup.assert_called_once()

    @patch('process.image_description.cleanup_temp_file')
    @patch('process.image_description.temp_file_path', return_value='/tmp/test_image.jpg')
    @patch('process.image_description.update_raw_text_key')
    @patch('process.image_description.analyze_image', return_value=None)
    @patch('process.image_description.download_image', return_value={'status': 'success', 'error': ''})
    def test_vlm_returns_nothing_is_explicit_failed_not_none_write(self, mock_dl, mock_vlm, mock_update, mock_path, mock_cleanup):
        bookmark = self._image_bookmark()
        result = extract_image(bookmark)
        self.assertEqual(result['status'], 'failed')
        self.assertIn('VLM returned no description', result['error'])
        mock_update.assert_not_called()

    def test_missing_image_url_in_metadata_returns_failed(self):
        bookmark = self._image_bookmark(metadata={})
        result = extract_image(bookmark)
        self.assertEqual(result['status'], 'failed')
        self.assertIn('no image URL found in platform_metadata', result['error'])

    def test_resolver_twitter_uses_first_images_entry(self):
        bookmark = self._image_bookmark(
            platform='twitter',
            metadata={'images': ['https://pbs.twimg.com/img.jpg', 'https://pbs.twimg.com/img2.jpg']},
        )
        with patch('process.image_description.cleanup_temp_file'), \
             patch('process.image_description.temp_file_path', return_value='/tmp/t.jpg'), \
             patch('process.image_description.update_raw_text_key'), \
             patch('process.image_description.analyze_image', return_value='desc'), \
             patch('process.image_description.download_image', return_value={'status': 'success', 'error': ''}) as mock_dl:
            extract_image(bookmark)
            mock_dl.assert_called_once_with('https://pbs.twimg.com/img.jpg', '/tmp/t.jpg')

    def test_resolver_linkedin_uses_first_images_entry(self):
        bookmark = self._image_bookmark(
            platform='linkedin',
            metadata={'images': ['https://media.licdn.com/img.jpg']},
        )
        with patch('process.image_description.cleanup_temp_file'), \
             patch('process.image_description.temp_file_path', return_value='/tmp/t.jpg'), \
             patch('process.image_description.update_raw_text_key'), \
             patch('process.image_description.analyze_image', return_value='desc'), \
             patch('process.image_description.download_image', return_value={'status': 'success', 'error': ''}) as mock_dl:
            extract_image(bookmark)
            mock_dl.assert_called_once_with('https://media.licdn.com/img.jpg', '/tmp/t.jpg')


class ExtractionVideoTests(SimpleTestCase):

    @patch('process.video_extraction.cleanup_temp_file')
    @patch('process.video_extraction.temp_file_path', return_value='/tmp/test_audio.mp3')
    @patch('process.video_extraction.update_raw_text_key')
    @patch('process.video_extraction.transcribe_to_segments')
    @patch('process.video_extraction.download_audio_only', return_value={'status': 'success', 'error': ''})
    @patch('process.video_extraction.YouTubeTranscriptApi')
    def test_youtube_whisper_fallback_produces_segment_list_not_string(
            self, mock_api_cls, mock_dl, mock_transcribe, mock_update, mock_path, mock_cleanup):
        mock_api_cls.return_value.fetch.side_effect = Exception('no captions available')
        expected_segments = [
            {'text': 'Hello world', 'start': 0.0, 'duration': 5.0},
            {'text': 'How are you', 'start': 5.0, 'duration': 4.0},
        ]
        mock_transcribe.return_value = expected_segments

        bookmark = _bookmark(
            url='https://www.youtube.com/watch?v=abc123',
            platform=Bookmark.Platform.YOUTUBE,
            has_video=True,
        )
        result = extract_video_youtube(bookmark)

        self.assertEqual(result, {'status': 'success', 'error': ''})
        written = mock_update.call_args.args[2]
        self.assertIsInstance(written, list)
        self.assertEqual(written, expected_segments)

    @patch('process.video_extraction.cleanup_temp_file')
    @patch('process.video_extraction.temp_file_path', return_value='/tmp/test_audio.mp3')
    @patch('process.video_extraction.download_audio_only', return_value={'status': 'failed', 'error': 'rate limited'})
    @patch('process.video_extraction.YouTubeTranscriptApi')
    def test_youtube_whisper_fallback_audio_download_failure_returns_failed(
            self, mock_api_cls, mock_dl, mock_path, mock_cleanup):
        mock_api_cls.return_value.fetch.side_effect = Exception('no captions')

        bookmark = _bookmark(
            url='https://www.youtube.com/watch?v=abc123',
            platform=Bookmark.Platform.YOUTUBE,
            has_video=True,
        )
        result = extract_video_youtube(bookmark)

        self.assertEqual(result['status'], 'failed')
        self.assertIn('audio download failed', result['error'])
        self.assertIn('rate limited', result['error'])

    @patch('process.video_extraction.cleanup_temp_file')
    @patch('process.video_extraction.temp_file_path', return_value='/tmp/test_video.mp4')
    @patch('process.video_extraction.update_raw_text_key')
    @patch('process.video_extraction.transcribe_to_segments', return_value=[])
    @patch('process.video_extraction.download_video', return_value={'status': 'success', 'error': ''})
    def test_twitter_video_no_speech_writes_none_and_succeeds(
            self, mock_dl, mock_transcribe, mock_update, mock_path, mock_cleanup):
        bookmark = _bookmark(
            url='https://twitter.com/user/status/123',
            platform=Bookmark.Platform.TWITTER,
            has_video=True,
        )
        result = extract_video_twitter(bookmark)

        self.assertEqual(result, {'status': 'success', 'error': ''})
        mock_update.assert_called_once_with(bookmark, 'video', None)

    @patch('process.video_extraction.cleanup_temp_file')
    @patch('process.video_extraction.temp_file_path', return_value='/tmp/test_video.mp4')
    @patch('process.video_extraction.update_raw_text_key')
    @patch('process.video_extraction.transcribe_to_segments')
    @patch('process.video_extraction.download_video', return_value={'status': 'success', 'error': ''})
    def test_twitter_video_with_speech_writes_flat_string_not_segment_list(
            self, mock_dl, mock_transcribe, mock_update, mock_path, mock_cleanup):
        mock_transcribe.return_value = [
            {'text': 'Hello', 'start': 0.0, 'duration': 1.0},
            {'text': 'world', 'start': 1.0, 'duration': 1.0},
        ]
        bookmark = _bookmark(
            url='https://twitter.com/user/status/123',
            platform=Bookmark.Platform.TWITTER,
            has_video=True,
        )
        result = extract_video_twitter(bookmark)

        self.assertEqual(result, {'status': 'success', 'error': ''})
        written = mock_update.call_args.args[2]
        self.assertIsInstance(written, str)
        self.assertEqual(written, 'Hello world')

    @patch('process.video_extraction.cleanup_temp_file')
    @patch('process.video_extraction.temp_file_path', return_value='/tmp/test_video.mp4')
    @patch('process.video_extraction.download_video', return_value={'status': 'failed', 'error': 'network error'})
    def test_twitter_video_download_failure_returns_explicit_failed(self, mock_dl, mock_path, mock_cleanup):
        bookmark = _bookmark(
            url='https://twitter.com/user/status/123',
            platform=Bookmark.Platform.TWITTER,
            has_video=True,
        )
        result = extract_video_twitter(bookmark)

        self.assertEqual(result['status'], 'failed')
        self.assertIn('video download failed', result['error'])
        self.assertIn('network error', result['error'])
        mock_cleanup.assert_called_once()


class DecodeBase64ImageTests(SimpleTestCase):

    def test_strips_data_uri_prefix_and_writes_valid_bytes(self):
        raw_bytes = b'not-really-a-jpeg-but-fine-for-this-test'
        encoded = base64.b64encode(raw_bytes).decode('ascii')
        data_uri = f'data:image/jpeg;base64,{encoded}'

        with tempfile.TemporaryDirectory() as tmp_dir:
            dest_path = os.path.join(tmp_dir, 'screenshot.jpg')
            result = decode_base64_image(data_uri, dest_path)

            self.assertEqual(result, {'status': 'success', 'error': ''})
            with open(dest_path, 'rb') as f:
                self.assertEqual(f.read(), raw_bytes)

    def test_accepts_bare_base64_string_without_prefix(self):
        raw_bytes = b'bare-base64-no-prefix'
        encoded = base64.b64encode(raw_bytes).decode('ascii')

        with tempfile.TemporaryDirectory() as tmp_dir:
            dest_path = os.path.join(tmp_dir, 'screenshot.jpg')
            result = decode_base64_image(encoded, dest_path)

            self.assertEqual(result, {'status': 'success', 'error': ''})
            with open(dest_path, 'rb') as f:
                self.assertEqual(f.read(), raw_bytes)


class ExtractionScreenshotTests(SimpleTestCase):

    def _screenshot_bookmark(self, metadata=None):
        return _bookmark(
            platform=Bookmark.Platform.WEB,
            has_screenshot=True,
            platform_metadata=metadata if metadata is not None else {'screenshot_base64': 'data:image/jpeg;base64,abc123'},
        )

    @patch('process.image_description.cleanup_temp_file')
    @patch('process.image_description.temp_file_path', return_value='/tmp/test_screenshot.jpg')
    @patch('process.image_description.update_raw_text_key')
    @patch('process.image_description.analyze_image', return_value='A serious long-form article layout')
    @patch('process.image_description.decode_base64_image', return_value={'status': 'success', 'error': ''})
    def test_successful_screenshot_description_is_written(self, mock_decode, mock_vlm, mock_update, mock_path, mock_cleanup):
        bookmark = self._screenshot_bookmark()
        result = extract_screenshot(bookmark)
        self.assertEqual(result, {'status': 'success', 'error': ''})
        mock_update.assert_called_once_with(bookmark, 'screenshot', 'A serious long-form article layout')
        mock_cleanup.assert_called_once_with('/tmp/test_screenshot.jpg')

    @patch('process.image_description.cleanup_temp_file')
    @patch('process.image_description.temp_file_path', return_value='/tmp/test_screenshot.jpg')
    @patch('process.image_description.decode_base64_image', return_value={'status': 'failed', 'error': 'bad base64'})
    def test_decode_failure_returns_explicit_failed(self, mock_decode, mock_path, mock_cleanup):
        bookmark = self._screenshot_bookmark()
        result = extract_screenshot(bookmark)
        self.assertEqual(result['status'], 'failed')
        self.assertIn('decode failed', result['error'])
        self.assertIn('bad base64', result['error'])
        mock_cleanup.assert_called_once()

    @patch('process.image_description.cleanup_temp_file')
    @patch('process.image_description.temp_file_path', return_value='/tmp/test_screenshot.jpg')
    @patch('process.image_description.update_raw_text_key')
    @patch('process.image_description.analyze_image', return_value=None)
    @patch('process.image_description.decode_base64_image', return_value={'status': 'success', 'error': ''})
    def test_vlm_returns_nothing_is_explicit_failed_not_none_write(self, mock_decode, mock_vlm, mock_update, mock_path, mock_cleanup):
        bookmark = self._screenshot_bookmark()
        result = extract_screenshot(bookmark)
        self.assertEqual(result['status'], 'failed')
        self.assertIn('VLM returned no description', result['error'])
        mock_update.assert_not_called()

    def test_missing_screenshot_base64_in_metadata_returns_failed(self):
        bookmark = self._screenshot_bookmark(metadata={})
        result = extract_screenshot(bookmark)
        self.assertEqual(result['status'], 'failed')
        self.assertIn('no screenshot_base64 found in platform_metadata', result['error'])
