"""Epic soundtrack for the iPhone Duo announcement (14s, D minor, 120 BPM grid).
  0-1s    drone + sub swell
  1s      Barcly       taiko + braam
  2.5s    MiniTravels  taiko + braam
  4s      NetLens      taiko + braam
  5.5-8s  "are now all compatible with" -> string ostinato, taiko roll, riser, silence at 7.9s
  8s      iPhone Duo   massive impact, choir, full taiko groove
  11s     final lockup heroic F major braam + choir, long tail
"""
import os
import sys

sys.path.insert(0, os.path.dirname(__file__))
from synth import (  # noqa: E402
    Track,
    braam,
    choir,
    crash,
    drone,
    reverse_swell,
    riser,
    string_note,
    sub_boom,
    taiko,
)

tr = Track(14.0)
D3 = 50

# intro swell
tr.add(drone(38, 8.0), 0.0, 0.55)
tr.add(reverse_swell(1.0), 0.0, 0.35)

# the three names, each on a slam
for t, chord in [(1.0, [26, 38, 45, 50, 53]), (2.5, [22, 34, 46, 50, 53]), (4.0, [29, 41, 48, 53, 57])]:
    tr.add(taiko(44, 3.0), t, 1.0)
    tr.add(sub_boom(1.6), t, 0.8)
    tr.add(braam(chord, 1.5, swell=0.08, peak=2600), t, 0.85)
    tr.add(crash(1.2), t, 0.25)
# quiet pulse between the slams
for k in range(20):
    tr.add(string_note(D3 + (12 if k % 4 == 2 else 0), 0.2, 1500), 0.5 + k * 0.25, 0.15, pan=-0.3)

# 5.5-8: build
for k in range(20):
    t = 5.5 + k * 0.12
    tr.add(string_note(D3 + 12 + (k // 5), 0.12, 3200), t, 0.2 + k * 0.012, pan=(0.3 if k % 2 else -0.3))
for i, t in enumerate([5.5, 6.0, 6.5, 6.75, 7.0, 7.25, 7.5, 7.625, 7.75, 7.8125, 7.875]):
    tr.add(taiko(60 + i * 5, 7), t, 0.45 + i * 0.04, pan=(-0.25 if i % 2 else 0.25))
tr.add(riser(2.4), 5.5, 0.75)
tr.add(reverse_swell(2.0), 5.9, 0.6)
tr.silence(7.92, 8.0)

# 8s: iPhone Duo
tr.add(sub_boom(3.5), 8.0, 1.25)
tr.add(taiko(40, 2.5), 8.0, 1.0)
tr.add(crash(3.0), 8.0, 0.9)
tr.add(braam([26, 38, 45, 50, 53, 57], 3.0, swell=0.12, peak=3000), 8.0, 0.95)
tr.add(choir([62, 65, 69], 3.0), 8.0, 1.0)
for bar_t in (8.0, 9.0, 10.0):
    for t, p, g in [(0, 48, 0.9), (0.25, 66, 0.4), (0.5, 60, 0.6), (0.75, 66, 0.45)]:
        tr.add(taiko(p), bar_t + t, g, pan=0.0 if p == 48 else (0.3 if t in (0.25, 0.75) else -0.3))
    for k in range(8):
        tr.add(string_note([62, 65, 69, 65][k % 4], 0.13, 3500), bar_t + k * 0.125, 0.28, pan=(-0.35 if k % 2 else 0.35))

# 11s: heroic resolution on F major
tr.add(taiko(40, 2.0), 11.0, 1.0)
tr.add(sub_boom(2.5), 11.0, 1.1)
tr.add(crash(2.5), 11.0, 0.7)
tr.add(braam([29, 41, 48, 53, 57, 60], 3.0, swell=0.1, peak=3200), 11.0, 1.0)
tr.add(choir([65, 69, 72, 77], 3.0), 11.0, 1.2)

tr.write('public/music-duo.wav', reverb=0.4, fade_out=1.6, hall=3.5, decay=1.9)
print('ok')
