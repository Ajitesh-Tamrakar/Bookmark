import glob
import os

import requests
import yt_dlp


def download_image(url, dest_path):
    try:
        if os.path.exists(dest_path):
            os.remove(dest_path)
        response = requests.get(url, timeout=15)
        response.raise_for_status()
        with open(dest_path, 'wb') as f:
            f.write(response.content)
        return {'status': 'success', 'error': ''}
    except Exception as e:
        return {'status': 'failed', 'error': str(e)}


def _reconcile_output(dest_path):
    """yt-dlp postprocessors can change the output extension; find the actual file and rename it."""
    if os.path.exists(dest_path):
        return
    stem = os.path.splitext(dest_path)[0]
    matches = glob.glob(stem + '.*')
    if matches:
        os.rename(matches[0], dest_path)


def _yt_dlp_download(url, dest_path, audio_only):
    if os.path.exists(dest_path):
        os.remove(dest_path)
    opts = {'outtmpl': dest_path, 'quiet': True, 'no_warnings': True}
    if audio_only:
        opts.update({
            'format': 'bestaudio/best',
            'postprocessors': [{'key': 'FFmpegExtractAudio', 'preferredcodec': 'mp3'}],
        })
    with yt_dlp.YoutubeDL(opts) as ydl:
        ydl.download([url])
    _reconcile_output(dest_path)


def download_audio_only(url, dest_path):
    try:
        _yt_dlp_download(url, dest_path, audio_only=True)
        return {'status': 'success', 'error': ''}
    except Exception as e:
        return {'status': 'failed', 'error': str(e)}


def download_video(url, dest_path):
    try:
        _yt_dlp_download(url, dest_path, audio_only=False)
        return {'status': 'success', 'error': ''}
    except Exception as e:
        return {'status': 'failed', 'error': str(e)}
