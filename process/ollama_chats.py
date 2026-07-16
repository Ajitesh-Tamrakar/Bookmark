import json
import logging

from process.generation import chat_complete

logger = logging.getLogger(__name__)

# An object, not a bare array — OpenAI's JSON mode requires an object at the top
# level, so every provider is normalized to this shape and callers read ["tags"].
TAG_LIST_SCHEMA = {
    "type": "object",
    "properties": {
        "tags": {"type": "array", "items": {"type": "string"}, "minItems": 2, "maxItems": 5},
    },
    "required": ["tags"],
}


def generate_tags_for_chunk(chunk, model):
    content = chat_complete(
        model=model,
        json_schema=TAG_LIST_SCHEMA,
        temperature=0.2,
        messages=[
            {
                "role": "system",
                "content": (
                    "You generate concise semantic topic tags. "
                    "Return only relevant high quality tags."
                ),
            },
            {
                "role": "user",
                "content": f"""
Generate 2-5 semantic tags for the following content.

Rules:
- Tags must represent important concepts
- Keep tags concise
- 1-3 words per tag
- No duplicate tags
- Avoid generic tags
- Focus on meaning not wording

Content:
{chunk}
""",
            },
        ],
    )
    return json.loads(content)["tags"]


def generate_hierarchical_tags(compressed_semantic_representation, model):
    hierarchical_prompt = f"""
    Below is a collection of semantic tags extracted from
    different sections of a long document.

    Generate broader high-level concepts representing
    the ENTIRE document.

    Rules:
    - Generate 2-5 tags
    - Tags should be broader concepts
    - Avoid duplicates
    - Avoid overly generic words
    - Keep tags concise
    - 1-3 words per tag

    Chunk Tags:
    {compressed_semantic_representation}
    """
    logger.info('Generating final hierarchical tags')
    content = chat_complete(
        model=model,
        json_schema=TAG_LIST_SCHEMA,
        temperature=0.2,
        messages=[
            {
                "role": "system",
                "content": "You generate high-level semantic concepts from lower-level semantic tags.",
            },
            {"role": "user", "content": hierarchical_prompt},
        ],
    )
    return json.loads(content)["tags"]
