"""Soundtrack for the barcly / minitravels / One more thing promo (13s, 120 BPM).
  0s     barcly 2.0        hit, beat starts
  4s     minitravels      hit, beat continues with a new chord
  7.5-8s                   silence (dramatic pause)
  8s     One more thing    big hit, wide pad, beat back in
  12-13s                   fade out
"""
import wave
import numpy as np

SR = 48000
DUR = 13.0
N = int(SR * DUR)
rng = np.random.default_rng(5)
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


def saw(freq, t, cutoff, max_h=40):
    out = np.zeros_like(t)
    for h in range(1, max_h + 1):
        fh = freq * h
        if fh > 10000:
            break
        out += (1 / h) * np.exp(-fh / cutoff) * np.sin(2 * np.pi * fh * t)
    return out


def pad(notes, length, cutoff=2000, attack=0.2):
    t = tt(length)
    out = np.zeros_like(t)
    for n in notes:
        for det in (-0.12, 0.0, 0.12):
            out += saw(midi(n) * 2 ** (det / 12), t, cutoff, 16)
    e = np.minimum(1, t / attack) * np.clip((length - t) / 0.3, 0, 1)
    return out * e / (len(notes) * 3)


def pluck(note, length=0.3, bright=4500):
    t = tt(length)
    return saw(midi(note), t, bright, 24) * np.minimum(1, t / 0.003) * np.exp(-t * 10) * 0.6


def bass(note, length):
    t = tt(length)
    x = saw(midi(note), t, 400 + 1200 * np.exp(-t * 20), 12)
    return np.tanh(x * 2.5) * np.minimum(1, t / 0.004) * np.exp(-t * 4) * 0.5


def kick():
    t = tt(0.4)
    f = 46 + 130 * np.exp(-t * 34)
    return np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t * 8)


def hat(open_=False):
    n = int((0.2 if open_ else 0.05) * SR)
    x = np.diff(rng.uniform(-1, 1, n), prepend=0)
    t = np.arange(n) / SR
    return x * np.exp(-t / (0.06 if open_ else 0.012)) * 0.22


def clap():
    t = tt(0.3)
    x = rng.uniform(-1, 1, len(t))
    x = x - onepole_lp(x, 1000)
    e = np.exp(-t / 0.08)
    for d in (0.0, 0.011, 0.022):
        e = e + np.roll(np.exp(-t / 0.006), int(d * SR)) * 0.6
    return x * e * 0.3


def whoosh(length):
    t = tt(length)
    x = rng.uniform(-1, 1, len(t))
    x = x - onepole_lp(x, 500)
    return x * (t / length) ** 3 * 0.6


def hit(length=2.0, power=1.0):
    t = tt(length)
    boom = np.sin(2 * np.pi * np.cumsum(38 + 90 * np.exp(-t * 12)) / SR) * np.exp(-t * 2.5)
    x = rng.uniform(-1, 1, len(t))
    crash = (x - onepole_lp(x, 3500)) * np.exp(-t * 2.0) * 0.35
    return (boom * 0.9 + crash) * power


def groove(t0, bars, root, notes, intensity=1.0):
    for bar in range(bars):
        for b in range(4):
            tb = t0 + bar * 2 + b * 0.5
            add(kick(), tb, 0.95)
            add(hat(), tb + 0.25, 0.8 * intensity, pan=0.3)
            add(hat(), tb + 0.125, 0.35 * intensity, pan=-0.3)
            add(hat(), tb + 0.375, 0.35 * intensity, pan=-0.3)
            if b in (1, 3):
                add(clap(), tb, 0.9)
            add(bass(root, 0.22), tb, 0.8)
            add(bass(root + 12, 0.18), tb + 0.25, 0.5)
        for k in range(16):
            add(pluck(notes[[0, 1, 2, 1][k % 4]] + 12), t0 + bar * 2 + k * 0.125, 0.3, pan=(0.35 if k % 2 else -0.35))


# barcly 2.0 (cyan): E minor -> C
add(hit(1.8, 0.8), 0.0)
add(pad([52, 55, 59], 2.0), 0.0, 0.7)
add(pad([48, 52, 55], 2.0), 2.0, 0.7)
groove(0.0, 1, 40, [52, 55, 59])
groove(2.0, 1, 36, [48, 52, 55])
add(whoosh(0.8), 3.2, 0.6)

# minitravels (red): G -> D, a bit more energy
add(hit(1.8, 0.8), 4.0)
add(pad([55, 59, 62], 2.0), 4.0, 0.7)
add(pad([50, 54, 57], 1.5), 6.0, 0.7)
groove(4.0, 1, 43, [55, 59, 62], 1.2)
groove(6.0, 1, 38, [50, 54, 57], 1.2)
# cut everything for the pause: build only until 7.5s
L[int(7.5 * SR) : int(8.0 * SR)] *= np.linspace(1, 0, int(0.5 * SR)) ** 4
R[int(7.5 * SR) : int(8.0 * SR)] *= np.linspace(1, 0, int(0.5 * SR)) ** 4

# One more thing (blue): big hit, wide Cmaj9 pad, beat back in at 9s
add(hit(3.0, 1.2), 8.0)
add(pad([48, 52, 55, 59, 62], 5.0, 2600, 0.05), 8.0, 1.0)
add(bass(36, 2.0), 8.0, 0.9)
add(pluck(76, 1.2), 8.0, 0.6)
add(pluck(79, 1.2), 8.5, 0.45)
groove(9.0, 2, 36, [60, 64, 67], 1.0)
add(hit(2.0, 0.6), 12.0)

# reverb + master
ir_n = int(1.8 * SR)
ir_t = np.arange(ir_n) / SR
irL = rng.normal(0, 1, ir_n) * np.exp(-ir_t * 3.3)
irR = rng.normal(0, 1, ir_n) * np.exp(-ir_t * 3.3)


def conv(x, ir):
    m = len(x) + len(ir)
    size = 1 << (m - 1).bit_length()
    return np.fft.irfft(np.fft.rfft(x, size) * np.fft.rfft(ir, size), size)[: len(x)]


wetL, wetR = conv(L, irL), conv(R, irR)
wetL *= 0.25 * np.max(np.abs(L)) / np.max(np.abs(wetL))
wetR *= 0.25 * np.max(np.abs(R)) / np.max(np.abs(wetR))
t = np.arange(N) / SR
fade = np.minimum(1, t / 0.02) * np.clip((DUR - t) / 1.2, 0, 1)
mix = np.stack([L + wetL, R + wetR], 1) * fade[:, None]
mix = np.tanh(mix / np.max(np.abs(mix)) * 1.8)
mix = mix / np.max(np.abs(mix)) * 0.89

with wave.open('public/music-promo.wav', 'wb') as w:
    w.setnchannels(2)
    w.setsampwidth(2)
    w.setframerate(SR)
    w.writeframes((mix * 32767).astype('<i2').tobytes())
print('ok')
