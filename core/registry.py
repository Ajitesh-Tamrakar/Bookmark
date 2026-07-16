EMBEDDING_REGISTRY = {
    'ollama': {
        'nomic-embed-text-v2-moe': 768,
        'nomic-embed-text':        768,
        'mxbai-embed-large':       1024,
        'all-minilm':              384,
    },
    'openai': {
        'text-embedding-3-small': 1536,
        'text-embedding-3-large': 3072,
    },
    'google': {
        'text-embedding-004': 768,
    },
}

# Model family drives instruction-prefix behavior in process/embeddings.py.
# Families not listed here get no prefix (OpenAI/Google embeddings need none).
EMBEDDING_MODEL_FAMILY = {
    'nomic-embed-text-v2-moe': 'nomic',
    'nomic-embed-text':        'nomic',
}

GENERATION_REGISTRY = {
    'ollama': [
        'gemma4:e2b',
        'llama3.2:3b',
        'qwen2.5:7b',
        'mistral:7b',
    ],
    'openai': [
        'gpt-4o-mini',
        'gpt-4o',
    ],
    'anthropic': [
        'claude-haiku-4',
        'claude-sonnet-4',
    ],
    'google': [
        'gemini-2.0-flash',
        'gemini-1.5-pro',
    ],
}