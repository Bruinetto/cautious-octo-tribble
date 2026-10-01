"""Very epic trailer soundtrack for the kernel panic motion piece (44s, D minor, 120 BPM).
Bar = 2s = 60 frames @30fps. The hit times below are mirrored in src/KernelPanicEpic.tsx.

  0-4s    tension: drone, ticking, sub boom at 2s (screen dies)
  4s      KERNEL PANIC: braam + taiko + crash
  8-14s   the kernel: layer slams 8/8.5/9/9.5, chip hits 12/12.5/13
  14-18s  the panic: red braam at 15, build, taiko roll, silence at 17.9
  18s     DROP: STOP / RESTART, choir, heavy groove
  22-30s  four causes, one braam every 2s (Dm Bb F C)
  30-34s  how to check: hits on every beat, file at 32
  34-40s  what to do: brighter, hits on each line
  40s     final hit, long tail
"""
import os
import sys

sys.path.insert(0, os.path.dirname(__file__))
from synth import (  # noqa: E402
    Track,
    braam,
    brass,
    choir,
    clang,
    crash,
    drone,
    hat,
    reverse_swell,
    riser,
    snare_roll,
    string_note,
    sub_boom,
    taiko,
)

tr = Track(44.0)
D3 = 50
DM = [26, 38, 45, 50, 53]
BB = [22, 34, 46, 50, 53]
F = [29, 41, 48, 53, 57]
C = [24, 36, 43, 48, 52]


def slam(t, chord, gain=0.85, choir_notes=None):
    tr.add(taiko(44, 3.0), t, 1.0)
    tr.add(sub_boom(1.8), t, 0.9)
    tr.add(braam(chord, 1.8, swell=0.06, peak=2800), t, gain)
    tr.add(crash(1.5), t, 0.3)
    if choir_notes:
        tr.add(choir(choir_notes, 2.0), t, 0.9)


def ostinato(t0, t1, notes, step=0.125, gain=0.26):
    k = 0
    t = t0
    while t < t1:
        tr.add(string_note(notes[k % len(notes)], 0.13, 3300), t, gain, pan=(-0.35 if k % 2 else 0.35))
        t += step
        k += 1


def groove(t0, t1, heavy=False):
    t = t0
    while t < t1 - 0.01:
        for off, p, g in [(0, 46, 0.95), (0.5, 62, 0.45), (0.75, 66, 0.4), (1.0, 46, 0.85), (1.5, 70, 0.5), (1.75, 70, 0.45)]:
            if t + off < t1:
                tr.add(taiko(p, 5 if p == 46 else 7), t + off, g * (1.1 if heavy else 1), pan=0 if p == 46 else (0.3 if off % 0.5 else -0.3))
        t += 2.0


# 0-4: tension
tr.add(drone(38, 18.0), 0.0, 0.6)
for k in range(16):
    tr.add(hat(), k * 0.25, 0.5 + (k % 4 == 0) * 0.4, pan=(0.4 if k % 2 else -0.4))
tr.add(reverse_swell(1.9), 0.1, 0.5)
tr.add(sub_boom(2.0), 2.0, 1.0)
tr.add(taiko(40, 2.5), 2.0, 0.9)
tr.add(riser(1.9), 2.1, 0.5)

# 4: KERNEL PANIC
slam(4.0, DM, 1.0)
ostinato(4.0, 8.0, [D3, D3, D3 + 3, D3], 0.25, 0.22)
tr.add(riser(1.0), 7.0, 0.5)

# 8-14: the kernel
for t in (8.0, 8.5, 9.0, 9.5):
    tr.add(taiko(48, 4), t, 1.0)
    tr.add(sub_boom(0.8), t, 0.5)
tr.add(braam(DM, 2.0, swell=0.3, peak=2200), 8.0, 0.6)
tr.add(braam(BB, 2.0, swell=0.3, peak=2200), 10.0, 0.6)
tr.add(braam(DM, 2.0, swell=0.3, peak=2200), 12.0, 0.6)
groove(10.0, 14.0)
ostinato(8.0, 14.0, [D3 + 12, D3 + 15, D3 + 19, D3 + 15])
for t in (12.0, 12.5, 13.0):
    tr.add(taiko(56, 5), t, 0.9)

# 14-18: the panic builds
tr.add(braam([26, 38, 44, 50, 53], 3.0, swell=0.08, peak=3200), 15.0, 1.0)  # dissonant b5
tr.add(sub_boom(2.0), 15.0, 1.0)
k = 0
t = 14.0
while t < 17.9:
    step = 0.25 if t < 16 else (0.125 if t < 17 else 0.0625)
    tr.add(string_note(D3 + 12 + (k // 6), 0.11, 3800), t, 0.2 + (t - 14) * 0.05, pan=(0.3 if k % 2 else -0.3))
    t += step
    k += 1
for i, t in enumerate([16.0, 16.5, 17.0, 17.25, 17.5, 17.625, 17.75, 17.8125, 17.875]):
    tr.add(taiko(58 + i * 5, 7), t, 0.5 + i * 0.05, pan=(-0.25 if i % 2 else 0.25))
tr.add(riser(3.0), 14.9, 0.8)
tr.add(reverse_swell(2.5), 15.4, 0.7)
tr.silence(17.9, 18.0)

# 18: DROP
tr.add(sub_boom(4.0), 18.0, 1.3)
tr.add(taiko(38, 2.5), 18.0, 1.1)
tr.add(crash(3.5), 18.0, 1.0)
tr.add(braam(DM + [57], 4.0, swell=0.08, peak=3200), 18.0, 1.0)
tr.add(choir([62, 65, 69], 4.0), 18.0, 1.1)
tr.add(taiko(44, 3), 19.0, 0.9)  # RESTART
tr.add(taiko(44, 3), 20.0, 0.9)  # PROTECT YOUR DATA
groove(18.0, 22.0, heavy=True)
ostinato(18.0, 22.0, [62, 65, 69, 65])

# 22-30: four causes
for t, chord, ch in [(22.0, DM, [62, 65, 69]), (24.0, BB, [62, 65, 70]), (26.0, F, [60, 65, 69]), (28.0, C, [60, 64, 67])]:
    slam(t, chord, 0.9, ch)
    ostinato(t, t + 2.0, [chord[2] + 12, chord[3] + 12, chord[4] + 12, chord[3] + 12])
groove(22.0, 30.0, heavy=True)
tr.add(riser(1.0), 29.0, 0.5)

# 30-34: how to check
for t in (30.0, 30.5, 31.0, 31.5):
    tr.add(taiko(52, 5), t, 1.0)
    tr.add(sub_boom(0.6), t, 0.5)
slam(32.0, DM, 0.8)
ostinato(30.0, 34.0, [62, 65, 69, 74], 0.125, 0.3)
groove(32.0, 34.0)

# 34-40: what to do, brighter
for t, chord in [(34.0, F), (36.0, C), (38.0, BB)]:
    tr.add(braam(chord, 2.0, swell=0.15, peak=2600), t, 0.7)
    tr.add(choir([chord[2] + 12, chord[3] + 12, chord[4] + 12], 2.0), t, 0.8)
    ostinato(t, t + 2.0, [chord[2] + 12, chord[3] + 12, chord[4] + 12, chord[3] + 12])
for t in (34.0, 35.0, 36.0, 37.0):
    tr.add(taiko(44, 3), t, 1.0)
    tr.add(sub_boom(1.0), t, 0.6)
groove(34.0, 40.0, heavy=True)
for i, t in enumerate([39.5, 39.625, 39.75, 39.875]):
    tr.add(taiko(66 + i * 5, 7), t, 0.7)

# 40: final
tr.add(sub_boom(4.0), 40.0, 1.3)
tr.add(taiko(38, 2.0), 40.0, 1.1)
tr.add(crash(4.0), 40.0, 0.9)
tr.add(braam([26, 38, 45, 50, 53, 57, 62], 4.0, swell=0.06, peak=3400), 40.0, 1.0)
tr.add(choir([62, 65, 69, 74], 4.0), 40.0, 1.2)

# ---------- extra weight (v2: "more epic") ----------
BIG = [4.0, 18.0, 22.0, 24.0, 26.0, 28.0, 32.0, 40.0]
for t in BIG + [2.0, 15.0]:
    tr.add(clang(2.5, 160 if t in (18.0, 40.0) else 210), t, 0.9)
# octave-down braams under the biggest hits
for t, chord in [(4.0, DM), (18.0, DM), (40.0, DM)]:
    tr.add(braam([n - 12 for n in chord[:3]], 3.5, swell=0.05, peak=1800), t, 0.9)
# war drums: low taiko on every beat through the loud sections
for a, b in [(18.0, 22.0), (22.0, 30.0), (34.0, 40.0)]:
    t = a
    while t < b - 0.01:
        tr.add(taiko(38, 4), t, 0.55)
        t += 0.5
# bigger choir
tr.add(choir([50, 57, 62, 65, 69], 4.0), 18.0, 1.1)
tr.add(choir([50, 57, 62, 65, 69, 74], 4.0), 40.0, 1.3)
for t, ch in [(22.0, [50, 57, 62]), (24.0, [46, 53, 58]), (26.0, [53, 57, 60]), (28.0, [48, 55, 60])]:
    tr.add(choir(ch, 2.0), t, 0.8)
# military snare rolls into the drops
snare_roll(tr, 15.5, 17.9, 0.7)
snare_roll(tr, 38.0, 39.95, 0.7)
snare_roll(tr, 3.0, 3.95, 0.45)
tr.silence(17.9, 18.0)
# longer swells into the drops
tr.add(reverse_swell(4.0), 14.0, 0.6)
tr.add(reverse_swell(3.0), 37.0, 0.7)
# heroic brass theme over the causes and the ending (D minor)
theme = [(62, 1.0), (65, 0.5), (69, 0.5), (67, 1.0), (65, 0.5), (64, 0.5), (62, 1.5), (57, 0.5),
         (58, 1.0), (62, 0.5), (65, 0.5), (64, 1.0), (60, 1.0)]
t = 22.0
for n, d in theme:
    tr.add(brass(n, d * 1.0 + 0.05), t, 0.55, pan=-0.1)
    tr.add(brass(n - 12, d * 1.0 + 0.05), t, 0.4, pan=0.1)
    t += d
for n, d, at in [(65, 1.0, 34.0), (69, 1.0, 35.0), (72, 2.0, 36.0), (70, 1.0, 38.0), (69, 1.0, 39.0), (74, 4.0, 40.0)]:
    tr.add(brass(n, d + 0.05), at, 0.6)
    tr.add(brass(n - 12, d + 0.05), at, 0.45)

tr.write('public/kp/music-epic.wav', reverb=0.45, fade_out=2.0, hall=4.0, decay=1.7, drive=2.4)
print('ok')
