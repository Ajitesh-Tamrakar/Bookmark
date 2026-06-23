from pathlib import Path
import json
import logging
import os
import sqlite3

from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt

from core.models import Bookmark

logger = logging.getLogger(__name__)


def _base_raw_text(text_content):
    return {"text": text_content, "image": None, "video": None}


def _youtube_fields(psd):
    return {
        "has_text": False,
        "has_image": False,
        "has_video": True,
        "title": psd.get("title"),
        "author": psd.get("author"),
        "text_content": None,
    }


def _twitter_fields(psd):
    videos = psd.get("videos") or []
    return {
        "has_text": bool(psd.get("tweetText")),
        "has_image": len(psd.get("images") or []) > 0,
        "has_video": any(video.get("src") for video in videos),
        "title": None,
        "author": psd.get("authorName"),
        "text_content": psd.get("tweetText"),
    }


def _pinterest_fields(psd):
    return {
        "has_text": bool(psd.get("alt_text")),
        "has_image": True,
        "has_video": False,
        "title": None,
        "author": None,
        "text_content": psd.get("alt_text"),
    }


def _linkedin_fields(psd):
    return {
        "has_text": bool(psd.get("post_text")),
        "has_image": len(psd.get("images") or []) > 0,
        "has_video": len(psd.get("videos") or []) > 0,
        "title": None,
        "author": psd.get("author_name"),
        "text_content": psd.get("post_text"),
    }


PLATFORM_EXTRACTORS = {
    "youtube": _youtube_fields,
    "twitter": _twitter_fields,
    "pinterest": _pinterest_fields,
    "linkedin": _linkedin_fields,
}


def _write_capture_log(mandatory_fields, bookmark, capture_method):
    try:
        project_root = Path(__file__).parent.parent
        os.makedirs(project_root / "temp", exist_ok=True)
        conn = sqlite3.connect(f"{project_root}/temp/db.sqlite3")
    except FileNotFoundError:
        logger.error("Database file not found.")
        return
    except sqlite3.Error as e:
        logger.error(f"Error connecting to database: {e}")
        return

    try:
        conn.execute(
            """CREATE TABLE IF NOT EXISTS capture_log
                            (source_url TEXT,
                            title TEXT,
                            platform TEXT,
                            content_type TEXT,
                            capture_method TEXT,
                            author TEXT,
                            author_link TEXT,
                            note TEXT,
                            captured_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP)"""
        )
        conn.execute(
            """INSERT INTO capture_log (source_url, title, platform, content_type, capture_method, author, author_link, note)
                            VALUES (?, ?, ?, ?, ?, ?, ?, ?)""",
            (
                mandatory_fields["source_url"],
                bookmark.title,
                bookmark.platform,
                None,
                capture_method,
                bookmark.author,
                None,
                None,
            ),
        )
        conn.commit()
        logger.info(f"Capture log inserted for URL: {mandatory_fields['source_url']}")
    except sqlite3.Error as e:
        logger.error(f"Error writing capture_log: {e}")
    finally:
        conn.close()


@csrf_exempt
def capture(request):
    if request.method != "POST":
        logger.error("Invalid request method")
        return JsonResponse({"error": "Post method only "}, status=400)

    try:
        data = json.loads(request.body)
    except json.JSONDecodeError:
        logger.error("Invalid JSON")
        return JsonResponse({"error": "Invalid JSON"}, status=400)

    try:
        mandatory_fields = data["mandatory_fields"]
    except KeyError:
        logger.error("Missing 'mandatory_fields' in request data")
        return JsonResponse(
            {"error": "Missing 'mandatory_fields' in request data"}, status=400
        )

    psd = data.get("platform_specific_data") or {}
    required_fields = ["source_url", "platform", "capture_method"]
    for field in required_fields:
        if field not in mandatory_fields:
            logger.error(f"Missing required field: {field}")
            return JsonResponse({"error": f"Missing required field: {field}"}, status=400)

    platform = mandatory_fields["platform"].lower()
    capture_method = mandatory_fields["capture_method"].lower()

    if platform == "web":
        # TODO: Define the generic web-page payload shape so modality flags can be derived without guessing.
        logger.error("Generic web capture payload shape is not defined")
        return JsonResponse(
            {"error": "Generic web capture payload shape is not defined"}, status=400
        )

    extractor = PLATFORM_EXTRACTORS.get(platform)
    if extractor is None:
        return JsonResponse({"error": "Unsupported platform"}, status=400)

    try:
        fields = extractor(psd)
        bookmark = Bookmark.objects.create(
            url=mandatory_fields["source_url"],
            title=fields["title"],
            platform=platform,
            capture_method=capture_method,
            has_text=fields["has_text"],
            has_image=fields["has_image"],
            has_video=fields["has_video"],
            author=fields["author"],
            raw_text=_base_raw_text(fields["text_content"]),
            platform_metadata=psd,
        )
    except Exception as e:
        logger.error(f"Error creating bookmark for {platform}: {e}")
        return JsonResponse({"error": "Error creating bookmark"}, status=500)

    logger.info(f"Bookmark created for URL: {mandatory_fields['source_url']}")
    _write_capture_log(mandatory_fields, bookmark, capture_method)

    return JsonResponse({"message": "Data captured successfully"}, status=200)
