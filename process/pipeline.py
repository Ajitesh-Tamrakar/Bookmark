from core.models import Bookmark, Tag, BookmarkTag, Chunk, Config
from core.metrics import timed_event
from django.utils.timezone import now
import logging
from ollama import embed
from process.ollama_chats import generate_tags_for_chunk, generate_hierarchical_tags
from process.helper_function import normalize_tag, add_embedding_prefix
from process.image_description import IMAGE_LEAVES, SCREENSHOT_LEAVES
from process.video_extraction import VIDEO_LEAVES
from process.chunk_builders import (
    chunk_text, chunk_image, chunk_highlight, chunk_screenshot,
    chunk_metadata, upsert_note_chunk, VIDEO_CHUNK_LEAVES,
)
logger = logging.getLogger(__name__)


def extraction(bookmark):
    logger.info(f'Starting extraction for bookmark ID: {bookmark.id}, URL: {bookmark.url}')
    errors = []

    # has_text has no leaf. raw_text["text"] is already final from capture time.
    # has_highlight has no leaf either. highlighted_text is already final from capture time
    # (stored in platform_metadata, not raw_text).

    if bookmark.has_image:
        leaf = IMAGE_LEAVES.get(bookmark.platform)
        if leaf is None:
            errors.append(f"image: no extractor registered for platform '{bookmark.platform}'")
        else:
            result = leaf(bookmark)
            if result['status'] == 'failed':
                errors.append(f"image: {result['error']}")

    if bookmark.has_video:
        leaf = VIDEO_LEAVES.get(bookmark.platform)
        if leaf is None:
            errors.append(f"video: no extractor registered for platform '{bookmark.platform}'")
        else:
            result = leaf(bookmark)
            if result['status'] == 'failed':
                errors.append(f"video: {result['error']}")

    if bookmark.has_screenshot:
        leaf = SCREENSHOT_LEAVES.get(bookmark.platform)
        if leaf is None:
            errors.append(f"screenshot: no extractor registered for platform '{bookmark.platform}'")
        else:
            result = leaf(bookmark)
            if result['status'] == 'failed':
                errors.append(f"screenshot: {result['error']}")

    if errors:
        return {'stage': 'extraction', 'status': 'failed', 'error': '; '.join(errors)}
    return {'stage': 'extraction', 'status': 'success', 'error': ''}


def tagging(bookmark):
    bookmark.refresh_from_db()
    logger.info(f'Starting tagging for bookmark ID: {bookmark.id}, URL: {bookmark.url}')

    generation_model = Config.get().generation_model_name

    try:
        chunk_texts = Chunk.objects.filter(bookmark=bookmark).values_list('text', flat=True)

        all_chunk_tags = []
        for i, chunk in enumerate(chunk_texts):
            try:
                tags = generate_tags_for_chunk(chunk, generation_model)
                logger.info(f'Generated tags for chunk {i+1} of {len(chunk_texts)} for bookmark ID: {bookmark.id}, Tags: {tags}')
                tags = [normalize_tag(tag) for tag in tags]
                all_chunk_tags.extend(tags)
            except Exception as e:
                logger.error(f'Error generating tags for chunk {i} for bookmark ID: {bookmark.id}, Error: {str(e)}')

        all_chunk_tags = list(set(all_chunk_tags))

        if not all_chunk_tags:
            logger.info(f'No chunk-level tags generated for bookmark ID: {bookmark.id}; skipping hierarchical reduce')
            return {'stage': 'tagging', 'status': 'success', 'error': 'no generated tags'}

        generated_tags = generate_hierarchical_tags(all_chunk_tags, generation_model)
        logger.info(f'Generated hierarchical tags for bookmark ID: {bookmark.id}, Tags: {generated_tags}')

    except Exception as e:
        logger.error(f'Error occurred during tagging for bookmark ID: {bookmark.id}, URL: {bookmark.url}, Error: {str(e)}')
        return {'stage': 'tagging', 'status': 'failed', 'error': str(e)}

    if generated_tags:
        for tag in generated_tags:
            tag = tag.lower()
            new_tag = Tag.objects.get_or_create(name=tag)[0]
            BookmarkTag.objects.get_or_create(tag=new_tag, bookmark=bookmark, source='ai')
        logger.info(f'Tags saved to database for bookmark ID: {bookmark.id}, Tags: {generated_tags}')
        return {'stage': 'tagging', 'status': 'success', 'error': ''}
    else:
        logger.info(f'No tags generated for bookmark ID: {bookmark.id}')
        return {'stage': 'tagging', 'status': 'success', 'error': 'no generated tags'}

def chunking(bookmark):
    bookmark.refresh_from_db()
    logger.info(f'Starting chunking for bookmark ID: {bookmark.id}, URL: {bookmark.url}')
    Chunk.objects.filter(bookmark=bookmark).delete()
    errors = []

    if bookmark.has_text:
        result = chunk_text(bookmark)
        if result['status'] == 'failed':
            errors.append(f"text: {result['error']}")

    if bookmark.has_image:
        result = chunk_image(bookmark)
        if result['status'] == 'failed':
            errors.append(f"image: {result['error']}")

    if bookmark.has_video:
        leaf = VIDEO_CHUNK_LEAVES.get(bookmark.platform)
        if leaf is None:
            errors.append(f"video: no chunker registered for platform '{bookmark.platform}'")
        else:
            result = leaf(bookmark)
            if result['status'] == 'failed':
                errors.append(f"video: {result['error']}")

    if bookmark.has_highlight:
        result = chunk_highlight(bookmark)
        if result['status'] == 'failed':
            errors.append(f"highlight: {result['error']}")

    if bookmark.has_screenshot:
        result = chunk_screenshot(bookmark)
        if result['status'] == 'failed':
            errors.append(f"screenshot: {result['error']}")

    result = chunk_metadata(bookmark)
    if result['status'] == 'failed':
        errors.append(f"metadata: {result['error']}")

    result = upsert_note_chunk(bookmark)
    if result['status'] == 'failed':
        errors.append(f"note: {result['error']}")

    if errors:
        return {'stage': 'chunking', 'status': 'failed', 'error': '; '.join(errors)}
    return {'stage': 'chunking', 'status': 'success', 'error': ''}


def embedding(bookmark):
    bookmark.refresh_from_db()
    logger.info(f'Starting embedding for bookmark ID: {bookmark.id}, URL: {bookmark.url}')

    embedding_model = Config.get().embedding_model_name
    non_embedded_chunks = Chunk.objects.filter(bookmark=bookmark, embedding=None)

    errors = []
    for chunk in non_embedded_chunks:
        try:
            text = add_embedding_prefix(chunk.text, embedding_model, "search_document")
            response = embed(model=embedding_model, input=text)
            vector = response.embeddings[0]
            Chunk.objects.filter(id=chunk.id).update(embedding=vector)
        except Exception as e:
            errors.append(f"chunk {chunk.id}: {str(e)}")

    if errors:
        logger.error(f'Embedding errors for bookmark ID: {bookmark.id}: {"; ".join(errors)}')
        return {'stage': 'embedding', 'status': 'failed', 'error': '; '.join(errors)}

    logger.info(f'Embedding completed for bookmark ID: {bookmark.id}, URL: {bookmark.url}')
    count = Chunk.objects.filter(bookmark=bookmark, embedding=None).count()
    if count == 0:
        return {'stage': 'embedding', 'status': 'success', 'error': ''}
    else:
        return {'stage': 'embedding', 'status': 'failed', 'error': 'Some embeddings still missing after processing'}


def run_pipeline(bookmark):
  
    stages = [extraction, chunking, tagging, embedding]

    logger.info(f'Starting pipeline for bookmark ID: {bookmark.id}, URL: {bookmark.url}')

    for stage in stages:
        if bookmark.retry_count >= 3:
            break

        Bookmark.objects.filter(id=bookmark.id).update(current_step=stage.__name__)

        with timed_event(
            "pipeline_stage",
            payload={"bookmark_id": str(bookmark.id), "stage": stage.__name__, "platform": bookmark.platform},
        ) as p:
            report = stage(bookmark)
            p["success"] = (report["status"] == "success")
            if report.get("error"):
                p["error"] = report["error"]

        logger.info(
            f'Completed stage: {report["stage"]} for bookmark ID: {bookmark.id}, URL: {bookmark.url}, Status: {report["status"]}, Error: {report["error"]}')
        if report['status'] == 'failed':
            new_retry_count = bookmark.retry_count + 1
            if new_retry_count < 3:
                Bookmark.objects.filter(id=bookmark.id).update(
                    retry_count=new_retry_count,
                    processing_status='pending',
                    current_step=None,
                    processing_started_at=None,
                    failed_at=report['stage'], processing_error=report['error'])
            else:
                Bookmark.objects.filter(id=bookmark.id).update(
                    retry_count=new_retry_count,
                    processing_status='failed',
                    current_step=None,
                    processing_started_at=None,
                    failed_at=report['stage'], processing_error=report['error'])
            bookmark.refresh_from_db()
            break
        elif report['stage'] == 'embedding' and report['status'] == 'success':
            Bookmark.objects.filter(id=bookmark.id).update(
                processing_status='complete',
                current_step=None,
                processing_started_at=None,
                processed_at=now(),
            )
            config = Config.objects.get(id=1)
            if config.embedding_locked == False:
                Config.objects.filter(id=1).update(embedding_locked=True)

            return True  # meaning everything went well
    return False
