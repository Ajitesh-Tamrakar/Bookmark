from django.shortcuts import render
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
import json
from core.models import Bookmark
import sqlite3
import os
from pathlib import Path
import logging
logger = logging.getLogger(__name__)
# Create your views here.
@csrf_exempt
def capture(request):
    if request.method == 'POST':
        body = request.body
        data = json.loads(body)

        try:
            required_fields = ['source_url', 'platform', 'content_type', 'capture_method']
            for field in required_fields:
                if field not in data:
                    logger.error(f'Missing required field: {field}')
                    return JsonResponse({'error': f'Missing required field: {field}'}, status=400)
        except json.JSONDecodeError:
            logger.error('Invalid JSON')
            return JsonResponse({'error': 'Invalid JSON'}, status=400)
        
        platfrom = data['platform'].lower()

        if platfrom == 'youtube': 
            try:               
                Bookmark.objects.create(
                url = data['source_url'],
                title = data['title'],
                platform = data['platform'],
                content_type = data['content_type'],
                capture_method = data['capture_method'],
                author = data['author'],
            )
            except Exception as e:
                logger.error(f"Error creating bookmark for YouTube: {e}")
                return JsonResponse({'error': 'Error creating bookmark'}, status=500)
        elif platfrom == 'twitter':
            try:
                Bookmark.objects.create(
                    url = data['source_url'],
                    author = data['author'], 
                    raw_data = data['raw_data'],
                    capture_method = data['capture_method'],
                    platform = data['platform'],

                )
            except Exception as e:
                logger.error(f"Error creating bookmark for Twitter: {e}")
                return JsonResponse({'error': 'Error creating bookmark'}, status=500)

        elif platfrom == 'pinterest':
            try:
                Bookmark.objects.create(
                    url = data['source_url'], 
                    platform = data['platform'],
                    content_type = data['content_type'],
                    capture_method = data['capture_method'],
                    raw_text = data['alt_text'],
                    author = data['author_name'],
                    )
            except Exception as e:
                logger.error(f"Error creating bookmark for Pinterest: {e}")
                return JsonResponse({'error': 'Error creating bookmark'}, status=500)
        elif platfrom == 'linkedin':
            try:
                Bookmark.objects.create(
                    url = data['source_url'], 
                    platform = data['platform'],
                    content_type = data['content_type'],
                    capture_method = data['capture_method'],
                    raw_text = data['post_text'],
                    author = data['author_name']
                )
            except Exception as e:
                logger.error(f"Error creating bookmark for LinkedIn: {e}")
                return JsonResponse({'error': 'Error creating bookmark'}, status=500)
        elif platfrom == 'website':            
            pass
        else:
            return JsonResponse({'error': 'Unsupported platform'}, status=400)

            # author_link = data['author_link']
        
        logger.info(f"Bookmark created for URL: {data['url']}")

        try:
            project_root = Path(__file__).parent.parent
            os.makedirs(project_root / 'temp', exist_ok=True)
            conn = sqlite3.connect(f'{project_root}/temp/db.sqlite3')
        except FileNotFoundError:
            logger.error("Database file not found.")
            return JsonResponse({'error': 'Database file not found'}, status=500)
        except sqlite3.Error as e:
            logger.error(f"Error connecting to database: {e}")
            return JsonResponse({'error': 'Database connection error'}, status=500)
        
        conn.execute('''CREATE TABLE IF NOT EXISTS capture_log
                     (url TEXT,
                     title TEXT,
                     platform TEXT,
                     content_type TEXT,
                     capture_method TEXT,
                     author TEXT,
                     author_link TEXT,
                     note TEXT, 
                     captured_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP)''')
        conn.execute('''INSERT INTO capture_log (source_url, title, platform, content_type, capture_method)
                     VALUES (?, ?, ?, ?, ?, ?, ?)''', (data['source_url'], data['title'], data['platform'], data['content_type'], data['capture_method']))
        conn.commit()
        logger.info(f"Capture log inserted for URL: {data['source_url']}")

        return JsonResponse({'message': 'Data captured successfully'}, status=200)
    


    else:
        logger.error('Invalid request method')
        return JsonResponse({'error': "Post method only "}, status=400)