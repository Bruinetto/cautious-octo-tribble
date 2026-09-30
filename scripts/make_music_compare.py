"""Soundtrack for the OLD vs NEW video (29s, 120 BPM, A minor pop/electronic).
Every 4s a new section starts (titles swap), so each section boundary gets a
whoosh + hit. Grid: bar = 2s = 60 frames @30fps.
  0-4s    intro title           pad + pluck, riser into 4s
  4-8s    side by side          drums in
  8-24s   4 difference cards    full groove, hit every 4s
  24s     final NEW             big hit, then outro to 29s
"""
import wave
import numpy as np

SR = 48000
DUR = 29.0
N = int(SR * DUR)
rng = np.random.default_rng(3)
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


def pad(notes, length, cutoff=1800):
    t = tt(length)
    out = np.zeros_like(t)
    for n in notes:
        for det in (-0.1, 0.1):
            out += saw(midi(n) * 2 ** (det / 12), t, cutoff, 16)
    e = np.minimum(1, t / 0.25) * np.clip((length - t) / 0.3, 0, 1)
    return out * e / (len(notes) * 2) * 0.8


def pluck(note, length=0.35, bright=4000):
    t = tt(length)
    x = saw(midi(note), t, bright, 24)
    return x * np.minimum(1, t / 0.003) * np.exp(-t * 9) * 0.6


def bass(note, length):
    t = tt(length)
    x = saw(midi(note), t, 500 + 900 * np.exp(-t * 18), 12)
    return np.tanh(x * 2.2) * np.minimum(1, t / 0.004) * np.exp(-t * 4) * 0.55


def kick():
    t = tt(0.4)
    f = 48 + 120 * np.exp(-t * 32)
    return np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t * 8)


def hat(open_=False):
    n = int((0.22 if open_ else 0.05) * SR)
    x = np.diff(rng.uniform(-1, 1, n), prepend=0)
    t = np.arange(n) / SR
    return x * np.exp(-t / (0.07 if open_ else 0.012)) * 0.22


def clap():
    t = tt(0.3)
    x = rng.uniform(-1, 1, len(t))
    x = x - onepole_lp(x, 1000)
    e = np.exp(-t / 0.08)
    for d in (0.0, 0.011, 0.022):
        e = e + np.roll(np.exp(-t / 0.006), int(d * SR)) * 0.6
    return x * e * 0.3


def whoosh(length=1.0):
    t = tt(length)
    x = rng.uniform(-1, 1, len(t))
    x = x - onepole_lp(x, 500)
    return x * (t / length) ** 3 * 0.6


def hit(length=2.0, power=1.0):
    t = tt(length)
    boom = np.sin(2 * np.pi * np.cumsum(40 + 80 * np.exp(-t * 12)) / SR) * np.exp(-t * 3)
    x = rng.uniform(-1, 1, len(t))
    crash = (x - onepole_lp(x, 3500)) * np.exp(-t * 2.2) * 0.35
    return (boom * 0.9 + crash) * power


# A minor: Am - F - C - G, one chord per 2s bar
chords = [([57, 60, 64], 45), ([53, 57, 60], 41), ([55, 60, 64], 48), ([55, 59, 62], 43)]
arp = [0, 1, 2, 1, 2, 0, 2, 1]

for bar in range(15):  # 0..30s
    t0 = bar * 2.0
    notes, root = chords[bar % 4]
    if t0 >= 28:
        break
    final = bar >= 12
    add(pad(notes, 2.0, 1200 if bar < 2 else 2200), t0, 0.7)
    # arp in 8ths (16ths during the difference cards)
    step = 0.125 if 4 <= bar < 12 else 0.25
    for k in range(int(2.0 / step)):
        n = notes[arp[k % 8]] + 12
        add(pluck(n), t0 + k * step, 0.35 if bar < 2 else 0.4, pan=(0.35 if k % 2 else -0.35))
    if bar < 2 or bar >= 13:
        continue
    # drums + bass from 4s
    for b in range(4):
        tb = t0 + b * 0.5
        add(kick(), tb, 0.95)
        add(hat(), tb + 0.25, 0.9, pan=0.3)
        add(hat(), tb + 0.125, 0.4, pan=-0.3)
        add(hat(), tb + 0.375, 0.4, pan=-0.3)
        if b in (1, 3):
            add(clap(), tb, 1.0)
        add(bass(root, 0.24), tb, 0.8)
        add(bass(root + (12 if b % 2 else 0), 0.2), tb + 0.25, 0.6)

# section boundaries: whoosh into each, hit on each
for s in (4, 8, 12, 16, 20):
    add(whoosh(0.9), s - 0.9, 0.7)
    add(hit(1.5, 0.55), s, 1.0)
# into the final
add(whoosh(1.8), 22.2, 0.9)
for i, t in enumerate([23.5, 23.625, 23.75, 23.875]):
    add(clap(), t, 0.4 + i * 0.15)
add(hit(3.0, 1.1), 24.0, 1.0)
add(pad([57, 60, 64, 69], 4.8, 2600), 24.0, 0.9)
add(bass(33, 2.0), 24.0, 0.9)
add(pluck(76, 1.5), 24.0, 0.6)
add(pluck(81, 1.5), 24.5, 0.4)

# reverb
ir_n = int(2.0 * SR)
ir_t = np.arange(ir_n) / SR
irL = rng.normal(0, 1, ir_n) * np.exp(-ir_t * 3.2)
irR = rng.normal(0, 1, ir_n) * np.exp(-ir_t * 3.2)


def conv(x, ir):
    m = len(x) + len(ir)
    size = 1 << (m - 1).bit_length()
    return np.fft.irfft(np.fft.rfft(x, size) * np.fft.rfft(ir, size), size)[: len(x)]


wetL, wetR = conv(L, irL), conv(R, irR)
wetL *= 0.25 * np.max(np.abs(L)) / np.max(np.abs(wetL))
wetR *= 0.25 * np.max(np.abs(R)) / np.max(np.abs(wetR))
t = np.arange(N) / SR
fade = np.minimum(1, t / 0.05) * np.clip((DUR - t) / 2.5, 0, 1)
mix = np.stack([L + wetL, R + wetR], 1) * fade[:, None]
mix = np.tanh(mix / np.max(np.abs(mix)) * 1.8)
mix = mix / np.max(np.abs(mix)) * 0.89

with wave.open('public/music-compare.wav', 'wb') as w:
    w.setnchannels(2)
    w.setsampwidth(2)
    w.setframerate(SR)
    w.writeframes((mix * 32767).astype('<i2').tobytes())
print('ok')
