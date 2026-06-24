import json
import logging
from ollama import chat

logger = logging.getLogger(__name__)

TAG_LIST_SCHEMA = {"type": "array", "items": {"type": "string"}, "minItems": 2, "maxItems": 5}


def generate_tags_for_chunk(chunk, model):
    response = chat(
        model=model,
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
        format=TAG_LIST_SCHEMA,
        options={"temperature": 0.2},
    )
    return json.loads(response["message"]["content"])


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
    final_response = chat(
        model=model,
        messages=[
            {
                "role": "system",
                "content": "You generate high-level semantic concepts from lower-level semantic tags.",
            },
            {"role": "user", "content": hierarchical_prompt},
        ],
        format=TAG_LIST_SCHEMA,
        options={"temperature": 0.2},
    )
    return json.loads(final_response["message"]["content"])
