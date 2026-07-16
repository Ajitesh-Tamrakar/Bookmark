import logging
import os

from core.models import Config
from process.generation import chat_complete
from process.helper_function import cleanup_temp_file, temp_file_path, update_raw_text_key
from process.media_download import download_image, decode_base64_image

logger = logging.getLogger(__name__)


def analyze_image(image_path, model):
    if not os.path.exists(image_path):
        logger.error(f"Image file not found: {image_path}")
        return None

    logger.info(f"Analyzing image with model '{model}'")

    try:
        return chat_complete(
            model=model,
            messages=[
                {
                    'role': 'user',
                    'content': 'Analyze this image completely. Identify the main subject, any background elements, and describe what is happening.',
                }
            ],
            image_paths=[image_path],
        )

    except Exception as e:
        logger.error(f"Image analysis failed: {e}")


IMAGE_URL_RESOLVERS = {
    'pinterest': lambda psd: psd.get('image_url'),
    'twitter':   lambda psd: (psd.get('images') or [None])[0],
    'linkedin':  lambda psd: (psd.get('images') or [None])[0],
    'web':       lambda psd: psd.get('lead_image_url'),
}


def resolve_image_url(platform, platform_metadata):
    resolver = IMAGE_URL_RESOLVERS.get(platform)
    if resolver is None:
        return None
    return resolver(platform_metadata or {})


def extract_image(bookmark):
    image_url = resolve_image_url(bookmark.platform, bookmark.platform_metadata)
    if not image_url:
        return {'status': 'failed', 'error': f"no image URL found in platform_metadata for platform '{bookmark.platform}'"}

    temp_path = temp_file_path(bookmark.id, 'image', 'jpg')
    try:
        result = download_image(image_url, temp_path)
        if result['status'] == 'failed':
            return {'status': 'failed', 'error': f"download failed: {result['error']}"}

        model = Config.get().generation_model_name
        description = analyze_image(temp_path, model)
        if not description:
            return {'status': 'failed', 'error': 'VLM returned no description'}

        update_raw_text_key(bookmark, "image", description)
        return {'status': 'success', 'error': ''}
    except Exception as e:
        return {'status': 'failed', 'error': str(e)}
    finally:
        cleanup_temp_file(temp_path)


IMAGE_LEAVES = {
    'pinterest': extract_image,
    'twitter':   extract_image,
    'linkedin':  extract_image,
    'web':       extract_image,
}


def extract_screenshot(bookmark):
    data_uri = (bookmark.platform_metadata or {}).get('screenshot_base64')
    if not data_uri:
        return {'status': 'failed', 'error': 'no screenshot_base64 found in platform_metadata'}

    temp_path = temp_file_path(bookmark.id, 'screenshot', 'jpg')
    try:
        result = decode_base64_image(data_uri, temp_path)
        if result['status'] == 'failed':
            return {'status': 'failed', 'error': f"decode failed: {result['error']}"}

        model = Config.get().generation_model_name
        description = analyze_image(temp_path, model)
        if not description:
            return {'status': 'failed', 'error': 'VLM returned no description'}

        update_raw_text_key(bookmark, "screenshot", description)
        return {'status': 'success', 'error': ''}
    except Exception as e:
        return {'status': 'failed', 'error': str(e)}
    finally:
        cleanup_temp_file(temp_path)


SCREENSHOT_LEAVES = {
    'web': extract_screenshot,   # only web produces screenshot_base64 today; dict kept for
                                  # parity with IMAGE_LEAVES/VIDEO_LEAVES in case that changes
}
