"""Soundtrack for ThermalThrottling (44s): the series theme from make_music_kp_v3.py
with an extra 32-40s section for the iPhone 18 Pro vapor chamber.
The hit times are mirrored in src/ThermalThrottling.tsx.

  0-10s   Apple-like minimal: soft keys and a warm pad, gentle ticks from 5s,
          a soft swell 8-9.7s and silence just before 10s
  10s     KERNEL PANIC: the epic part starts (braam, choir, taikos)
  12/13s  STOP / RESTART, 13.5s "to protect your data"
  14-22s  four causes, one slam every 2s, heroic brass theme
  22-26s  how to spot one: hits at 22, 23, 24, 25
  26-32s  what to do: a hit every second
  32-40s  vapor chamber: hits at 32, 34, 36, 38, snare roll into 40
  40s     final hit, tail to 44s
"""
import os
import sys

sys.path.insert(0, os.path.dirname(__file__))
from synth import (  # noqa: E402
    Track,
    brass,
    braam,
    choir,
    clang,
    crash,
    hat,
    pad,
    pluck,
    reverse_swell,
    riser,
    snare_roll,
    string_note,
    sub_boom,
    taiko,
)

tr = Track(44.0)
DM = [26, 38, 45, 50, 53]
BB = [22, 34, 46, 50, 53]
F = [29, 41, 48, 53, 57]
C = [24, 36, 43, 48, 52]


def groove(t0, t1, gain=1.0):
    t = t0
    while t < t1 - 0.01:
        for off, p, g in [(0, 46, 0.95), (0.5, 62, 0.45), (0.75, 66, 0.4), (1.0, 46, 0.85), (1.5, 70, 0.5), (1.75, 70, 0.45)]:
            if t + off < t1:
                tr.add(taiko(p, 5 if p == 46 else 7), t + off, g * gain, pan=0 if p == 46 else (0.3 if off % 0.5 else -0.3))
        tr.add(taiko(38, 4), t, 0.5 * gain)
        tr.add(taiko(38, 4), t + 1.0, 0.5 * gain)
        t += 2.0


def ostinato(t0, t1, notes, step=0.125, gain=0.24):
    k, t = 0, t0
    while t < t1 - 0.01:
        tr.add(string_note(notes[k % len(notes)], 0.13, 3300), t, gain, pan=(-0.35 if k % 2 else 0.35))
        t += step
        k += 1


def slam(t, chord, gain=0.9, voices=None):
    tr.add(taiko(44, 3.0), t, 1.0)
    tr.add(sub_boom(1.8), t, 0.9)
    tr.add(braam(chord, 1.9, swell=0.06, peak=2800), t, gain)
    tr.add(clang(2.0, 200), t, 0.6)
    tr.add(crash(1.5), t, 0.3)
    if voices:
        tr.add(choir(voices, 2.0), t, 0.9)


# ---------- 0-10s: minimal ----------
keys = [([62, 65, 69, 72], 0.0), ([58, 62, 65, 69], 2.0), ([57, 60, 65, 69], 4.0), ([55, 60, 64, 67], 6.0), ([57, 62, 65, 69], 8.0)]
for notes, t0 in keys:
    tr.add(pad([n - 12 for n in notes[:3]], 2.1, 900, 0.6), t0, 1.1)
    for k, n in enumerate([notes[0], notes[2], notes[1], notes[3]]):
        tr.add(pluck(n, 1.2, 1500), t0 + k * 0.5, 0.75, pan=(-0.25 if k % 2 else 0.25))
for k in range(20):  # gentle ticks from 5s
    tr.add(hat(), 5.0 + k * 0.25, 0.5 + 0.4 * (k % 2 == 0), pan=0.3)
tr.add(reverse_swell(1.7), 8.0, 0.45)
tr.add(riser(1.7), 8.0, 0.4)
snare_roll(tr, 8.6, 9.7, 0.35)
tr.duck(9.55, 9.75)
tr.silence(9.75, 10.0)

# ---------- 10s: KERNEL PANIC ----------
slam(10.0, DM + [57], 1.0, [62, 65, 69])
tr.add(braam([n - 12 for n in DM[:3]], 3.0, swell=0.05, peak=1800), 10.0, 0.8)
tr.add(choir([50, 57, 62, 65], 3.0), 10.0, 1.0)
for t in (12.0, 13.0):
    tr.add(taiko(42, 3), t, 1.0)
    tr.add(sub_boom(1.0), t, 0.8)
    tr.add(clang(1.5, 240), t, 0.5)
tr.add(taiko(50, 4), 13.5, 0.8)
groove(10.0, 14.0)
ostinato(10.0, 14.0, [62, 65, 69, 65])

# ---------- 14-22s: causes ----------
for t, chord, ch in [(14.0, DM, [62, 65, 69]), (16.0, BB, [62, 65, 70]), (18.0, F, [60, 65, 69]), (20.0, C, [60, 64, 67])]:
    slam(t, chord, 0.85, ch)
    ostinato(t, t + 2.0, [chord[2] + 12, chord[3] + 12, chord[4] + 12, chord[3] + 12])
groove(14.0, 22.0)
theme = [(62, 1.0), (65, 0.5), (69, 0.5), (67, 1.0), (65, 0.5), (64, 0.5), (62, 1.5), (57, 0.5), (58, 1.0), (62, 0.5), (65, 0.5), (64, 1.0), (60, 1.0)]
t = 14.0
for n, d in theme:
    tr.add(brass(n, d + 0.05), t, 0.5, pan=-0.1)
    tr.add(brass(n - 12, d + 0.05), t, 0.35, pan=0.1)
    t += d

# ---------- 22-26s: how to spot one ----------
for t in (22.0, 23.0, 24.0, 25.0):
    tr.add(taiko(48, 4), t, 1.0)
    tr.add(sub_boom(0.8), t, 0.6)
tr.add(braam(DM, 2.0, swell=0.2, peak=2200), 22.0, 0.6)
tr.add(braam(BB, 2.0, swell=0.2, peak=2200), 24.0, 0.6)
ostinato(22.0, 26.0, [62, 65, 69, 74], 0.125, 0.26)

# ---------- 26-32s: what to do ----------
for t, chord in [(26.0, F), (28.0, C), (30.0, BB)]:
    tr.add(braam(chord, 2.0, swell=0.15, peak=2600), t, 0.65)
    tr.add(choir([chord[2] + 12, chord[3] + 12, chord[4] + 12], 2.0), t, 0.75)
    ostinato(t, t + 2.0, [chord[2] + 12, chord[3] + 12, chord[4] + 12, chord[3] + 12])
for t in range(26, 32):
    tr.add(taiko(44, 3), float(t), 1.0)
    tr.add(sub_boom(0.9), float(t), 0.6)
groove(26.0, 32.0)
for n, d, at in [(65, 1.0, 26.0), (69, 1.0, 27.0), (72, 2.0, 28.0), (70, 1.0, 30.0), (69, 1.0, 31.0)]:
    tr.add(brass(n, d + 0.05), at, 0.55)
    tr.add(brass(n - 12, d + 0.05), at, 0.4)
snare_roll(tr, 30.5, 31.95, 0.6)

# ---------- 32-40s: iPhone 18 Pro vapor chamber ----------
A = [21, 33, 40, 45, 49]  # A major, leads back to D minor
slam(32.0, F, 0.9, [65, 69, 72])
tr.add(braam(C, 2.0, swell=0.2, peak=2400), 34.0, 0.6)
tr.add(choir([60, 64, 67], 2.0), 34.0, 0.6)
tr.add(taiko(48, 4), 34.0, 0.9)
slam(36.0, BB, 0.9, [62, 65, 70])
slam(38.0, A, 0.9, [61, 64, 69])
groove(32.0, 40.0)
for t0, chord in [(32.0, F), (34.0, C), (36.0, BB), (38.0, A)]:
    ostinato(t0, t0 + 2.0, [chord[2] + 12, chord[3] + 12, chord[4] + 12, chord[3] + 12])
for n, d, at in [(65, 1.0, 32.0), (69, 1.0, 33.0), (72, 2.0, 34.0), (70, 1.0, 36.0), (69, 1.0, 37.0), (73, 2.0, 38.0)]:
    tr.add(brass(n, d + 0.05), at, 0.55)
    tr.add(brass(n - 12, d + 0.05), at, 0.4)
snare_roll(tr, 38.6, 39.95, 0.6)

# ---------- 40s: final ----------
slam(40.0, [26, 38, 45, 50, 53, 57, 62], 1.0, [62, 65, 69, 74])
tr.add(braam([14, 26, 33], 4.0, swell=0.05, peak=1600), 40.0, 0.8)
tr.add(brass(74, 3.5), 40.0, 0.55)
tr.add(brass(62, 3.5), 40.0, 0.45)

tr.write('public/kp/music-thermal.wav', reverb=0.42, fade_out=2.5, hall=3.5, decay=1.8, drive=2.2)
print('ok')
