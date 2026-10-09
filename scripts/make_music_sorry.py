"""Soft 3.5s intro for the "Sorry" re-announcement, played before music-promo.wav.
  0.0s  low pad fades in (E minor)
  0.6s  bell: B
  1.3s  bell: G   ("sor-ry")
  2.2s  bell: E, pad opens up
  2.7s  rising whoosh into the promo's first hit at 3.5s
"""
import wave
import numpy as np

SR = 48000
DUR = 3.5
N = int(SR * DUR)
rng = np.random.default_rng(11)
L = np.zeros(N)
R = np.zeros(N)


def midi(n):
    return 440.0 * 2 ** ((n - 69) / 12)


def tt(length):
    return np.arange(int(length * SR)) / SR


def add(sig, t, gain=1.0, pan=0.0):
    i = int(t * SR)
    sig = sig[: max(0, N - i)]
    L[i : i + len(sig)] += sig * gain * np.sqrt((1 - pan) / 2)
    R[i : i + len(sig)] += sig * gain * np.sqrt((1 + pan) / 2)


def saw(freq, t, cutoff, max_h=16):
    out = np.zeros_like(t)
    for h in range(1, max_h + 1):
        if freq * h > 10000:
            break
        out += (1 / h) * np.exp(-freq * h / cutoff) * np.sin(2 * np.pi * freq * h * t)
    return out


def pad(notes, length, cutoff, attack):
    t = tt(length)
    out = np.zeros_like(t)
    for n in notes:
        for det in (-0.1, 0.0, 0.1):
            out += saw(midi(n) * 2 ** (det / 12), t, cutoff)
    return out * np.minimum(1, t / attack) / (len(notes) * 3)


def bell(note, length=2.2):
    t = tt(length)
    f = midi(note)
    x = np.sin(2 * np.pi * f * t) + 0.35 * np.sin(2 * np.pi * f * 2.76 * t) * np.exp(-t * 3) + 0.2 * np.sin(2 * np.pi * f * 5.4 * t) * np.exp(-t * 6)
    return x * np.minimum(1, t / 0.004) * np.exp(-t * 1.6) * 0.5


def whoosh(length):
    t = tt(length)
    x = rng.uniform(-1, 1, len(t))
    y = np.empty_like(x)
    acc = 0.0
    for i in range(len(x)):  # one-pole high-pass-ish: noise minus its low end
        acc = 0.02 * x[i] + 0.98 * acc
        y[i] = x[i] - acc
    return y * (t / length) ** 3 * 0.5


add(pad([40, 52, 55, 59], 3.5, 900, 1.2), 0.0, 0.8)
add(pad([64, 67, 71], 1.4, 2500, 0.6), 2.1, 0.35)
add(bell(71), 0.6, 0.7, pan=-0.2)
add(bell(67), 1.3, 0.7, pan=0.2)
add(bell(64, 1.6), 2.2, 0.8)
add(whoosh(0.8), 2.7, 0.7)

ir_n = int(2.2 * SR)
ir_t = np.arange(ir_n) / SR
irL = rng.normal(0, 1, ir_n) * np.exp(-ir_t * 2.6)
irR = rng.normal(0, 1, ir_n) * np.exp(-ir_t * 2.6)


def conv(x, ir):
    m = len(x) + len(ir)
    size = 1 << (m - 1).bit_length()
    return np.fft.irfft(np.fft.rfft(x, size) * np.fft.rfft(ir, size), size)[: len(x)]


wetL, wetR = conv(L, irL), conv(R, irR)
wetL *= 0.4 * np.max(np.abs(L)) / np.max(np.abs(wetL))
wetR *= 0.4 * np.max(np.abs(R)) / np.max(np.abs(wetR))
t = np.arange(N) / SR
fade = np.minimum(1, t / 0.3)
mix = np.stack([L + wetL, R + wetR], 1) * fade[:, None]
mix = mix / np.max(np.abs(mix)) * 0.6  # quieter than the promo, so its first hit lands

with wave.open('public/music-sorry.wav', 'wb') as w:
    w.setnchannels(2)
    w.setsampwidth(2)
    w.setframerate(SR)
    w.writeframes((mix * 32767).astype('<i2').tobytes())
print('ok')
