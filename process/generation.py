import base64
import logging
import mimetypes

from core.models import Config

logger = logging.getLogger(__name__)


def chat_complete(messages, *, model, json_schema=None, temperature=None, image_paths=None):
    """
    Run a chat completion with whatever generation provider/model is configured.

    messages: list of {"role": "system"|"user", "content": str} — provider-neutral.
    json_schema: pass the same dict callers previously passed to Ollama's `format=`.
        Ollama gets it verbatim; other providers get best-effort JSON-mode behavior
        driven by the prompt (see note below). Callers must ask for an object shape
        (e.g. {"tags": [...]}), not a bare array — OpenAI's JSON mode requires an
        object.
    image_paths: optional list of local file paths to attach as images (vision).

    Returns the assistant's text content as a plain string.
    """
    provider = Config.get().generation_provider

    if provider == Config.GenerationProvider.OLLAMA:
        return _chat_ollama(model, messages, json_schema, temperature, image_paths)
    if provider == Config.GenerationProvider.OPENAI:
        return _chat_openai(model, messages, json_schema, temperature, image_paths)
    if provider == Config.GenerationProvider.ANTHROPIC:
        return _chat_anthropic(model, messages, json_schema, temperature, image_paths)
    if provider == Config.GenerationProvider.GOOGLE:
        return _chat_google(model, messages, json_schema, temperature, image_paths)
    raise ValueError(f'Unsupported generation provider: {provider!r}')


def _chat_ollama(model, messages, json_schema, temperature, image_paths):
    from ollama import chat

    messages = [dict(m) for m in messages]
    if image_paths:
        messages[-1]['images'] = image_paths

    kwargs = {}
    if json_schema is not None:
        kwargs['format'] = json_schema
    if temperature is not None:
        kwargs['options'] = {'temperature': temperature}

    response = chat(model=model, messages=messages, **kwargs)
    return response['message']['content']


def _read_image(path):
    mime, _ = mimetypes.guess_type(path)
    mime = mime or 'image/jpeg'
    with open(path, 'rb') as f:
        return mime, f.read()


def _encode_image(path):
    mime, raw = _read_image(path)
    return mime, base64.b64encode(raw).decode('ascii')


def _chat_openai(model, messages, json_schema, temperature, image_paths):
    from openai import OpenAI
    from core.secrets import get_api_key

    client = OpenAI(api_key=get_api_key('openai'))
    messages = [dict(m) for m in messages]

    if image_paths:
        last = messages[-1]
        content = [{'type': 'text', 'text': last['content']}]
        for path in image_paths:
            mime, data = _encode_image(path)
            content.append({
                'type': 'image_url',
                'image_url': {'url': f'data:{mime};base64,{data}'},
            })
        last['content'] = content

    kwargs = {}
    if json_schema is not None:
        kwargs['response_format'] = {'type': 'json_object'}
    if temperature is not None:
        kwargs['temperature'] = temperature

    response = client.chat.completions.create(model=model, messages=messages, **kwargs)
    return response.choices[0].message.content


def _chat_anthropic(model, messages, json_schema, temperature, image_paths):
    import anthropic
    from core.secrets import get_api_key

    client = anthropic.Anthropic(api_key=get_api_key('anthropic'))

    system = '\n'.join(m['content'] for m in messages if m['role'] == 'system') or None
    turns = [dict(m) for m in messages if m['role'] != 'system']

    if image_paths and turns:
        last = turns[-1]
        content = [{'type': 'text', 'text': last['content']}]
        for path in image_paths:
            mime, data = _encode_image(path)
            content.append({
                'type': 'image',
                'source': {'type': 'base64', 'media_type': mime, 'data': data},
            })
        last['content'] = content

    kwargs = {'temperature': temperature if temperature is not None else 1.0}
    if system:
        kwargs['system'] = system

    response = client.messages.create(
        model=model, messages=turns, max_tokens=2048, **kwargs
    )
    return ''.join(block.text for block in response.content if block.type == 'text')


def _chat_google(model, messages, json_schema, temperature, image_paths):
    from google import genai
    from google.genai import types
    from core.secrets import get_api_key

    client = genai.Client(api_key=get_api_key('google'))

    system = '\n'.join(m['content'] for m in messages if m['role'] == 'system') or None
    turns = [m for m in messages if m['role'] != 'system']

    parts = []
    for m in turns:
        parts.append(m['content'])
    if image_paths:
        for path in image_paths:
            mime, raw = _read_image(path)
            parts.append(types.Part.from_bytes(data=raw, mime_type=mime))

    config_kwargs = {}
    if system:
        config_kwargs['system_instruction'] = system
    if temperature is not None:
        config_kwargs['temperature'] = temperature
    if json_schema is not None:
        config_kwargs['response_mime_type'] = 'application/json'

    response = client.models.generate_content(
        model=model,
        contents=parts,
        config=types.GenerateContentConfig(**config_kwargs) if config_kwargs else None,
    )
    return response.text
