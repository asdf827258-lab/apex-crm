"""편집 틀 소리 — python3 kit_sound.py <종류> <길이초> <out.wav>
종류: intro · chapter · end · send · lower. 직접 합성한다(남의 음원 없음 · 저작권 걱정 없음)."""
import sys, wave
import numpy as np

SR = 44100
kind, T, out = sys.argv[1], float(sys.argv[2]), sys.argv[3]
N = int(SR * T)
mix = np.zeros(N)
rng = np.random.default_rng(3)


def put(sig, t, g=1.0):
    i = int(t * SR)
    j = min(N, i + len(sig))
    if 0 <= i < N:
        mix[i:j] += sig[: j - i] * g


def env(n, a, d):
    t = np.arange(n) / SR
    return np.minimum(1, t / a) * np.exp(-t / d)


def bell(f, d=0.9):
    n = int(2.2 * SR)
    t = np.arange(n) / SR
    s = sum(a * np.sin(2 * np.pi * f * m * t) for m, a in ((1, 1), (2, 0.45), (3, 0.2), (4.2, 0.12)))
    return s * env(n, 0.003, d)


def swoosh(length, up=True):
    n = int(length * SR)
    nz = rng.standard_normal(n)
    sw = np.linspace(0.02, 0.35, n) if up else np.linspace(0.35, 0.02, n)
    y = np.empty(n)
    acc = 0.0
    for i in range(n):
        acc += sw[i] * (nz[i] - acc)
        y[i] = acc
    return y * np.sin(np.linspace(0, np.pi, n)) ** 2


def boom():
    n = int(1.2 * SR)
    t = np.arange(n) / SR
    f = 40 + 60 * np.exp(-t * 8)
    return np.sin(2 * np.pi * np.cumsum(f) / SR) * env(n, 0.002, 0.4)


def pad(freqs, length):
    n = int(length * SR)
    t = np.arange(n) / SR
    s = sum(np.sin(2 * np.pi * f * t) + 0.4 * np.sin(2 * np.pi * f * 2.004 * t) for f in freqs) / len(freqs)
    return s * np.minimum(1, t / 0.6) * np.minimum(1, (length - t) / 0.6)


C = [261.63, 329.63, 392.0, 587.33]          # C add9
if kind == "intro":
    put(swoosh(1.0), 0.05, 0.5)
    put(boom(), 1.1, 0.7)
    for i, f in enumerate(C):
        put(bell(f, 1.2), 1.12 + i * 0.05, 0.22)
    put(pad([130.81, 196.0, 261.63], T - 1.0), 1.0, 0.18)
elif kind == "chapter":
    put(swoosh(0.45), 0.0, 0.45)
    put(bell(783.99, 0.5), 0.35, 0.18)
elif kind == "lower":
    put(swoosh(0.4), 0.02, 0.25)
    put(swoosh(0.4, False), 5.2, 0.2)
elif kind == "send":
    for i, f in enumerate([523.25, 659.25, 783.99]):
        put(bell(f, 0.8), 0.1 + i * 0.12, 0.22)
elif kind == "end":
    CH = [[220.0, 261.63, 329.63], [174.61, 220.0, 261.63], [261.63, 329.63, 392.0], [196.0, 246.94, 293.66]]
    for k in range(int(T // 2.5) + 1):
        put(pad(CH[k % 4], 2.7), k * 2.5, 0.22)
        for j, f in enumerate(CH[k % 4]):
            put(bell(f * 2, 0.7), k * 2.5 + j * 0.42, 0.06)
fade = int(0.4 * SR)
mix[-fade:] *= np.linspace(1, 0, fade)
mix = mix / (np.abs(mix).max() + 1e-9) * 0.85
pcm = (np.tanh(mix * 1.2) * 0.9 * 32767).astype(np.int16)
with wave.open(out, "wb") as w:
    w.setnchannels(2); w.setsampwidth(2); w.setframerate(SR)
    w.writeframes(np.stack([pcm, pcm], axis=1).ravel().tobytes())
