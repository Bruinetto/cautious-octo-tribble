"""Soundtrack for the iPhone Duo announcement (13s, 120 BPM).
  0s     barcly / minitravels      hit, pad + arp, no kick yet (anticipation)
  4s     iPhone Duo                hit, full groove
  7-8s   "But..."                  silence, one soft note, reverse swell
  8s     barcly already compatible big hit, bright groove
  12s                              final hit, fade to 13s
"""
import os
import sys

sys.path.insert(0, os.path.dirname(__file__))
from synth import Track, bass, clap, hat, hit, kick, pad, pluck, whoosh

tr = Track(13.0)


def groove(t0, bars, root, notes, kick_on=True):
    for bar in range(bars):
        for b in range(4):
            tb = t0 + bar * 2 + b * 0.5
            if kick_on:
                tr.add(kick(), tb, 0.95)
                if b in (1, 3):
                    tr.add(clap(), tb, 0.9)
                tr.add(bass(root, 0.22), tb, 0.8)
                tr.add(bass(root + 12, 0.18), tb + 0.25, 0.5)
            tr.add(hat(), tb + 0.25, 0.8, pan=0.3)
            tr.add(hat(), tb + 0.125, 0.35, pan=-0.3)
            tr.add(hat(), tb + 0.375, 0.35, pan=-0.3)
        for k in range(16):
            tr.add(pluck(notes[[0, 1, 2, 1][k % 4]] + 12), t0 + bar * 2 + k * 0.125, 0.3, pan=(0.35 if k % 2 else -0.35))


# 0-4: anticipation (A minor -> F), no kick
tr.add(hit(1.8, 0.7), 0.0)
tr.add(pad([57, 60, 64], 2.0, 1400), 0.0, 0.7)
tr.add(pad([53, 57, 60], 2.0, 1800), 2.0, 0.7)
groove(0.0, 1, 45, [57, 60, 64], kick_on=False)
groove(2.0, 1, 41, [53, 57, 60], kick_on=False)
tr.add(whoosh(1.0), 3.0, 0.7)

# 4-7: iPhone Duo (C -> G), full groove
tr.add(hit(2.0, 1.0), 4.0)
tr.add(pad([48, 52, 55, 60], 2.0, 2400), 4.0, 0.8)
tr.add(pad([43, 50, 55, 59], 1.2, 2400), 6.0, 0.8)
groove(4.0, 2, 36, [60, 64, 67])
tr.duck(6.6, 7.0)
tr.silence(7.0, 8.0)

# 7-8: "But..." — a single soft note and a swell into the drop
tr.add(pluck(64, 1.0, 1800), 7.0, 0.5)
tr.add(whoosh(1.0), 7.0, 0.45)

# 8-12: barcly already compatible — bright Cmaj9, big hit
tr.add(hit(3.0, 1.2), 8.0)
tr.add(pad([48, 52, 55, 59, 62], 5.0, 2800, 0.05), 8.0, 1.0)
tr.add(pluck(76, 1.2), 8.0, 0.6)
tr.add(pluck(79, 1.2), 8.5, 0.45)
groove(8.0, 2, 36, [60, 64, 67])
tr.add(hit(2.0, 0.6), 12.0)

tr.write('public/music-duo.wav')
print('ok')
