import json
import os
import threading
import urllib.request

_pull_status = {}
_lock = threading.Lock()

OLLAMA_BASE_URL = os.environ.get('OLLAMA_BASE_URL', 'http://localhost:11434')

WHISPER_MODEL_MAP = {
    'tiny':   'openai/whisper-tiny',
    'base':   'openai/whisper-base',
    'small':  'openai/whisper-small',
    'medium': 'openai/whisper-medium',
    'large':  'openai/whisper-large-v3',
}


def pull_whisper(whisper_size):
    key = f'whisper-{whisper_size}'
    with _lock:
        if _pull_status.get(key, {}).get('status') == 'pulling':
            return
        _pull_status[key] = {'status': 'pulling', 'percent': 0}

    thread = threading.Thread(target=_whisper_worker, args=(whisper_size,), daemon=True)
    thread.start()


def _whisper_worker(whisper_size):
    key = f'whisper-{whisper_size}'
    repo_id = WHISPER_MODEL_MAP.get(whisper_size, f'openai/whisper-{whisper_size}')
    try:
        from huggingface_hub import HfApi, hf_hub_download

        api = HfApi()
        files = [f.rfilename for f in api.model_info(repo_id).siblings or []]
        total = len(files) or 1

        for i, filename in enumerate(files):
            hf_hub_download(repo_id=repo_id, filename=filename)
            percent = int((i + 1) / total * 100)
            with _lock:
                _pull_status[key] = {'status': 'pulling', 'percent': percent}

        with _lock:
            _pull_status[key] = {'status': 'done', 'percent': 100}

    except Exception as e:
        with _lock:
            _pull_status[key] = {'status': 'error', 'percent': 0, 'error': str(e)}


def get_status():
    with _lock:
        return dict(_pull_status)


def pull_model(model_name):
    with _lock:
        if _pull_status.get(model_name, {}).get('status') == 'pulling':
            return
        _pull_status[model_name] = {'status': 'pulling', 'percent': 0}

    thread = threading.Thread(target=_pull_worker, args=(model_name,), daemon=True)
    thread.start()


def _pull_worker(model_name):
    try:
        payload = json.dumps({'name': model_name, 'stream': True}).encode()
        req = urllib.request.Request(
            f'{OLLAMA_BASE_URL}/api/pull',
            data=payload,
            headers={'Content-Type': 'application/json'},
            method='POST',
        )
        with urllib.request.urlopen(req) as resp:
            for raw_line in resp:
                line = raw_line.decode().strip()
                if not line:
                    continue
                try:
                    event = json.loads(line)
                except json.JSONDecodeError:
                    continue

                total = event.get('total', 0)
                completed = event.get('completed', 0)
                percent = int(completed / total * 100) if total > 0 else 0

                with _lock:
                    _pull_status[model_name] = {'status': 'pulling', 'percent': percent}

        with _lock:
            _pull_status[model_name] = {'status': 'done', 'percent': 100}

    except Exception as e:
        with _lock:
            _pull_status[model_name] = {'status': 'error', 'percent': 0, 'error': str(e)}
