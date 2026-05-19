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
            required_fields = ['url', 'title', 'platform', 'content_type', 'capture_method', 'author', 'author_link']
            for field in required_fields:
                if field not in data:
                    logger.error(f'Missing required field: {field}')
                    return JsonResponse({'error': f'Missing required field: {field}'}, status=400)
        except json.JSONDecodeError:
            logger.error('Invalid JSON')
            return JsonResponse({'error': 'Invalid JSON'}, status=400)
        
        Bookmark.objects.create(
            url = data['url'],
            title = data['title'],
            platform = data['platform'],
            content_type = data['content_type'],
            capture_method = data['capture_method'],
            author = data['author'],
            # author_link = data['author_link']
        )
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
        conn.execute('''INSERT INTO capture_log (url, title, platform, content_type, capture_method, author, author_link)
                     VALUES (?, ?, ?, ?, ?, ?, ?)''', (data['url'], data['title'], data['platform'], data['content_type'], data['capture_method'], data['author'], data['author_link']))
        conn.commit()
        logger.info(f"Capture log inserted for URL: {data['url']}")

        return JsonResponse({'message': 'Data captured successfully'}, status=200)
    logger.error('Invalid request method')
    return JsonResponse({'error': "Post method only "}, status=400)