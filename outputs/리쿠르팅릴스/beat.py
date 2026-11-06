"""릴스 배경 비트를 직접 합성한다 — 남의 음원을 쓰지 않는다(저작권).

python3 beat.py cues.json out.wav
cues.json 은 render.js 가 화면에서 뽑아 준다: 쾅 들어오는 순간·타자 구간·장면 전환.
120 BPM · 한 박 0.5초 — 화면의 컷도 같은 박에 맞춰 두었다.
"""
import json, sys, wave
import numpy as np

SR = 44100
cues = json.load(open(sys.argv[1], encoding="utf-8"))
T = cues["total"]
N = int(SR * T)
mix = np.zeros(N)
rng = np.random.default_rng(7)
BEAT = 0.5


def put(sig, t, gain=1.0):
    i = int(t * SR)
    if i >= N:
        return
    j = min(N, i + len(sig))
    mix[i:j] += sig[: j - i] * gain


def env(n, a=0.002, d=0.2):
    t = np.arange(n) / SR
    return np.minimum(1, t / a) * np.exp(-t / d)


def lp(x, k):  # 아주 간단한 한 극 저역 통과
    y = np.empty_like(x)
    acc = 0.0
    for i, v in enumerate(x):
        acc += k * (v - acc)
        y[i] = acc
    return y


def kick():
    n = int(0.45 * SR)
    t = np.arange(n) / SR
    f = 45 + 110 * np.exp(-t * 28)
    ph = 2 * np.pi * np.cumsum(f) / SR
    return np.sin(ph) * env(n, 0.001, 0.16)


def snare():
    n = int(0.25 * SR)
    t = np.arange(n) / SR
    nz = rng.standard_normal(n)
    nz = nz - lp(nz, 0.08)
    return (0.7 * nz * env(n, 0.001, 0.07) + 0.4 * np.sin(2 * np.pi * 190 * t) * env(n, 0.001, 0.05))


def hat():
    n = int(0.06 * SR)
    nz = rng.standard_normal(n)
    nz = nz - lp(nz, 0.35)
    return nz * env(n, 0.0005, 0.018)


def boom():
    n = int(1.2 * SR)
    t = np.arange(n) / SR
    f = 32 + 70 * np.exp(-t * 9)
    ph = 2 * np.pi * np.cumsum(f) / SR
    nz = lp(rng.standard_normal(n), 0.05)
    return np.tanh(1.6 * np.sin(ph)) * env(n, 0.001, 0.45) + 0.5 * nz * env(n, 0.001, 0.08)


def whoosh(length=0.35):
    n = int(length * SR)
    nz = rng.standard_normal(n)
    sw = np.linspace(0.01, 0.4, n)
    y = np.empty(n)
    acc = 0.0
    for i in range(n):
        acc += sw[i] * (nz[i] - acc)
        y[i] = acc
    shape = np.sin(np.linspace(0, np.pi, n)) ** 2
    return y * shape


def tick(f=2400, d=0.012):
    n = int(0.04 * SR)
    t = np.arange(n) / SR
    return np.sin(2 * np.pi * f * t) * env(n, 0.0005, d)


def pop():
    n = int(0.12 * SR)
    t = np.arange(n) / SR
    f = 500 + 900 * (1 - np.exp(-t * 60))
    return np.sin(2 * np.pi * np.cumsum(f) / SR) * env(n, 0.001, 0.04)


def riser(a, b):
    n = int((b - a) * SR)
    t = np.arange(n) / SR
    f = 200 * (8 ** (t / t[-1]))
    saw = 2 * ((np.cumsum(f) / SR) % 1) - 1
    nz = rng.standard_normal(n) * 0.4
    return (0.25 * saw + nz * 0.3) * (t / t[-1]) ** 2


# 베이스 — 한 마디(2초)마다 A · F · C · G
ROOTS = [55.0, 43.65, 65.41, 49.0]


def bass_note(f, length):
    n = int(length * SR)
    t = np.arange(n) / SR
    s = np.tanh(2.2 * np.sin(2 * np.pi * f * t)) + 0.3 * np.sin(4 * np.pi * f * t)
    return s * env(n, 0.004, 0.22)


hush = (cues["hush"][0], cues["hush"][1])  # 소리가 멎는 반 박자
nb = int(T / BEAT)
for k in range(nb):
    t = k * BEAT
    if hush[0] <= t < hush[1] or t >= T - 0.5:
        continue
    full = t >= 3.0
    put(kick(), t, 0.95)
    if full and k % 2 == 1:
        put(snare(), t, 0.45)
    if full:
        put(hat(), t + BEAT / 2, 0.22)
        if k % 4 == 3:
            put(hat(), t + BEAT * 0.75, 0.14)
    root = ROOTS[int(t // 2) % 4]
    put(bass_note(root, 0.45), t + (0 if k % 2 == 0 else BEAT / 2), 0.32 if full else 0.22)

for t in cues["impacts"]:
    put(boom(), t, 0.75)
for t in cues["cuts"]:
    put(whoosh(), max(0, t - 0.3), 0.35)
for t in cues["pops"]:
    put(pop(), t, 0.4)
for t in cues["ticks"]:
    put(tick(1800, 0.02), t, 0.35)
for a, b, nch in cues["types"]:
    for i in range(nch):
        put(tick(3200 + 300 * (i % 3), 0.006), a + (b - a) * i / max(1, nch), 0.25)
put(riser(cues["riser"][0], cues["riser"][1]), cues["riser"][0], 0.35)

# 「수입은 약속 안 한다」 뒤 반 박자는 완전히 비운다 — 꼬리까지 잘라야 「무기는」 이 꽂힌다
h0, h1 = int(hush[0] * SR), int(hush[1] * SR)
r = int(0.01 * SR)
mix[h0 - r:h0] *= np.linspace(1, 0, r)
mix[h0:h1] = 0

# 끝은 0.8초 동안 사라진다 · 소리 크기 맞추기
fade = int(0.8 * SR)
mix[-fade:] *= np.linspace(1, 0, fade)
mix = np.tanh(mix * 1.1)
mix = mix / (np.abs(mix).max() + 1e-9) * 0.89
pcm = (mix * 32767).astype(np.int16)
stereo = np.stack([pcm, pcm], axis=1).ravel()
with wave.open(sys.argv[2], "wb") as w:
    w.setnchannels(2)
    w.setsampwidth(2)
    w.setframerate(SR)
    w.writeframes(stereo.tobytes())
print("wav", sys.argv[2], f"{T:.1f}s")
