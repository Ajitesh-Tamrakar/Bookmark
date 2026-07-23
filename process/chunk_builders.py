import re

from core.models import Bookmark, Chunk


CHUNK_TARGET_WORDS = 280
CHUNK_OVERLAP_WORDS = 50


def _word_count(text):
    return len(text.split())


def _success():
    return {'status': 'success', 'error': ''}


def _failure(error):
    return {'status': 'failed', 'error': str(error)}


def context_header(bookmark):
    """
    "{title} by {author} (platform)\n\n" prefix so title/author signal
    (often the highest-signal text a bookmark has) enters every chunk's
    embedding, not just a dedicated metadata chunk.
    """
    parts = []
    if bookmark.title:
        parts.append(bookmark.title)
    if bookmark.author:
        parts.append(f"by {bookmark.author}")
    if bookmark.platform:
        parts.append(f"({bookmark.get_platform_display()})")
    if not parts:
        return ""
    return " ".join(parts) + "\n\n"


def sliding_window_chunks(text, target_words=CHUNK_TARGET_WORDS, overlap_words=CHUNK_OVERLAP_WORDS):
    """Split text on paragraph/sentence boundaries into ~target_words chunks with overlap."""
    paragraphs = [p.strip() for p in re.split(r"\n\s*\n", text.strip()) if p.strip()]
    sentences = []
    for para in paragraphs:
        sentences.extend(s.strip() for s in re.split(r"(?<=[.!?])\s+", para) if s.strip())

    if not sentences:
        return []

    chunks = []
    current = []
    current_words = 0

    for i, sentence in enumerate(sentences):
        current.append(sentence)
        current_words += _word_count(sentence)

        if current_words >= target_words or i == len(sentences) - 1:
            chunks.append(" ".join(current))

            carry = []
            carry_words = 0
            if len(current) > 1:
                for s in reversed(current):
                    carry_words += _word_count(s)
                    carry.insert(0, s)
                    if carry_words >= overlap_words:
                        break
            current = carry
            current_words = carry_words

    return chunks


def chunk_text(bookmark):
    try:
        text = (bookmark.raw_text or {}).get("text")
        if not text:
            return _success()

        header = context_header(bookmark)
        for chunk_index, piece in enumerate(sliding_window_chunks(text)):
            Chunk.objects.create(
                bookmark=bookmark,
                text=header + piece,
                chunk_type=Chunk.ChunkType.POST,
                chunk_index=chunk_index,
                timestamp_seconds=None,
                word_count=_word_count(piece),
            )
        return _success()
    except Exception as e:
        return _failure(e)


def chunk_image(bookmark):
    try:
        text = (bookmark.raw_text or {}).get("image")
        if not text:
            return _success()
        Chunk.objects.create(
            bookmark=bookmark,
            text=context_header(bookmark) + text,
            chunk_type=Chunk.ChunkType.IMAGE,
            chunk_index=0,
            timestamp_seconds=None,
            word_count=_word_count(text),
        )
        return _success()
    except Exception as e:
        return _failure(e)


def chunk_highlight(bookmark):
    try:
        text = (bookmark.platform_metadata or {}).get("highlighted_text")
        if not text:
            return _success()
        Chunk.objects.create(
            bookmark=bookmark,
            text=context_header(bookmark) + text,
            chunk_type=Chunk.ChunkType.HIGHLIGHT,
            chunk_index=0,
            timestamp_seconds=None,
            word_count=_word_count(text),
        )
        return _success()
    except Exception as e:
        return _failure(e)


def chunk_screenshot(bookmark):
    try:
        text = (bookmark.raw_text or {}).get("screenshot")
        if not text:
            return _success()
        Chunk.objects.create(
            bookmark=bookmark,
            text=context_header(bookmark) + text,
            chunk_type=Chunk.ChunkType.SCREENSHOT,
            chunk_index=0,
            timestamp_seconds=None,
            word_count=_word_count(text),
        )
        return _success()
    except Exception as e:
        return _failure(e)


def chunk_metadata(bookmark):
    """One dense chunk of title/author/platform so short gist-queries have a target."""
    try:
        parts = []
        if bookmark.title:
            parts.append(bookmark.title)
        if bookmark.author:
            parts.append(f"by {bookmark.author}")
        if bookmark.platform:
            parts.append(f"({bookmark.get_platform_display()})")
        text = " ".join(parts).strip()
        if not text:
            return _success()
        Chunk.objects.create(
            bookmark=bookmark,
            text=text,
            chunk_type=Chunk.ChunkType.METADATA,
            chunk_index=None,
            timestamp_seconds=None,
            word_count=_word_count(text),
        )
        return _success()
    except Exception as e:
        return _failure(e)


def upsert_note_chunk(bookmark):
    """Replace this bookmark's NOTE chunk with the current user_note, if any."""
    try:
        Chunk.objects.filter(bookmark=bookmark, chunk_type=Chunk.ChunkType.NOTE).delete()
        text = bookmark.user_note
        if not text or not text.strip():
            return _success()
        Chunk.objects.create(
            bookmark=bookmark,
            text=context_header(bookmark) + text,
            chunk_type=Chunk.ChunkType.NOTE,
            chunk_index=None,
            timestamp_seconds=None,
            is_note=True,
            word_count=_word_count(text),
        )
        return _success()
    except Exception as e:
        return _failure(e)


def chunk_video_youtube(bookmark):
    try:
        video = (bookmark.raw_text or {}).get("video")
        if not video:
            return _success()

        header = context_header(bookmark)

        if isinstance(video, str):
            for chunk_index, piece in enumerate(sliding_window_chunks(video)):
                Chunk.objects.create(
                    bookmark=bookmark,
                    text=header + piece,
                    chunk_type=Chunk.ChunkType.VIDEO,
                    chunk_index=chunk_index,
                    timestamp_seconds=None,
                    word_count=_word_count(piece),
                )
            return _success()

        segments = video
        chunk_index = 0
        i = 0
        current = []
        current_words = 0

        while i < len(segments):
            current.append(i)
            current_words += _word_count(segments[i]["text"])

            if current_words >= CHUNK_TARGET_WORDS or i == len(segments) - 1:
                chunk_text_value = " ".join(segments[j]["text"] for j in current)
                chunk_start = segments[current[0]]["start"]
                Chunk.objects.create(
                    bookmark=bookmark,
                    text=header + chunk_text_value,
                    chunk_type=Chunk.ChunkType.VIDEO,
                    chunk_index=chunk_index,
                    timestamp_seconds=int(chunk_start),
                    word_count=_word_count(chunk_text_value),
                )
                chunk_index += 1

                overlap = []
                overlap_words = 0
                if len(current) > 1:
                    for j in reversed(current):
                        overlap_words += _word_count(segments[j]["text"])
                        overlap.insert(0, j)
                        if overlap_words >= CHUNK_OVERLAP_WORDS:
                            break
                current = overlap
                current_words = overlap_words

            i += 1

        return _success()
    except Exception as e:
        return _failure(e)


def chunk_video_twitter(bookmark):
    try:
        text = (bookmark.raw_text or {}).get("video")
        if not text:
            return _success()

        header = context_header(bookmark)
        for chunk_index, piece in enumerate(sliding_window_chunks(text)):
            Chunk.objects.create(
                bookmark=bookmark,
                text=header + piece,
                chunk_type=Chunk.ChunkType.VIDEO,
                chunk_index=chunk_index,
                timestamp_seconds=None,
                word_count=_word_count(piece),
            )
        return _success()
    except Exception as e:
        return _failure(e)


def chunk_video_web(bookmark):
    try:
        text = (bookmark.raw_text or {}).get("video")
        if not text:
            return _success()

        header = context_header(bookmark)
        for chunk_index, piece in enumerate(sliding_window_chunks(text)):
            Chunk.objects.create(
                bookmark=bookmark,
                text=header + piece,
                chunk_type=Chunk.ChunkType.VIDEO,
                chunk_index=chunk_index,
                timestamp_seconds=None,
                word_count=_word_count(piece),
            )
        return _success()
    except Exception as e:
        return _failure(e)


VIDEO_CHUNK_LEAVES = {
    Bookmark.Platform.YOUTUBE: chunk_video_youtube,
    Bookmark.Platform.TWITTER: chunk_video_twitter,
    Bookmark.Platform.WEB:     chunk_video_web,
}
