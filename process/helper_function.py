import re

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
