import re
from core.models import Bookmark

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
        payload = {"text": payload, "image": None, "video": None}
    payload.setdefault("text", None)
    payload.setdefault("image", None)
    payload.setdefault("video", None)
    return payload


def update_raw_text_key(bookmark, key, value):
    payload = raw_text_payload(bookmark)
    payload[key] = value
    Bookmark.objects.filter(id=bookmark.id).update(raw_text=payload)
    bookmark.raw_text = payload
