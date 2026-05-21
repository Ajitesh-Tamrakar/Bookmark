from youtube_transcript_api import YouTubeTranscriptApi
from core.models import Bookmark, Tag, BookmarkTag, Chunk, Config
from django.utils.timezone import now
import json
from urllib.parse import urlparse, parse_qs
import logging
from ollama import chat
from transformers import AutoTokenizer
from langchain_text_splitters import RecursiveCharacterTextSplitter
logger = logging.getLogger(__name__)


def get_tag(content):
    logger.info(f'Generating tags using Ollama for content of length: {len(content)}')

    schema = {
        'type': 'array',
        'items': {
            'type': 'string'
        },
        'minItems': 2,
        'maxItems': 5
    }

    response = chat(
        model='gemma4:e2b',
        messages=[
            {
                'role': 'system',
                'content': (
                    "You generate concise topic tags. "
                    "Return only relevant tags."
                )
            },
            {
                'role': 'user',
                'content': f"""
                        Generate 2-5 short tags for the following content.

                        Rules:
                        - Tags should be concise
                        - 1-3 words per tag
                        - No duplicate tags
                        - Focus on main topics

                        Content:
                        {content}
                        """
            }
        ],
        format=schema,
        options={
            'temperature': 0.2,
        }
    )

    logger.info(f'Received response from Ollama for tag generation: {response.message.content}')

    return json.loads(response['message']['content'])

def extraction(bookmark):
    logger.info(f'Starting extraction for bookmark ID: {bookmark.id}, URL: {bookmark.url}')
    url = bookmark.url
    bookmark_id = bookmark.id

    if bookmark.platform == 'Youtube' and bookmark.content_type == 'video':

        try:
            parsed_url = urlparse(url)
            query_params = parse_qs(parsed_url.query)
            video_id = query_params.get('v')[0]
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
            Bookmark.objects.filter(id=bookmark_id).update(raw_text=json.dumps(wrapper))
            return {'stage': 'extraction', 'status': 'success', 'error': ''}
        except Exception as e:
            logger.error(
                f'Error occurred while fetching YouTube transcript for bookmark ID: {bookmark.id}, URL: {bookmark.url}, Error: {str(e)}')
            logger.info(f'Falling back to Whisper for bookmark ID: {bookmark.id}, URL: {bookmark.url}')
            # fall back to whiper

            try:
                # Loading whipser
                # give audio of video to whisper
                Bookmark.objects.filter(id=bookmark_id).update(raw_text='wisper given text')
                return {'stage': 'extraction', 'status': 'success', 'error': ''}

            except Exception as e:
                # log reason whisper didn't worked
                logger.error(
                    f'Error occurred while fetching transcript using Whisper for bookmark ID: {bookmark.id}, URL: {bookmark.url}, Error: {str(e)}')
                return {'stage': 'extraction', 'status': 'failed', 'error': str(e)}

    elif bookmark.content_type == 'video':
        try:
            # using whisper
            Bookmark.objects.filter(id=id).update(raw_text='wisper given text')
            return {'stage': 'extraction', 'status': 'success', 'error': ''}
        except Exception as e:
            # for some reason whipser didn't worked

            return {'stage': 'extraction', 'status': 'failed', 'error': str(e)}

    elif bookmark.content_type == 'article' or bookmark.content_type == 'web_page':
        try:
            # I'm assuming browser extention gonna give raw html code so there is need to clean it
            # or another possiblity is that we can use libraries which can give clear content already
            # if content is in raw HTML well try to first clean it with python libraries
            Bookmark.objects.filter(id=id).update(raw_text='scraped content')

            return {'stage': 'extraction', 'status': 'success', 'error': ''}
        except Exception as e:
            return {'stage': 'extraction', 'status': 'failed', 'error': str(e)}
    elif bookmark.content_type == 'post':
        try:
            # there multiple steps will be there to understand caption and all we do braching there depending on type of plaform
            # which can seprate written text and media and if media is there then whisper or VLM so these can be converted to text
            if bookmark.platform == 'linkedin':
                # Linked specific scraping
                post_contnet = 'content written in post as text plus description of media with post'
                Bookmark.objects.filter(id=id).update(raw_text=post_contnet)
                return {'stage': 'extraction', 'status': 'success', 'error': ''}
            elif bookmark.platform == 'twitter':
                post_contnet = 'content written in post as text plus description of media with post'
                Bookmark.objects.filter(id=id).update(raw_text=post_contnet)
                return {'stage': 'extraction', 'status': 'success', 'error': ''}
                # twitter specfic logic
            else:
                # some come logic give good enough resutls
                post_contnet = 'content written in post as text plus description of media with post'
                Bookmark.objects.filter(id=id).update(raw_text=post_contnet)
                return {'stage': 'extraction', 'status': 'success', 'error': ''}

            pass
        except Exception as e:
            return {'stage': 'extraction', 'status': 'failed', 'error': str(e)}
    elif bookmark.content_type == 'image_page':
        try:
            # I'll try to donwload that image using image using entension and save it in disk
            image = 'path of saved image'
            model = 'load model (VLM models)'
            summary = model(image)
            Bookmark.objects.filter(id=id).update(raw_text=summary)
            return {'stage': 'extraction', 'status': 'success', 'error': ''}
        except Exception as e:
            # for some reason it didn't worked
            return {'stage': 'extraction', 'status': 'failed', 'error': str(e)}
    else:
        return {'stage': 'extraction', 'status': 'failed', 'error': 'content type failed to match'}


def tagging(bookmark):
    logger.info(f'Starting tagging for bookmark ID: {bookmark.id}, URL: {bookmark.url}')
    bookmark_id = bookmark.id
    raw_text = bookmark.raw_text

    try:
        if bookmark.platform == 'Youtube':
            script = json.loads(raw_text)
            full_text = ' '.join([line['text'] for line in script])
            generated_tags = get_tag(full_text)
            logger.info(
                f'Generated tags for YouTube video ID: {bookmark.id}, URL: {bookmark.url}, Tags: {generated_tags}')


        else:
            generated_tags = get_tag(raw_text)
            logger.info(f'Generated tags for bookmark ID: {bookmark.id}, URL: {bookmark.url}, Tags: {generated_tags}')


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


def chunking(bookmark):
    logger.info(f'chunking stage skipped for bookmark ID: {bookmark.id}, URL: {bookmark.url} because tagging stage did not produce any tags')
    # return {'stage': 'chunking', 'status': 'failed', 'error': 'skipping chunking because no tags were generated in tagging stage'}
    id = bookmark.id
    raw_text = json.loads(bookmark.raw_text)

    if raw_text is None:
        return {'stage': 'chunking', 'status': 'failed', 'error': 'raw_text is None'}

    if bookmark.platform == 'Youtube':
        # need to implement group of 300-500 in improvement time
        # I'll make sure to convert data from raw_text is converted in python object
        script = ''.join([line['text'] for line in raw_text])


        tokenizer = AutoTokenizer.from_pretrained("google/gemma-4-E2B")
        splitter = RecursiveCharacterTextSplitter(
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

        Chunk.objects.create(text=chunk, bookmark=bookmark, word_count=len(chunk),
                             chunk_type=CONTENT_TO_CHUNK_TYPE[bookmark.content_type])
    return {'stage': 'chunking', 'status': 'success', 'error': ''}


def embedding(bookmark):
    # first load mode gloabally
    logger.info(f'embedding stage skipped for bookmark ID: {bookmark.id}, URL: {bookmark.url} because chunking stage did not produce any chunks')
    return {'stage': 'embedding', 'status': 'failed', 'error': 'skipping embedding because no chunks were generated in chunking stage'}
    text_id_pair = Chunk.objects.filter(bookmark=bookmark, embedding=None).values_list('id', 'text')
    for tuple in text_id_pair:
        id = tuple[0]
        text = tuple[1]
        try:
            # access model and feed text
            model = 'embedding_mode'
            Chunk.objects.filter(id=id).update(embedding=model(text))

        except Exception as e:
            return {'stage': 'embedding', 'status': 'failed', 'error': f'embedding failed: {str(e)}'}
    count = Chunk.objects.filter(bookmark=bookmark, embedding=None).count()
    if count == 0:
        return {'stage': 'embedding', 'status': 'success', 'error': ''}
    else:
        return {'stage': 'embedding', 'status': 'failed', 'error': 'Some embedding may be None'}


def run_pipeline(bookmark):
    # stages = [extraction, tagging, chunking, embedding]
    stages = [tagging, chunking, embedding]
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
            Bookmark.objects.filter(bookmark=bookmark.id).update(processing_status='complete', processed_at=now())
            config = Config.objects.get(id=1)
            if config.embedding_locked == False:
                Config.objects.filter(id=1).update(embedding_locked=True)

            return True  # meaning everything went well
    return False
