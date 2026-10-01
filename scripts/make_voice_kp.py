"""Voiceover for the kernel panic explainer, generated offline with Kokoro TTS.

Writes one wav per line to public/kp/ and src/kernelPanicTimings.json with the
frame where each line starts, so the animation follows the voice.

  pip install kokoro-onnx soundfile
  python3 scripts/make_voice_kp.py
"""
import json
import os
import urllib.request

import soundfile as sf
from kokoro_onnx import Kokoro

FPS = 30
VOICE = 'af_heart'
SPEED = 1.0
MODEL_URL = 'https://github.com/thewh1teagle/kokoro-onnx/releases/download/model-files-v1.0/'
CACHE = os.path.expanduser('~/.cache/kokoro')
LEAD_IN = 0.6  # seconds before the first line
GAP = 0.45  # pause between lines
TAIL = 3.0  # outro after the last line

LINES = [
    ('hook', 'Your iPhone just restarted, all on its own?'),
    ('name', "That might have been a kernel panic. Here's what it means."),
    ('kernel', 'The kernel is the core of iOS. It sits between your apps and the hardware, managing memory, the processor, and every component.'),
    ('panic', "A kernel panic happens when the kernel hits an error it can't safely recover from."),
    ('restart', 'So instead of risking your data, it stops everything, and restarts the iPhone.'),
    ('causes', 'Common causes are software bugs, faulty hardware like a worn battery or a damaged cable, repairs with non-genuine parts, and jailbreak tweaks.'),
    ('check', 'To check, open Settings, Privacy and Security, Analytics and Improvements, then Analytics Data. Look for files that start with panic full.'),
    ('fix', 'One panic now and then is nothing to worry about. Keep iOS updated, and keep a backup.'),
    ('frequent', "But if your iPhone keeps restarting every few minutes, it often points to hardware. Get it checked."),
    ('outro', "That's a kernel panic, explained."),
]


def model_files():
    os.makedirs(CACHE, exist_ok=True)
    paths = []
    for name in ('kokoro-v1.0.onnx', 'voices-v1.0.bin'):
        path = os.path.join(CACHE, name)
        if not os.path.exists(path):
            print('downloading', name)
            urllib.request.urlretrieve(MODEL_URL + name, path)
        paths.append(path)
    return paths


def main():
    tts = Kokoro(*model_files())
    os.makedirs('public/kp', exist_ok=True)
    t = LEAD_IN
    segments = []
    for key, text in LINES:
        out = f'public/kp/{key}.wav'
        samples, sr = tts.create(text, voice=VOICE, speed=SPEED, lang='en-us')
        sf.write(out, samples, sr)
        dur = len(samples) / sr
        segments.append(
            {
                'key': key,
                'text': text,
                'file': f'kp/{key}.wav',
                'from': round(t * FPS),
                'duration': round(dur * FPS),
            }
        )
        print(f'{key:9s} {t:6.2f}s  +{dur:.2f}s')
        t += dur + GAP
    total = round((t - GAP + TAIL) * FPS)
    with open('src/kernelPanicTimings.json', 'w') as fh:
        json.dump({'fps': FPS, 'total': total, 'segments': segments}, fh, indent=2)
    print('total', total / FPS, 's')


if __name__ == '__main__':
    main()
