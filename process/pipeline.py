from youtube_transcript_api import YouTubeTranscriptApi
from core.models import Bookmark, Tag, BookmarkTag, Chunk, Config
from django.utils.timezone import now

def extraction(bookmark):
    url = bookmark.url
    id = bookmark.id



    if bookmark.platform == 'youtube' and bookmark.content_type == 'video':

        try:
            transcript = YouTubeTranscriptApi().fetch(url)
            Bookmark.objects.filter(id =id).update(raw_text = transcript)
            return {'stage':'extraction', 'status': 'success', 'error': ''}
        except Exception as e:
            #fall back to whiper 

            try:
                #Loading whipser
                #give audio of video to whisper
                Bookmark.objects.filter(id= id).update(raw_text='wisper given text')
                return {'stage': 'extraction', 'status': 'success', 'error': ''}
                pass
            except Exception as e:
                #log reason whisper didn't worked 
                return {'stage': 'extraction', 'status': 'failed', 'error': str(e)}

    elif bookmark.content_type == 'video':
        try:
            #using whisper
            Bookmark.objects.filter(id= id).update(raw_text='wisper given text')
            return {'stage':'extraction', 'status': 'success', 'error': ''}
        except Exception as e:
            #for some reason whipser didn't worked

            return {'stage': 'extraction', 'status': 'failed', 'error': str(e)}
    
    elif bookmark.content_type == 'article' or bookmark.content_type == 'web_page':
        try:
            #I'm assuming browser extention gonna give raw html code so there is need to clean it 
            #or another possiblity is that we can use libraries which can give clear content already 
            #if content is in raw HTML well try to first clean it with python libraries 
            Bookmark.objects.filter(id=id).update(raw_text = 'scraped content')

            return {'stage':'extraction', 'status': 'success', 'error': ''}
        except Exception as e :
            return {'stage': 'extraction', 'status': 'failed', 'error': str(e)}
    elif bookmark.content_type == 'post':
        try:
            #there multiple steps will be there to understand caption and all we do braching there depending on type of plaform 
            #which can seprate written text and media and if media is there then whisper or VLM so these can be converted to text
            if bookmark.platform == 'linkedin':
                #Linked specific scraping 
                post_contnet = 'content written in post as text plus description of media with post'
                Bookmark.objects.filter(id=id).update(raw_text= post_contnet)
                return {'stage':'extraction', 'status': 'success', 'error': ''}
            elif bookmark.platform == 'twitter':
                post_contnet = 'content written in post as text plus description of media with post'
                Bookmark.objects.filter(id=id).update(raw_text= post_contnet)
                return {'stage':'extraction', 'status': 'success', 'error': ''}
                #twitter specfic logic
            else:
                #some come logic give good enough resutls
                post_contnet = 'content written in post as text plus description of media with post'
                Bookmark.objects.filter(id=id).update(raw_text= post_contnet)
                return {'stage':'extraction', 'status': 'success', 'error': ''}

            
            pass
        except Exception as e:
            return {'stage': 'extraction', 'status': 'failed', 'error': str(e)}
    elif bookmark.content_type == 'image_page':
        try:
            #I'll try to donwload that image using image using entension and save it in disk
            image = 'path of saved image'
            model = 'load model (VLM models)'
            summary = model(image)
            Bookmark.objects.filter(id=id).update(raw_text= summary)
            return {'stage':'extraction', 'status': 'success', 'error': ''}
        except Exception as e:
            #for some reason it didn't worked 
            return {'stage': 'extraction', 'status': 'failed', 'error': str(e)}
    else:
        return {'stage': 'extraction', 'status': 'failed', 'error': 'content type failed to match'}

def tagging(bookmark):
    id = bookmark.id
    raw_text = bookmark.raw_text

    try: 
        load_model = 'small llm to load'

    except Exception as e:

        return {'stage':'tagging', 'status': 'failed', 'error': str(e)}
    
    

    if bookmark.content_type == 'video':
        prompt = 'How to create tag prompt specifially tailored for videos'
        try:
            generated_tags = load_model(prompt, raw_text) #will return a list 
        except Exception as e : 
            return {'stage': 'tagging', 'status':'failed', 'error': str(e)}
    elif bookmark.content_type == 'image_page':
        prompt = 'How to create tag prompt form image description'
        try:
            generated_tags = load_model(prompt, raw_text) #will return a list 
        except Exception as e : 
            return {'stage': 'tagging', 'status':'failed', 'error': str(e)}
    elif bookmark.content_type == 'post':
        prompt = 'How to create tags prompt specifically for posts'
        try:
            generated_tags = load_model(prompt, raw_text) #will return a list 
        except Exception as e : 
            return {'stage': 'tagging', 'status':'failed', 'error': str(e)}
    elif bookmark.content_type == 'article' or bookmark.content_type == 'web_page':
        prompt = 'How to create tags prompt specifically for web pages and article'
        try:
            generated_tags = load_model(prompt, raw_text) #will return a list 
        except Exception as e : 
            return {'stage': 'tagging', 'status':'failed', 'error': str(e)}
    else:
        return {'stage': 'tagging', 'status': 'failed', 'error': 'content type failed to match'}

    if len(generated_tags) != 0:
        for tag in generated_tags:
            tag = tag.lower()
            new_tag = Tag.objects.get_or_create(name = tag)[0]
            BookmarkTag.objects.create(tag = new_tag, bookmark=bookmark, source = 'ai')
        return {'stage': 'tagging', 'status': 'success', 'error': ''}
    else:
        return {'stage': 'tagging', 'status': 'success', 'error': 'no generated tags' }

def chunking(bookmark):
    id = bookmark.id
    raw_text = bookmark.raw_text

    if raw_text is None:
        return {'stage':'chunking', 'status': 'failed', 'error': 'raw_text is None'}

    if bookmark.platform == 'youtube':
        #need to implement group of 300-500 in improvement time
        #I'll make sure to convert data from raw_text is converted in python object
        for line in raw_text:
            Chunk.objects.create(text = line.text, timestamp_seconds = line.start, bookmark = bookmark, chunk_type = 'video', word_count = len(line.text))
        return {'stage': 'chunking', 'status': 'success', 'error': ''}
    #there no field in bookmark table which stores user notes or there is not functionality which help use to check user gave a note even if we directly store that chunk tabel


    #Implementing sentence based NTLK library chunking 
    try:
        #will implement NTLK pipeline         
        chunks = [] #chunks produced by NTLK
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
        #maping needs to handled in model.py
        
        Chunk.objects.create(text = chunk, bookmark =bookmark, word_count = len(chunk), chunk_type = CONTENT_TO_CHUNK_TYPE[bookmark.content_type])
    return {'stage': 'chunking', 'status': 'success', 'error': ''}

def embedding(bookmark):
    #first load mode gloabally
    text_id_pair = Chunk.objects.filter(bookmark = bookmark, embedding = None).values_list('id', 'text')
    for tuple in text_id_pair:
        id = tuple[0]
        text = tuple[1]
        try:
            #access model and feed text
            model = 'embedding_mode'
            Chunk.objects.filter(id = id).update(embedding = model(text))

        except Exception as e:
            return {'stage':'embedding', 'status': 'failed', 'error': f'embedding failed: {str(e)}'}
    count = Chunk.objects.filter(bookmark = bookmark, embedding = None).count()
    if count == 0:
        return {'stage': 'embedding', 'status': 'success', 'error': ''}
    else:
        return {'stage': 'embedding', 'status': 'failed', 'error': 'Some embedding may be None'}



def run_pipeline(bookmark):
    stages = [extraction, tagging, chunking, embedding]

    for stage in stages:
        if bookmark.retry_count >= 3:
            break
        report = stage(bookmark)
        if report['status'] == 'failed':
            Bookmark.objects.filter(id = bookmark.id).update(retry_count = (bookmark.retry_count+1), failed_at = report['stage'], processing_error = report['error'])
            bookmark.refresh_from_db()
            break
        elif report['stage'] == 'embedding' and report['status'] == 'success':
            Bookmark.objects.filter(bookmark = bookmark.id).update(processing_status = 'complete', processed_at = now())
            config = Config.objects.get(id = 1)
            if config.embedding_locked == False:
                Config.objects.filter(id=1).update(embedding_locked = True)
                
            return True #meaning everything went well 
    return False 

    
