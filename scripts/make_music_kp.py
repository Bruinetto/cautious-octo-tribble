"""Calm tech music bed for the kernel panic explainer.

Length comes from src/kernelPanicTimings.json (run make_voice_kp.py first).
It sits under the voiceover, so it is soft: pads, a gentle arp, light beat,
with a darker bar while the panic is explained.
"""
import json
import os
import sys

sys.path.insert(0, os.path.dirname(__file__))
from synth import Track, bass, hat, hit, kick, pad, pluck, sub_boom  # noqa: E402

timings = json.load(open('src/kernelPanicTimings.json'))
fps = timings['fps']
dur = timings['total'] / fps + 0.5
seg = {s['key']: s['from'] / fps for s in timings['segments']}

tr = Track(dur)
BAR = 2.4  # 100 BPM
chords = [([57, 60, 64], 45), ([53, 57, 60], 41), ([48, 52, 55], 36), ([55, 59, 62], 43)]  # Am F C G
dark = ([50, 53, 57], 38)  # Dm, for the panic part

bar = 0
t = 0.0
while t < dur:
    in_panic = seg['panic'] <= t < seg['causes']
    notes, root = dark if in_panic else chords[bar % 4]
    tr.add(pad(notes, BAR, 1200 if in_panic else 1700), t, 0.6)
    for k in range(8):
        tr.add(pluck(notes[[0, 1, 2, 1][k % 4]] + 12, 0.3, 2600), t + k * BAR / 8, 0.22, pan=(0.3 if k % 2 else -0.3))
    if t >= seg['name']:
        for b in range(4):
            tb = t + b * BAR / 4
            tr.add(kick(), tb, 0.55)
            tr.add(hat(), tb + BAR / 8, 0.45, pan=0.3)
            tr.add(bass(root, 0.3), tb, 0.45)
    bar += 1
    t += BAR

# soft accents where the story turns
tr.add(hit(1.5, 0.5), seg['name'])
tr.add(sub_boom(2.0), seg['panic'], 0.7)
tr.add(hit(1.5, 0.4), seg['causes'])
tr.add(hit(2.0, 0.5), seg['outro'])

tr.write('public/kp/music.wav', reverb=0.3, fade_out=2.5)
print('ok', round(dur, 1), 's')
