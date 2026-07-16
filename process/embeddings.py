import logging

from core.models import Config
from core.registry import EMBEDDING_MODEL_FAMILY

logger = logging.getLogger(__name__)

# Instruction prefixes some embedding families expect on documents vs. queries.
# Models/families not listed here (OpenAI, Google) get no prefix.
FAMILY_PREFIXES = {
    'nomic': {'document': 'search_document: ', 'query': 'search_query: '},
}


def embed_texts(texts, *, task):
    """
    Embed a batch of texts with whatever provider/model is configured.

    task: 'document' (indexing pipeline) or 'query' (search-time). Selects the
    instruction prefix for models that need one — has no effect on providers that
    don't (OpenAI, Google).

    Returns a list[list[float]] in the same order as `texts`.
    """
    config = Config.get()
    provider = config.embedding_provider
    model = config.embedding_model_name

    family = EMBEDDING_MODEL_FAMILY.get(model)
    prefix = FAMILY_PREFIXES.get(family, {}).get(task, '')
    prepared = [prefix + t for t in texts] if prefix else list(texts)

    if provider == Config.EmbeddingProvider.OLLAMA:
        return _embed_ollama(model, prepared)
    if provider == Config.EmbeddingProvider.OPENAI:
        return _embed_openai(model, prepared)
    if provider == Config.EmbeddingProvider.GOOGLE:
        return _embed_google(model, prepared)
    raise ValueError(f'Unsupported embedding provider: {provider!r}')


def _embed_ollama(model, texts):
    from ollama import embed
    response = embed(model=model, input=texts)
    return list(response.embeddings)


def _embed_openai(model, texts):
    from openai import OpenAI
    from core.secrets import get_api_key

    client = OpenAI(api_key=get_api_key('openai'))
    response = client.embeddings.create(model=model, input=texts)
    return [d.embedding for d in response.data]


def _embed_google(model, texts):
    from google import genai
    from core.secrets import get_api_key

    client = genai.Client(api_key=get_api_key('google'))
    result = client.models.embed_content(model=model, contents=texts)
    return [e.values for e in result.embeddings]
