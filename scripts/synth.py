"""Small synth toolkit shared by the soundtrack scripts."""
import wave
import numpy as np

SR = 48000
rng = np.random.default_rng(5)


def midi(n):
    return 440.0 * 2 ** ((n - 69) / 12)


class Track:
    """Stereo buffer that instruments are mixed into."""

    def __init__(self, dur):
        self.dur = dur
        self.n = int(SR * dur)
        self.L = np.zeros(self.n)
        self.R = np.zeros(self.n)

    def add(self, sig, t, gain=1.0, pan=0.0):
        i = int(t * SR)
        if i >= self.n or i < 0:
            return
        sig = sig[: self.n - i]
        self.L[i : i + len(sig)] += sig * gain * np.sqrt((1 - pan) / 2)
        self.R[i : i + len(sig)] += sig * gain * np.sqrt((1 + pan) / 2)

    def duck(self, a, b):
        """Fade everything between a and b seconds down to silence."""
        i, j = int(a * SR), int(b * SR)
        env = np.linspace(1, 0, j - i) ** 4
        self.L[i:j] *= env
        self.R[i:j] *= env

    def silence(self, a, b):
        i, j = int(a * SR), int(b * SR)
        self.L[i:j] = 0
        self.R[i:j] = 0

    def write(self, path, reverb=0.25, fade_out=1.2, hall=1.8, decay=3.3, drive=1.8):
        ir_n = int(hall * SR)
        ir_t = np.arange(ir_n) / SR
        irL = rng.normal(0, 1, ir_n) * np.exp(-ir_t * decay)
        irR = rng.normal(0, 1, ir_n) * np.exp(-ir_t * decay)
        wetL, wetR = _conv(self.L, irL), _conv(self.R, irR)
        wetL *= reverb * np.max(np.abs(self.L)) / np.max(np.abs(wetL))
        wetR *= reverb * np.max(np.abs(self.R)) / np.max(np.abs(wetR))
        t = np.arange(self.n) / SR
        fade = np.minimum(1, t / 0.02) * np.clip((self.dur - t) / fade_out, 0, 1)
        mix = np.stack([self.L + wetL, self.R + wetR], 1) * fade[:, None]
        mix = np.tanh(mix / np.max(np.abs(mix)) * drive)
        mix = mix / np.max(np.abs(mix)) * 0.89
        with wave.open(path, 'wb') as w:
            w.setnchannels(2)
            w.setsampwidth(2)
            w.setframerate(SR)
            w.writeframes((mix * 32767).astype('<i2').tobytes())


def _conv(x, ir):
    m = len(x) + len(ir)
    size = 1 << (m - 1).bit_length()
    return np.fft.irfft(np.fft.rfft(x, size) * np.fft.rfft(ir, size), size)[: len(x)]


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


# ---------- epic / trailer instruments ----------
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
    f = 80 * 2 ** (4.5 * t / length)
    tone = np.sin(2 * np.pi * np.cumsum(f) / SR) + 0.5 * np.sin(2 * np.pi * np.cumsum(f * 1.5) / SR)
    return (x * 0.6 + tone * 0.25) * (t / length) ** 2.5


def reverse_swell(length):
    c = crash(length)[::-1]
    return c * 1.2


# ---------- extra trailer instruments ----------
def clang(length=2.5, base=180):
    """Metallic, inharmonic impact layer."""
    t = tt(length)
    out = np.zeros_like(t)
    for ratio, amp, dec in ((1.0, 1.0, 2.5), (2.76, 0.7, 3.5), (5.4, 0.5, 5), (8.93, 0.35, 7), (13.3, 0.2, 9)):
        out += amp * np.sin(2 * np.pi * base * ratio * t + rng.uniform(0, 6.28)) * np.exp(-t * dec)
    x = rng.uniform(-1, 1, len(t))
    out += (x - onepole_lp(x, 5000)) * np.exp(-t * 25) * 0.8
    return out * 0.35


def snare(length=0.25):
    t = tt(length)
    x = rng.uniform(-1, 1, len(t))
    body = np.sin(2 * np.pi * 190 * t) * np.exp(-t * 30)
    return ((x - onepole_lp(x, 1500)) * 0.7 + body * 0.5) * np.exp(-t * 18) * 0.6


def snare_roll(track, t0, t1, gain=0.6):
    """Military roll that accelerates and swells from t0 to t1."""
    t = t0
    while t < t1:
        p = (t - t0) / (t1 - t0)
        track.add(snare(), t, gain * (0.25 + 0.75 * p ** 1.5), pan=(rng.uniform(-0.3, 0.3)))
        t += 0.125 * (1 - p) + 0.03 * p


def brass(note, length, vib=True):
    """Heroic brass lead: filtered saw stack with a swell and vibrato."""
    t = tt(length)
    f0 = midi(note)
    v = 1 + (0.005 * np.sin(2 * np.pi * 5.2 * t) * np.minimum(1, t / 0.4) if vib else 0)
    cutoff = 600 + 2200 * np.minimum(1, t / 0.15) * np.exp(-t * 0.6)
    out = np.zeros_like(t)
    for det in (-0.08, 0.0, 0.08):
        ph = 2 * np.pi * np.cumsum(f0 * 2 ** (det / 12) * v) / SR
        for h in range(1, 24):
            if f0 * h > 9000:
                break
            out += (1 / h) * np.exp(-f0 * h / cutoff) * np.sin(h * ph)
    e = np.minimum(1, t / 0.06) * np.clip((length - t) / 0.12, 0, 1)
    return np.tanh(out * e * 0.9) * 0.6
