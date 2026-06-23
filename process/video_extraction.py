import logging
from urllib.parse import parse_qs, urlparse

from youtube_transcript_api import YouTubeTranscriptApi

from process.helper_function import update_raw_text_key

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
        # fall back to whiper

        try:
            # Loading whipser
            # give audio of video to whisper
            update_raw_text_key(bookmark, "video", "wisper given text")
            return {'status': 'success', 'error': ''}

        except Exception as e:
            # log reason whisper didn't worked
            logger.error(
                f'Error occurred while fetching transcript using Whisper for bookmark ID: {bookmark.id}, URL: {bookmark.url}, Error: {str(e)}')
            return {'status': 'failed', 'error': str(e)}


def extract_video_twitter(bookmark):
    try:
        # TODO: real yt-dlp call.
        update_raw_text_key(bookmark, "video", None)
        return {'status': 'success', 'error': ''}
    except Exception as e:
        return {'status': 'failed', 'error': str(e)}


VIDEO_LEAVES = {
    'youtube': extract_video_youtube,
    'twitter': extract_video_twitter,
}
