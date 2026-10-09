"""Epic soundtrack for the whole PromoSorry video (20s, 120 BPM), one track from start to end.
  0.0-3.5s   "Sorry."           dark drone, bells, taiko build, riser
  3.5s       barcly 2.0         huge hit, full drums, supersaw Em -> C
  7.5s       minitravels 2.0    hit, more energy, G -> D, snare build
  11.0-11.5s                    silence (dramatic pause)
  11.5s      One more thing     biggest hit, wide C chord, drums back, roll + riser at the end
  16.5s      GET READY.         braam + choir + taiko, rings out to 20s
"""
import wave
import numpy as np

SR = 48000
DUR = 20.0
N = int(SR * DUR)
rng = np.random.default_rng(7)
L = np.zeros(N)
R = np.zeros(N)


def midi(n):
    return 440.0 * 2 ** ((n - 69) / 12)


def tt(length):
    return np.arange(int(length * SR)) / SR


def add(sig, t, gain=1.0, pan=0.0):
    i = int(t * SR)
    if i >= N or i < 0:
        return
    sig = sig[: N - i]
    L[i : i + len(sig)] += sig * gain * np.sqrt((1 - pan) / 2)
    R[i : i + len(sig)] += sig * gain * np.sqrt((1 + pan) / 2)


def lp(x, cutoff):
    """one-pole low-pass via FFT-free recursion on short signals only"""
    a = np.exp(-2 * np.pi * cutoff / SR)
    y = np.empty_like(x)
    acc = 0.0
    for i in range(len(x)):
        acc = (1 - a) * x[i] + a * acc
        y[i] = acc
    return y


def saw(freq, t, cutoff, max_h=30):
    out = np.zeros_like(t)
    for h in range(1, max_h + 1):
        fh = freq * h
        if fh > 12000:
            break
        out += (1 / h) * np.exp(-fh / cutoff) * np.sin(2 * np.pi * fh * t + h)
    return out


def supersaw(notes, length, cutoff=3000, attack=0.02, release=0.4, voices=(-0.18, -0.07, 0.0, 0.07, 0.18)):
    t = tt(length)
    out = np.zeros_like(t)
    for n in notes:
        for det in voices:
            out += saw(midi(n) * 2 ** (det / 12), t, cutoff, 18)
    e = np.minimum(1, t / attack) * np.clip((length - t) / release, 0, 1)
    return out * e / (len(notes) * len(voices))


def choir(notes, length, attack=0.6):
    """breathy 'aah': detuned sines with vibrato + a little noise"""
    t = tt(length)
    out = np.zeros_like(t)
    for n in notes:
        for k, det in enumerate((-0.09, 0.0, 0.09)):
            f = midi(n) * 2 ** (det / 12) * (1 + 0.004 * np.sin(2 * np.pi * (5 + k * 0.4) * t))
            ph = 2 * np.pi * np.cumsum(f) / SR
            out += np.sin(ph) + 0.35 * np.sin(2 * ph) + 0.18 * np.sin(3 * ph)
    e = np.minimum(1, t / attack) * np.clip((length - t) / 1.2, 0, 1)
    return out * e / (len(notes) * 3)


def braam(root, length=3.5):
    """cinematic low brass blast"""
    t = tt(length)
    cut = 250 + 2600 * np.minimum(1, t / 0.25) * np.exp(-t * 0.9)
    out = np.zeros_like(t)
    for n, g in ((root, 1.0), (root + 12, 0.8), (root + 19, 0.5), (root + 24, 0.35)):
        for det in (-0.1, 0.0, 0.1):
            f = midi(n) * 2 ** (det / 12)
            for h in range(1, 22):
                if f * h > 8000:
                    break
                out += g / h * np.exp(-f * h / cut) * np.sin(2 * np.pi * f * h * t + h * 0.7)
    out = np.tanh(out * 1.6)
    return out * np.minimum(1, t / 0.03) * np.exp(-t * 0.7) * 0.5


def bell(note, length=2.4):
    t = tt(length)
    f = midi(note)
    x = np.sin(2 * np.pi * f * t) + 0.35 * np.sin(2 * np.pi * f * 2.76 * t) * np.exp(-t * 3) + 0.2 * np.sin(2 * np.pi * f * 5.4 * t) * np.exp(-t * 6)
    return x * np.minimum(1, t / 0.004) * np.exp(-t * 1.4) * 0.5


def pluck(note, length=0.3, bright=5000):
    t = tt(length)
    return saw(midi(note), t, bright, 24) * np.minimum(1, t / 0.003) * np.exp(-t * 10) * 0.6


def bass(note, length):
    t = tt(length)
    x = saw(midi(note), t, 350 + 1400 * np.exp(-t * 18), 14)
    return np.tanh(x * 3.0) * np.minimum(1, t / 0.004) * np.exp(-t * 3.5) * 0.55


def sub(note, length):
    t = tt(length)
    return np.sin(2 * np.pi * midi(note) * t) * np.minimum(1, t / 0.01) * np.exp(-t * 2.5) * 0.6


def kick(power=1.0):
    t = tt(0.5)
    f = 44 + 150 * np.exp(-t * 30)
    x = np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t * 6.5)
    return np.tanh(x * 1.8 * power) * 0.9


def taiko(pitch=1.0, length=0.9):
    t = tt(length)
    f = (70 + 60 * np.exp(-t * 25)) * pitch
    body = np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t * 4.5)
    slap = rng.uniform(-1, 1, len(t)) * np.exp(-t * 60) * 0.5
    return np.tanh((body + slap) * 1.5) * 0.8


def snare():
    t = tt(0.35)
    x = rng.uniform(-1, 1, len(t))
    x = x - lp(x, 900)
    tone = np.sin(2 * np.pi * 190 * t) * np.exp(-t * 30) * 0.5
    return (x * np.exp(-t / 0.09) * 0.55 + tone) * 0.8


def hat(open_=False):
    n = int((0.22 if open_ else 0.05) * SR)
    x = np.diff(rng.uniform(-1, 1, n), prepend=0)
    t = np.arange(n) / SR
    return x * np.exp(-t / (0.07 if open_ else 0.012)) * 0.2


def riser(length, top=1.0):
    t = tt(length)
    x = rng.uniform(-1, 1, len(t))
    x = x - lp(x, 300)
    sweep = np.sin(2 * np.pi * np.cumsum(200 + 1800 * (t / length) ** 2) / SR) * 0.25
    return (x * 0.6 + sweep) * (t / length) ** 2.5 * top


def impact(length=3.0, power=1.0):
    t = tt(length)
    boom = np.sin(2 * np.pi * np.cumsum(32 + 110 * np.exp(-t * 10)) / SR) * np.exp(-t * 1.6)
    x = rng.uniform(-1, 1, int(0.6 * SR))
    crash_s = (x - lp(x, 3000)) * np.exp(-np.arange(len(x)) / SR * 4.5)
    crash = np.zeros_like(t)
    crash[: len(crash_s)] = crash_s * 0.5
    return np.tanh((boom * 1.1 + crash) * 1.3) * power


def snare_roll(t0, length, gain=0.6):
    k, t = 0, 0.0
    while t < length:
        p = t / length
        add(snare(), t0 + t, gain * (0.35 + 0.65 * p), pan=(0.15 if k % 2 else -0.15))
        t += 0.25 * (1 - p) + 0.04 * p
        k += 1


def drums(t0, bars, intensity=1.0, toms=True):
    for bar in range(bars):
        for b in range(4):
            tb = t0 + bar * 2 + b * 0.5
            add(kick(), tb, 1.0)
            add(hat(), tb + 0.25, 0.8 * intensity, pan=0.3)
            add(hat(), tb + 0.125, 0.3 * intensity, pan=-0.3)
            add(hat(), tb + 0.375, 0.3 * intensity, pan=-0.3)
            if b in (1, 3):
                add(snare(), tb, 0.85)
            if toms and b in (0, 2):
                add(taiko(1.25), tb + 0.25, 0.45 * intensity, pan=-0.4)
                add(taiko(1.0), tb + 0.375, 0.35 * intensity, pan=0.4)


def section(t0, bars_chords, root_notes, arp_notes, intensity=1.0):
    for j, (ch, rt, ar) in enumerate(zip(bars_chords, root_notes, arp_notes)):
        tb = t0 + j * 2
        add(supersaw(ch, 2.0, 3200 * intensity, 0.01, 0.2), tb, 0.55, pan=-0.1)
        add(supersaw([n + 12 for n in ch], 2.0, 4500, 0.01, 0.2), tb, 0.25, pan=0.1)
        for b in range(8):
            add(bass(rt, 0.22), tb + b * 0.25, 0.75)
        add(sub(rt, 2.0), tb, 0.6)
        for k in range(16):
            add(pluck(ar[[0, 1, 2, 1][k % 4]] + 12), tb + k * 0.125, 0.28, pan=(0.4 if k % 2 else -0.4))


# ---- 0 - 3.5s: "Sorry." ----
drone = tt(3.5)
add(np.sin(2 * np.pi * midi(28) * drone) * np.minimum(1, drone / 1.5) * 0.5, 0.0)
add(choir([52, 55, 59], 3.5, 1.5), 0.0, 0.5)
add(bell(71), 0.5, 0.6, pan=-0.2)
add(bell(67), 1.2, 0.6, pan=0.2)
add(bell(64, 2.2), 2.0, 0.7)
for tk, g in ((1.5, 0.35), (2.0, 0.45), (2.5, 0.55), (2.75, 0.6), (3.0, 0.7), (3.125, 0.75), (3.25, 0.8), (3.375, 0.9)):
    add(taiko(1.0), tk, g)
add(riser(2.0, 0.9), 1.5)

# ---- 3.5s: barcly 2.0 (cyan), E minor -> C ----
add(impact(3.0, 1.0), 3.5)
add(braam(28, 2.0), 3.5, 0.6)
drums(3.5, 2)
section(3.5, [[52, 55, 59, 64], [48, 52, 55, 60]], [40, 36], [[64, 67, 71], [60, 64, 67]])
add(riser(0.9, 0.6), 6.6)

# ---- 7.5s: minitravels 2.0 (red), G -> D, more energy ----
add(impact(2.5, 0.9), 7.5)
drums(7.5, 2, 1.25)
section(7.5, [[55, 59, 62, 67], [50, 54, 57, 62]], [43, 38], [[67, 71, 74], [62, 66, 69]], 1.2)
snare_roll(9.5, 1.5, 0.55)
add(riser(1.5, 1.0), 9.5)
# the pause: everything stops at 11.0
for ch in (L, R):
    a, b = int(10.95 * SR), int(11.0 * SR)
    ch[a:b] *= np.linspace(1, 0, b - a)
    ch[b : int(11.5 * SR)] = 0

# ---- 11.5s: One more thing (blue), biggest hit ----
add(impact(3.5, 1.3), 11.5)
add(braam(24, 3.0), 11.5, 0.75)
add(choir([48, 55, 60, 64, 67], 5.0, 0.3), 11.5, 0.55)
add(supersaw([48, 52, 55, 59, 62], 5.0, 3800, 0.05, 0.6), 11.5, 0.6)
add(pluck(76, 1.2), 11.5, 0.6)
add(pluck(79, 1.2), 12.0, 0.45)
drums(12.5, 2, 1.3)
for b in range(16):
    add(bass(36 if b < 8 else 41, 0.22), 12.5 + b * 0.25, 0.7)
snare_roll(15.0, 1.5, 0.7)
add(riser(1.5, 1.1), 15.0)
for tk in (15.5, 15.75, 16.0, 16.125, 16.25, 16.375):
    add(taiko(0.9), tk, 0.75)

# ---- 16.5s: GET READY. ----
add(impact(3.5, 1.5), 16.5)
add(braam(28, 3.5), 16.5, 0.9)
add(choir([40, 52, 59, 64, 67, 71], 3.5, 0.15), 16.5, 0.7)
add(supersaw([52, 59, 64, 67, 71], 3.5, 3000, 0.02, 1.2), 16.5, 0.45)
for tk, g in ((17.25, 0.8), (18.0, 0.9)):
    add(taiko(0.8, 1.4), tk, g)
    add(sub(28, 1.4), tk, 0.6)

# ---- reverb + master ----
ir_n = int(2.6 * SR)
ir_t = np.arange(ir_n) / SR
irL = rng.normal(0, 1, ir_n) * np.exp(-ir_t * 2.4)
irR = rng.normal(0, 1, ir_n) * np.exp(-ir_t * 2.4)


def conv(x, ir):
    m = len(x) + len(ir)
    size = 1 << (m - 1).bit_length()
    return np.fft.irfft(np.fft.rfft(x, size) * np.fft.rfft(ir, size), size)[: len(x)]


wetL, wetR = conv(L, irL), conv(R, irR)
wetL *= 0.32 * np.max(np.abs(L)) / np.max(np.abs(wetL))
wetR *= 0.32 * np.max(np.abs(R)) / np.max(np.abs(wetR))
t = np.arange(N) / SR
fade = np.minimum(1, t / 0.3) * np.clip((DUR - t) / 1.4, 0, 1)
mix = np.stack([L + wetL, R + wetR], 1) * fade[:, None]
mix = np.tanh(mix / np.max(np.abs(mix)) * 2.2)
mix = mix / np.max(np.abs(mix)) * 0.9

with wave.open('public/music-sorry-epic.wav', 'wb') as w:
    w.setnchannels(2)
    w.setsampwidth(2)
    w.setframerate(SR)
    w.writeframes((mix * 32767).astype('<i2').tobytes())
print('ok')
