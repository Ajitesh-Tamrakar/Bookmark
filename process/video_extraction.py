import logging
from urllib.parse import parse_qs, urlparse

from youtube_transcript_api import YouTubeTranscriptApi

from process.helper_function import cleanup_temp_file, temp_file_path, update_raw_text_key
from process.media_download import download_audio_only, download_video
from process.transcription import transcribe_to_segments

logger = logging.getLogger(__name__)


def extract_video_youtube(bookmark):
    url = bookmark.url

    try:
        parsed_url = urlparse(url)
        query_params = parse_qs(parsed_url.query)
        if query_params.get('v') is None:
            logger.error(f'No video ID found in URL: {url} for bookmark ID: {bookmark.id}')
            return {'status': 'failed', 'error': 'No video ID found in URL'}
        video_id = query_params.get('v')[0] #type: ignore
        logger.info(f'Extracted video ID: {video_id} from URL: {url} for bookmark ID: {bookmark.id}')

        transcript = YouTubeTranscriptApi().fetch(video_id, languages=['en', 'hi'])
        logger.info(f'Fetched transcript for video ID: {video_id} successfully for bookmark ID: {bookmark.id}')
        wrapper = []
        for line in transcript:
            wrapper.append({
                'text': line.text,
                'start': line.start,
                'duration': line.duration
            })
        logger.info(f'YouTube transcript fetched successfully for bookmark ID: {bookmark.id}, URL: {bookmark.url}')
        update_raw_text_key(bookmark, "video", wrapper)
        return {'status': 'success', 'error': ''}
    except Exception as e:
        logger.error(
            f'Error occurred while fetching YouTube transcript for bookmark ID: {bookmark.id}, URL: {bookmark.url}, Error: {str(e)}')
        logger.info(f'Falling back to Whisper for bookmark ID: {bookmark.id}, URL: {bookmark.url}')

        temp_path = temp_file_path(bookmark.id, 'audio', 'mp3')
        try:
            download_result = download_audio_only(url, temp_path)
            if download_result['status'] == 'failed':
                return {'status': 'failed', 'error': f"audio download failed: {download_result['error']}"}
            segments = transcribe_to_segments(temp_path)
            if not segments:
                return {'status': 'failed', 'error': 'Whisper produced no segments'}
            update_raw_text_key(bookmark, "video", segments)
            return {'status': 'success', 'error': ''}
        except Exception as whisper_e:
            logger.error(
                f'Whisper fallback failed for bookmark ID: {bookmark.id}, URL: {bookmark.url}, Error: {str(whisper_e)}')
            return {'status': 'failed', 'error': str(whisper_e)}
        finally:
            cleanup_temp_file(temp_path)


def extract_video_twitter(bookmark):
    temp_path = temp_file_path(bookmark.id, 'video', 'mp4')
    try:
        download_result = download_video(bookmark.url, temp_path)
        if download_result['status'] == 'failed':
            return {'status': 'failed', 'error': f"video download failed: {download_result['error']}"}

        segments = transcribe_to_segments(temp_path)
        if not segments:
            # No detected speech — legitimate outcome, not a failure (Goal 6)
            update_raw_text_key(bookmark, "video", None)
            return {'status': 'success', 'error': ''}

        flat_text = ' '.join(seg['text'] for seg in segments)
        update_raw_text_key(bookmark, "video", flat_text)
        return {'status': 'success', 'error': ''}
    except Exception as e:
        logger.error(
            f'Error occurred while processing Twitter video for bookmark ID: {bookmark.id}, URL: {bookmark.url}, Error: {str(e)}')
        return {'status': 'failed', 'error': str(e)}
    finally:
        cleanup_temp_file(temp_path)


VIDEO_LEAVES = {
    'youtube': extract_video_youtube,
    'twitter': extract_video_twitter,
}
