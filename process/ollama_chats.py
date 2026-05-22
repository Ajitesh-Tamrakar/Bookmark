import json
from ollama import chat
import logging

schema = {"type": "array", "items": {"type": "string"}, "minItems": 2, "maxItems": 5}


def generate_tags_for_chunk(chunk):

    response = chat(
        model="gemma4:e2b",
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
        format=schema,
        options={"temperature": 0.2},
    )

    tags = json.loads(response["message"]["content"])
    return tags





def generate_hierarchical_tags(compressed_semantic_representation):
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

    print("\n===================================")
    print("GENERATING FINAL HIERARCHICAL TAGS")
    print("===================================")

    final_response = chat(
        model="gemma4:e2b",

        messages=[
            {
                "role": "system",
                "content": (
                    "You generate high-level semantic concepts "
                    "from lower-level semantic tags."
                )
            },

            {
                "role": "user",
                "content": hierarchical_prompt
            }
        ],

        format={
            "type": "array",
            "items": {
                "type": "string"
            },
            "minItems": 2,
            "maxItems": 5
        },

        options={
            "temperature": 0.2
        }
    )

    final_tags = json.loads(final_response["message"]["content"])
    return final_tags
