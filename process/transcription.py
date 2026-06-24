from faster_whisper import WhisperModel

from core.models import Config

_model_cache = {}


def _get_model():
    model_name = Config.get().whisper_model_name or 'base'
    if model_name not in _model_cache:
        _model_cache[model_name] = WhisperModel(model_name, device='cpu', compute_type='int8')
    return _model_cache[model_name]


def transcribe_to_segments(media_path):
    model = _get_model()
    segments, _info = model.transcribe(media_path)
    return [
        {'text': seg.text.strip(), 'start': seg.start, 'duration': seg.end - seg.start}
        for seg in segments
    ]
