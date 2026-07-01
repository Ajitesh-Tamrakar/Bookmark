from core.models import Bookmark, Chunk


CHUNK_TARGET_WORDS = 400
CHUNK_OVERLAP_WORDS = 50


def _word_count(text):
    return len(text.split())


def _success():
    return {'status': 'success', 'error': ''}


def _failure(error):
    return {'status': 'failed', 'error': str(error)}


def chunk_text(bookmark):
    try:
        text = (bookmark.raw_text or {}).get("text")
        if not text:
            return _success()
        Chunk.objects.create(
            bookmark=bookmark,
            text=text,
            chunk_type=Chunk.ChunkType.POST,
            chunk_index=None,
            timestamp_seconds=None,
            word_count=_word_count(text),
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
            text=text,
            chunk_type=Chunk.ChunkType.IMAGE,
            chunk_index=0,
            timestamp_seconds=None,
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

        if isinstance(video, str):
            Chunk.objects.create(
                bookmark=bookmark,
                text=video,
                chunk_type=Chunk.ChunkType.VIDEO,
                chunk_index=0,
                timestamp_seconds=None,
                word_count=_word_count(video),
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
                    text=chunk_text_value,
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
        Chunk.objects.create(
            bookmark=bookmark,
            text=text,
            chunk_type=Chunk.ChunkType.VIDEO,
            chunk_index=0,
            timestamp_seconds=None,
            word_count=_word_count(text),
        )
        return _success()
    except Exception as e:
        return _failure(e)


def chunk_video_web(bookmark):
    try:
        text = (bookmark.raw_text or {}).get("video")
        if not text:
            return _success()
        Chunk.objects.create(
            bookmark=bookmark,
            text=text,
            chunk_type=Chunk.ChunkType.VIDEO,
            chunk_index=0,
            timestamp_seconds=None,
            word_count=_word_count(text),
        )
        return _success()
    except Exception as e:
        return _failure(e)


VIDEO_CHUNK_LEAVES = {
    Bookmark.Platform.YOUTUBE: chunk_video_youtube,
    Bookmark.Platform.TWITTER: chunk_video_twitter,
    Bookmark.Platform.WEB:     chunk_video_web,
}
