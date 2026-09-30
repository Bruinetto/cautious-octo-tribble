"""Synthesises the soundtrack (120 BPM, F major) so it is royalty-free and
locked to the animation: candidate enters at 4s, colour drop hits at 8s,
recap at ~14.7s, outro to 18s."""
import wave
import numpy as np

SR = 48000
DUR = 18.0
N = int(SR * DUR)
BEAT = 0.5
rng = np.random.default_rng(7)
L = np.zeros(N)
R = np.zeros(N)


def midi(n):
    return 440.0 * 2 ** ((n - 69) / 12)


def add(sig, t, gain=1.0, pan=0.0):
    i = int(t * SR)
    if i >= N:
        return
    sig = sig[: N - i]
    L[i : i + len(sig)] += sig * gain * np.sqrt((1 - pan) / 2)
    R[i : i + len(sig)] += sig * gain * np.sqrt((1 + pan) / 2)


def env(n, a, r):
    t = np.arange(n) / SR
    e = np.minimum(1, t / max(a, 1e-4)) * np.exp(-t / r)
    return e


def onepole_lp(x, cutoff):
    a = np.exp(-2 * np.pi * cutoff / SR)
    y = np.empty_like(x)
    acc = 0.0
    for i in range(len(x)):
        acc = (1 - a) * x[i] + a * acc
        y[i] = acc
    return y


# ---------- instruments ----------
def pad(notes, length, bright=1.0):
    n = int(length * SR)
    t = np.arange(n) / SR
    out = np.zeros(n)
    for note in notes:
        f = midi(note)
        for det in (-0.12, 0.0, 0.12):
            ff = f * 2 ** (det / 12)
            for h, amp in ((1, 1.0), (2, 0.35 * bright), (3, 0.15 * bright), (4, 0.06 * bright)):
                out += amp * np.sin(2 * np.pi * ff * h * t + rng.uniform(0, 6.28))
    a = np.minimum(1, t / 0.6) * np.minimum(1, (length - t) / 0.5)
    return out * np.clip(a, 0, 1) / (len(notes) * 6)


def pluck(note, length=0.6):
    f = midi(note)
    n = int(length * SR)
    p = int(SR / f)
    buf = rng.uniform(-1, 1, p)
    out = np.zeros(n)
    for i in range(n):
        out[i] = buf[i % p]
        buf[i % p] = 0.5 * (buf[i % p] + buf[(i + 1) % p]) * 0.996
    return out * 0.5


def kick():
    n = int(0.45 * SR)
    t = np.arange(n) / SR
    f = 45 + 110 * np.exp(-t * 28)
    ph = 2 * np.pi * np.cumsum(f) / SR
    return np.sin(ph) * np.exp(-t * 7) * 1.0


def hat(open_=False):
    n = int((0.25 if open_ else 0.06) * SR)
    x = rng.uniform(-1, 1, n)
    x = np.diff(x, prepend=0)
    return x * env(n, 0.001, 0.08 if open_ else 0.015) * 0.25


def clap():
    n = int(0.3 * SR)
    x = rng.uniform(-1, 1, n)
    x = x - onepole_lp(x, 900)
    e = env(n, 0.001, 0.09)
    for d in (0.0, 0.012, 0.024):
        e += np.roll(env(n, 0.001, 0.008), int(d * SR)) * 0.6
    return x * e * 0.35


def bass(note, length):
    n = int(length * SR)
    t = np.arange(n) / SR
    f = midi(note)
    x = np.sin(2 * np.pi * f * t) + 0.25 * np.sin(4 * np.pi * f * t)
    return x * np.minimum(1, t / 0.005) * np.exp(-t * 3.5) * 0.55


def riser(length):
    n = int(length * SR)
    t = np.arange(n) / SR
    x = rng.uniform(-1, 1, n)
    x = x - onepole_lp(x, 400)
    sweep = np.sin(2 * np.pi * np.cumsum(200 + 1400 * (t / length) ** 2) / SR)
    return (x * 0.5 + sweep * 0.15) * (t / length) ** 2.2


def impact():
    n = int(3.0 * SR)
    t = np.arange(n) / SR
    boom = np.sin(2 * np.pi * np.cumsum(38 + 60 * np.exp(-t * 10)) / SR) * np.exp(-t * 2.2)
    x = rng.uniform(-1, 1, n)
    crash = (x - onepole_lp(x, 3000)) * np.exp(-t * 1.6) * 0.35
    return boom * 0.9 + crash


# ---------- arrangement ----------
# F major: Fmaj7, Am7, Dm9, Bbmaj7 — one chord per 2s bar
chords = [
    ([53, 57, 60, 64], 41),  # Fmaj7
    ([57, 60, 64, 67], 45),  # Am7
    ([50, 57, 60, 64], 38),  # Dm9-ish
    ([46, 53, 57, 62], 34),  # Bbmaj7
]
arp_pat = [0, 2, 3, 1, 2, 3, 1, 3]

for bar in range(9):
    t0 = bar * 2.0
    notes, root = chords[bar % 4]
    last = bar == 8
    add(pad(notes, 2.0 if not last else 2.0, bright=0.6 if bar < 4 else 1.0), t0, 0.9 if not last else 1.0)

    # arp: sparse in intro, 8ths after the drop
    step = 0.25 if 4 <= bar < 8 else 0.5
    if not last:
        for k in range(int(2.0 / step)):
            n = notes[arp_pat[k % 8]] + 12
            add(pluck(n), t0 + k * step, 0.55 if bar >= 4 else 0.4, pan=(-0.4 if k % 2 else 0.4))

    # bass from 4s
    if 2 <= bar < 8:
        for k in range(4):
            add(bass(root, 0.45), t0 + k * 0.5, 0.9)

    # drums
    if 2 <= bar < 8 and bar != 3:
        for b in range(4):
            add(kick(), t0 + b * BEAT, 0.9)
            add(hat(), t0 + b * BEAT + 0.25, 0.9, pan=0.3)
            if b in (1, 3):
                add(clap(), t0 + b * BEAT, 1.0, pan=-0.1)
            if bar >= 4 and b == 3:
                add(hat(True), t0 + b * BEAT + 0.25, 0.7, pan=0.3)
    if bar in (0, 1):
        for b in range(4):
            add(hat(), t0 + b * BEAT + 0.25, 0.5, pan=0.3)

# bar 3 (6–8s): build-up while the colour drop flies
for k in range(16):
    t = 6.0 + k * 0.125
    add(clap(), t, 0.25 + 0.6 * k / 16, pan=0.0)
add(kick(), 6.0, 0.9)
add(kick(), 7.0, 0.9)
add(riser(2.0), 6.0, 0.8)

# the drop at 8s = colour hits the candidate
add(impact(), 8.0, 1.0)

# recap accent + final hit
add(riser(0.8), 13.2, 0.4)
add(impact(), 16.0, 0.6)
add(pluck(77, 1.5), 16.0, 0.6)

# ---------- simple reverb ----------
ir_n = int(2.2 * SR)
ir_t = np.arange(ir_n) / SR
irL = rng.normal(0, 1, ir_n) * np.exp(-ir_t * 2.8)
irR = rng.normal(0, 1, ir_n) * np.exp(-ir_t * 2.8)


def conv(x, ir):
    m = len(x) + len(ir)
    size = 1 << (m - 1).bit_length()
    return np.fft.irfft(np.fft.rfft(x, size) * np.fft.rfft(ir, size), size)[: len(x)]


wetL, wetR = conv(L, irL), conv(R, irR)
wetL *= 0.25 * np.max(np.abs(L)) / np.max(np.abs(wetL))
wetR *= 0.25 * np.max(np.abs(R)) / np.max(np.abs(wetR))
L2, R2 = L + wetL, R + wetR

# master: fade, soft clip, normalise
t = np.arange(N) / SR
fade = np.minimum(1, t / 0.3) * np.clip((DUR - t) / 1.8, 0, 1)
mix = np.stack([L2, R2], 1) * fade[:, None]
mix = np.tanh(mix / np.max(np.abs(mix)) * 1.6)
mix = mix / np.max(np.abs(mix)) * 0.89

with wave.open('public/music.wav', 'wb') as w:
    w.setnchannels(2)
    w.setsampwidth(2)
    w.setframerate(SR)
    w.writeframes((mix * 32767).astype('<i2').tobytes())
print('ok')
