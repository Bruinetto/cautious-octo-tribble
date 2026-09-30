"""Synthesises an epic trailer-style soundtrack (D minor, 120 BPM grid) so it
is royalty-free and locked to the animation:
  0s    old post enters      -> low boom, drone, quiet string ostinato
  4s    candidate enters     -> braam + taiko pattern
  6-8s  colour drop flies    -> tom roll, riser, reverse swell, silence
  8s    colour hits          -> massive impact, choir, full orchestra
  14.7s recap                -> hit
  16s   final                -> last braam and long tail
"""
import wave
import numpy as np

SR = 48000
DUR = 18.0
N = int(SR * DUR)
rng = np.random.default_rng(11)
L = np.zeros(N)
R = np.zeros(N)


def midi(n):
    return 440.0 * 2 ** ((n - 69) / 12)


def add(sig, t, gain=1.0, pan=0.0):
    i = int(t * SR)
    if i >= N or i < 0:
        return
    sig = sig[: N - i]
    L[i : i + len(sig)] += sig * gain * np.sqrt((1 - pan) / 2)
    R[i : i + len(sig)] += sig * gain * np.sqrt((1 + pan) / 2)


def tt(length):
    return np.arange(int(length * SR)) / SR


def onepole_lp(x, cutoff):
    a = np.exp(-2 * np.pi * cutoff / SR)
    y = np.empty_like(x)
    acc = 0.0
    for i in range(len(x)):
        acc = (1 - a) * x[i] + a * acc
        y[i] = acc
    return y


def saw(freq, t, cutoff, max_h=48):
    """Band-limited saw with a (possibly time-varying) spectral cutoff."""
    out = np.zeros_like(t)
    ph = rng.uniform(0, 6.28)
    for h in range(1, max_h + 1):
        fh = freq * h
        if fh > 9000:
            break
        amp = (1 / h) * np.exp(-fh / cutoff)
        out += amp * np.sin(2 * np.pi * fh * t + ph * h)
    return out


# ---------- instruments ----------
def braam(notes, length, swell=0.35, peak=2200):
    t = tt(length)
    cutoff = 150 + peak * np.minimum(1, t / swell) * np.exp(-t * 0.7)
    out = np.zeros_like(t)
    for n in notes:
        for det in (-0.15, 0, 0.15):
            out += saw(midi(n) * 2 ** (det / 12), t, cutoff)
    e = np.minimum(1, t / 0.04) * np.exp(-t * 0.9) * np.clip((length - t) / 0.3, 0, 1)
    return np.tanh(out * e / len(notes) * 1.8)


def string_note(note, length=0.2, bright=2500):
    t = tt(length)
    x = saw(midi(note), t, bright, 30) + saw(midi(note) * 1.003, t, bright, 30)
    return x * np.minimum(1, t / 0.008) * np.exp(-t * 14) * 0.5


def choir(notes, length):
    t = tt(length)
    out = np.zeros_like(t)
    formants = [(700, 130), (1150, 160), (2600, 250)]  # "ah"
    for n in notes:
        for voice in range(3):
            f0 = midi(n) * 2 ** (rng.uniform(-0.1, 0.1) / 12)
            vib = 1 + 0.006 * np.sin(2 * np.pi * (5 + voice * 0.3) * t + voice)
            for h in range(1, 30):
                fh = f0 * h
                if fh > 5000:
                    break
                w = sum(np.exp(-((fh - F) / B) ** 2) for F, B in formants) + 0.15 / h
                out += w * np.sin(2 * np.pi * fh * np.cumsum(vib) / SR + voice)
    e = np.minimum(1, t / 0.7) * np.clip((length - t) / 0.8, 0, 1)
    return out * e / (len(notes) * 12)


def drone(note, length):
    t = tt(length)
    x = saw(midi(note), t, 300 + 150 * np.sin(2 * np.pi * 0.2 * t), 20)
    return x * np.minimum(1, t / 1.5) * np.clip((length - t) / 0.5, 0, 1) * 0.6


def taiko(pitch=55, decay=5.0):
    t = tt(1.2)
    f = pitch + pitch * 0.9 * np.exp(-t * 30)
    body = np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t * decay)
    x = rng.uniform(-1, 1, len(t))
    skin = onepole_lp(x, 1200) * np.exp(-t * 40) * 3
    return np.tanh((body + skin) * 1.5)


def sub_boom(length=3.0):
    t = tt(length)
    f = 30 + 70 * np.exp(-t * 6)
    return np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t * 1.1)


def crash(length=3.0):
    t = tt(length)
    x = rng.uniform(-1, 1, len(t))
    return (x - onepole_lp(x, 4000)) * np.exp(-t * 1.3) * 0.5


def riser(length):
    t = tt(length)
    x = rng.uniform(-1, 1, len(t))
    x = x - onepole_lp(x, 600)
    sweep = saw(1, t, 1, 1) * 0
    f = 80 * 2 ** (4.5 * t / length)
    tone = np.sin(2 * np.pi * np.cumsum(f) / SR) + 0.5 * np.sin(2 * np.pi * np.cumsum(f * 1.5) / SR)
    return (x * 0.6 + tone * 0.25 + sweep) * (t / length) ** 2.5


def reverse_swell(length):
    c = crash(length)[::-1]
    return c * 1.2


# ---------- arrangement ----------
D2, D3 = 38, 50
prog = {  # bars of 2s after the drop: Dm - Bb - F - C
    8: [38, 50, 53, 57, 62],
    10: [34, 46, 50, 53, 58],
    12: [41, 48, 53, 57, 60],
    14: [36, 48, 52, 55, 60],
}

# intro 0-4: boom, drone, quiet ostinato
add(sub_boom(4.0), 0.3, 0.9)
add(taiko(45, 3.0), 0.3, 0.8)
add(drone(D2, 8.0), 0.0, 0.5)
for k in range(16):  # 8ths on D, 0-4s
    t = k * 0.25
    add(string_note(D3 + (12 if k % 4 == 2 else 0), 0.22, 1200 + k * 60), t, 0.18 + k * 0.012, pan=-0.3)

# 4s: candidate enters -> braam + taiko groove
add(braam([26, 38, 45, 50, 53], 2.2), 4.0, 0.9)
add(sub_boom(2.0), 4.0, 0.7)
for k in range(8):  # 16ths ostinato 4-6s
    for s in range(2):
        t = 4.0 + k * 0.25 + s * 0.125
        add(string_note(D3 + [0, 0, 3, 0, 7, 0, 3, 5][k], 0.14, 2500), t, 0.3, pan=-0.3)
for t, p in [(4.0, 50), (4.75, 60), (5.0, 50), (5.5, 70), (5.75, 70)]:
    add(taiko(p), t, 0.8 if p == 50 else 0.5, pan=0.0 if p == 50 else 0.3)

# 6-8s: build while the colour drop flies
hits = [6.0, 6.5, 7.0, 7.25, 7.5, 7.625, 7.75, 7.8125, 7.875]
for i, t in enumerate(hits):
    add(taiko(60 + i * 6, 7), t, 0.45 + i * 0.05, pan=(-0.25 if i % 2 else 0.25))
for k in range(16):
    t = 6.0 + k * 0.1125
    add(string_note(D3 + 12 + (k // 4), 0.12, 3500), t, 0.22 + k * 0.015, pan=0.3)
add(riser(1.9), 6.0, 0.7)
add(reverse_swell(1.9), 6.0, 0.6)
# (silence gap 7.9 - 8.0 comes naturally: nothing starts there)

# 8s: THE DROP
add(sub_boom(3.5), 8.0, 1.2)
add(taiko(42, 2.5), 8.0, 1.0)
add(crash(3.5), 8.0, 0.9)
for bar_t, chord in prog.items():
    last = bar_t == 14
    add(braam(chord, 2.0, swell=0.2 if bar_t == 8 else 0.5, peak=2600), bar_t, 0.8 if bar_t == 8 else 0.55)
    add(choir([n + 12 for n in chord[2:]], 2.1), bar_t, 0.9)
    # 16th ostinato on chord tones
    tones = [chord[1] + 12, chord[2] + 12, chord[3] + 12, chord[2] + 12]
    for k in range(16):
        add(string_note(tones[k % 4], 0.13, 3200), bar_t + k * 0.125, 0.3, pan=(-0.35 if k % 2 else 0.35))
    # taiko groove
    for t, p, g in [(0, 48, 1.0), (0.5, 62, 0.5), (0.75, 62, 0.4), (1.0, 48, 0.9), (1.5, 70, 0.5), (1.625, 70, 0.4), (1.75, 70, 0.5)]:
        if last and t > 1.0:
            continue
        add(taiko(p), bar_t + t, g, pan=0.0 if p == 48 else (0.3 if t % 0.5 else -0.3))
    if bar_t != 8:
        add(crash(1.5), bar_t, 0.25)

# recap accent (~14.7s) and lead-in to final hit
add(taiko(44, 3), 14.67, 0.9)
add(sub_boom(1.2), 14.67, 0.6)
add(riser(1.2), 14.8, 0.5)
for i, t in enumerate([15.5, 15.625, 15.75, 15.875]):
    add(taiko(66 + i * 5, 7), t, 0.6, pan=(-0.25 if i % 2 else 0.25))

# 16s: final hit, long tail
add(braam([26, 38, 45, 50, 53, 57], 2.0, swell=0.1, peak=3000), 16.0, 1.0)
add(choir([62, 65, 69, 74], 2.0), 16.0, 1.1)
add(sub_boom(2.0), 16.0, 1.2)
add(taiko(40, 2), 16.0, 1.0)
add(crash(2.0), 16.0, 0.8)

# ---------- hall reverb ----------
ir_n = int(3.5 * SR)
ir_t = np.arange(ir_n) / SR
irL = rng.normal(0, 1, ir_n) * np.exp(-ir_t * 1.9)
irR = rng.normal(0, 1, ir_n) * np.exp(-ir_t * 1.9)
irL[: int(0.02 * SR)] = 0  # predelay
irR[: int(0.027 * SR)] = 0


def conv(x, ir):
    m = len(x) + len(ir)
    size = 1 << (m - 1).bit_length()
    return np.fft.irfft(np.fft.rfft(x, size) * np.fft.rfft(ir, size), size)[: len(x)]


wetL, wetR = conv(L, irL), conv(R, irR)
wetL *= 0.4 * np.max(np.abs(L)) / np.max(np.abs(wetL))
wetR *= 0.4 * np.max(np.abs(R)) / np.max(np.abs(wetR))
L2, R2 = L + wetL, R + wetR

# master: fade, glue, normalise
t = np.arange(N) / SR
fade = np.minimum(1, t / 0.05) * np.clip((DUR - t) / 1.5, 0, 1)
mix = np.stack([L2, R2], 1) * fade[:, None]
mix = np.tanh(mix / np.max(np.abs(mix)) * 2.0)
mix = mix / np.max(np.abs(mix)) * 0.89

with wave.open('public/music.wav', 'wb') as w:
    w.setnchannels(2)
    w.setsampwidth(2)
    w.setframerate(SR)
    w.writeframes((mix * 32767).astype('<i2').tobytes())
print('ok')
