from core.models import Bookmark, Tag, BookmarkTag, Chunk, Config
from django.utils.timezone import now
import json
import logging
from ollama import embed
from transformers import AutoTokenizer
from langchain_text_splitters import RecursiveCharacterTextSplitter
from process.ollama_chats import generate_tags_for_chunk, generate_hierarchical_tags
from process.helper_function import normalize_tag
from process.image_description import IMAGE_LEAVES
from process.video_extraction import VIDEO_LEAVES
logger = logging.getLogger(__name__)


def extraction(bookmark):
    logger.info(f'Starting extraction for bookmark ID: {bookmark.id}, URL: {bookmark.url}')
    errors = []

    # has_text has no leaf. raw_text["text"] is already final from capture time.

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

    if errors:
        return {'stage': 'extraction', 'status': 'failed', 'error': '; '.join(errors)}
    return {'stage': 'extraction', 'status': 'success', 'error': ''}


def tagging(bookmark):
    bookmark.refresh_from_db()
    logger.info(f'Starting tagging for bookmark ID: {bookmark.id}, URL: {bookmark.url}')
    bookmark_id = bookmark.id
    raw_text = bookmark.raw_text

    try:
        # if bookmark.platform == 'Youtube':
        chunk_texts = Chunk.objects.filter(bookmark=bookmark).values_list('text', flat=True)

        all_chunk_tags = []
        for i, chunk in enumerate(chunk_texts):
            try:
                tags = generate_tags_for_chunk(chunk)
                logger.info(f'Generated tags for chunk {i+1} from {len(chunk_texts)} chunks form in  bookmark ID: {bookmark.id}, URL: {bookmark.url}, Tags: {tags}')
                for i, tag in enumerate(tags):
                    normalized_tag = normalize_tag(tag)
                    tags[i] = normalized_tag

                all_chunk_tags.extend(tags)

            except Exception as e:
                logger.error(f'Error occurred while generating tags for chunk {i} from {len(chunk_texts)} chunks form in  bookmark ID: {bookmark.id}, URL: {bookmark.url}, Error: {str(e)}')
        all_chunk_tags = list(set(all_chunk_tags))
        try:
            generated_tags = generate_hierarchical_tags(all_chunk_tags)
            logger.info(f'Generated hierarchical tags for bookmark ID: {bookmark.id}, URL: {bookmark.url}, Tags: {generated_tags}')
        except Exception as e:
            logger.error(f'Error occurred while generating hierarchical tags for bookmark ID: {bookmark.id}, URL: {bookmark.url}, Error: {str(e)}')

    except Exception as e:
        logger.error(
            f'Error occurred during tagging for bookmark ID: {bookmark.id}, URL: {bookmark.url}, Error: {str(e)}')

        return {'stage': 'tagging', 'status': 'failed', 'error': str(e)}

    # if bookmark.content_type == 'video':
    #     prompt = 'How to create tag prompt specifially tailored for videos'
    #     try:
    #         generated_tags = load_model(prompt, raw_text) #will return a list 
    #     except Exception as e : 
    #         return {'stage': 'tagging', 'status':'failed', 'error': str(e)}
    # elif bookmark.content_type == 'image_page':
    #     prompt = 'How to create tag prompt form image description'
    #     try:
    #         generated_tags = load_model(prompt, raw_text) #will return a list 
    #     except Exception as e : 
    #         return {'stage': 'tagging', 'status':'failed', 'error': str(e)}
    # elif bookmark.content_type == 'post':
    #     prompt = 'How to create tags prompt specifically for posts'
    #     try:
    #         generated_tags = load_model(prompt, raw_text) #will return a list 
    #     except Exception as e : 
    #         return {'stage': 'tagging', 'status':'failed', 'error': str(e)}
    # elif bookmark.content_type == 'article' or bookmark.content_type == 'web_page':
    #     prompt = 'How to create tags prompt specifically for web pages and article'
    #     try:
    #         generated_tags = load_model(prompt, raw_text) #will return a list 
    #     except Exception as e : 
    #         return {'stage': 'tagging', 'status':'failed', 'error': str(e)}
    # else:
    #     return {'stage': 'tagging', 'status': 'failed', 'error': 'content type failed to match'}

    if len(generated_tags) != 0:
        for tag in generated_tags:
            tag = tag.lower()
            new_tag = Tag.objects.get_or_create(name=tag)[0]
            print(new_tag)
            BookmarkTag.objects.get_or_create(tag=new_tag, bookmark=bookmark, source='ai')
        logger.info(
            f'Tags saved to database for bookmark ID: {bookmark.id}, URL: {bookmark.url}, Tags: {generated_tags}')
        return {'stage': 'tagging', 'status': 'success', 'error': ''}
    else:
        logger.info(f'No tags generated for bookmark ID: {bookmark.id}, URL: {bookmark.url}')
        return {'stage': 'tagging', 'status': 'success', 'error': 'no generated tags'}

# TEST123
def chunking(bookmark):
    bookmark.refresh_from_db()
    logger.info(f'Starting chunking for bookmark ID: {bookmark.id}, URL: {bookmark.url}, Platform: {bookmark.platform}')
    if bookmark.platform == 'Youtube':
        try:
            raw_text = json.loads(bookmark.raw_text)
            if raw_text is None:
                logger.error(f'Raw text is None for bookmark ID: {bookmark.id}, URL: {bookmark.url}')
                return {'stage': 'chunking', 'status': 'failed', 'error': 'raw_text is None'}
            script = ''.join([line['text'] for line in raw_text])
        except Exception as e:
            logger.error(f'Error occurred while loading raw_text for bookmark ID: {bookmark.id}, URL: {bookmark.url}, Error: {str(e)}')
            return {'stage': 'chunking', 'status': 'failed', 'error': f'Error loading raw_text: {str(e)}'}

    if bookmark.raw_text is None:
        logger.error(f'Raw text is None for bookmark ID: {bookmark.id}, URL: {bookmark.url}')
        return {'stage': 'chunking', 'status': 'failed', 'error': 'raw_text is None'}

    # if bookmark.platform == 'Youtube':
    #     logger.info(f'Using YouTube specific chunking for bookmark ID: {bookmark.id}, URL: {bookmark.url}')
        # need to implement group of 300-500 in improvement time
        # I'll make sure to convert data from raw_text is converted in python object
        

    script = bookmark.raw_text


    tokenizer = AutoTokenizer.from_pretrained("google/gemma-4-E2B")
    splitter = RecursiveCharacterTextSplitter.from_huggingface_tokenizer(
            tokenizer=tokenizer,
            chunk_size=1000,
            chunk_overlap=150,

        )
    chunks = splitter.split_text(script)

    for chunk in chunks:
            Chunk.objects.create(text=chunk, bookmark=bookmark, chunk_type='video', word_count=len(chunk))

    return {'stage': 'chunking', 'status': 'success', 'error': ''}
    # there no field in bookmark table which stores user notes or there is not functionality which help use to check user gave a note even if we directly store that chunk tabel

    # Implementing sentence based NTLK library chunking
    try:
        # will implement NTLK pipeline
        chunks = []  # chunks produced by NTLK
    except Exception as e:
        return {'stage': 'chunking', 'status': 'failed', 'error': f'NLTK failed: {str(e)}'}

    if len(chunks) == 0:
        return {'stage': 'chunking', 'status': 'failed', 'error': 'chunks collection is emtpy'}
    CONTENT_TO_CHUNK_TYPE = {
        'video': 'video',
        'article': 'article',
        'post': 'post',
        'image_page': 'image',
        'web_page': 'article',
    }
    for chunk in chunks:
        # maping needs to handled in model.py

        # TODO: Replace this unreachable legacy branch when multimodal chunking is in scope.
        Chunk.objects.create(text=chunk, bookmark=bookmark, word_count=len(chunk),
                             chunk_type='post')
    return {'stage': 'chunking', 'status': 'success', 'error': ''}


def embedding(bookmark):
    # first load mode gloabally
    bookmark.refresh_from_db()
    logger.info(f'embedding stage skipped for bookmark ID: {bookmark.id}, URL: {bookmark.url} because chunking stage did not produce any chunks')
    # return {'stage': 'embedding', 'status': 'failed', 'error': 'skipping embedding because no chunks were generated in chunking stage'}
    non_embedded_chunks = Chunk.objects.filter(bookmark=bookmark, embedding=None)
    for chunk in non_embedded_chunks:
        try:
            # access model and feed text
            response = embed(
                model = 'nomic-embed-text-v2-moe', 
                input = chunk.text
            )
            embedding = response.embeddings[0]
            Chunk.objects.filter(id=chunk.id).update(embedding=embedding)

        except Exception as e:
            return {'stage': 'embedding', 'status': 'failed', 'error': f'embedding failed: {str(e)}'}
    logger.info(f'Embedding completed for bookmark ID: {bookmark.id}, URL: {bookmark.url}')
    count = Chunk.objects.filter(bookmark=bookmark, embedding=None).count()
    if count == 0:
        return {'stage': 'embedding', 'status': 'success', 'error': ''}
    else:
        return {'stage': 'embedding', 'status': 'failed', 'error': 'Some embedding may be None'}


def run_pipeline(bookmark):
  
    stages = [extraction, chunking, tagging, embedding]

    logger.info(f'Starting pipeline for bookmark ID: {bookmark.id}, URL: {bookmark.url}')

    for stage in stages:
        if bookmark.retry_count >= 3:
            break

        report = stage(bookmark)
        logger.info(
            f'Completed stage: {report["stage"]} for bookmark ID: {bookmark.id}, URL: {bookmark.url}, Status: {report["status"]}, Error: {report["error"]}')
        if report['status'] == 'failed':
            Bookmark.objects.filter(id=bookmark.id).update(retry_count=(bookmark.retry_count + 1),
                                                           failed_at=report['stage'], processing_error=report['error'])
            bookmark.refresh_from_db()
            break
        elif report['stage'] == 'embedding' and report['status'] == 'success':
            Bookmark.objects.filter(id=bookmark.id).update(processing_status='complete', processed_at=now())
            config = Config.objects.get(id=1)
            if config.embedding_locked == False:
                Config.objects.filter(id=1).update(embedding_locked=True)

            return True  # meaning everything went well
    return False
