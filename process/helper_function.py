import os
import re
from pathlib import Path

from core.models import Bookmark, Config

TEMP_DIR = Path(__file__).resolve().parent.parent / "tmp" / "captures"


def temp_file_path(bookmark_id, modality, ext):
    TEMP_DIR.mkdir(parents=True, exist_ok=True)
    return str(TEMP_DIR / f"{bookmark_id}_{modality}.{ext}")


def cleanup_temp_file(path):
    if Config.get().dev_mode:
        return
    try:
        if os.path.exists(path):
            os.remove(path)
    except OSError:
        pass

def normalize_tag(tag: str) -> str:
    """
    Normalize tags for deduplication.
    """

    tag = tag.lower().strip()

    # remove extra spaces
    tag = re.sub(r"\s+", " ", tag)

    # remove special chars except spaces
    tag = re.sub(r"[^a-zA-Z0-9\s]", "", tag)

    return tag


def raw_text_payload(bookmark):
    payload = bookmark.raw_text or {}
    if not isinstance(payload, dict):
        payload = {"text": payload, "image": None, "video": None, "screenshot": None}
    payload.setdefault("text", None)
    payload.setdefault("image", None)
    payload.setdefault("video", None)
    payload.setdefault("screenshot", None)
    return payload


def update_raw_text_key(bookmark, key, value):
    payload = raw_text_payload(bookmark)
    payload[key] = value
    Bookmark.objects.filter(id=bookmark.id).update(raw_text=payload)
    bookmark.raw_text = payload
