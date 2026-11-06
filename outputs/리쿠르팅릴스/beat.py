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
CHIP = cues.get("style") == "chip"   # 게임판 — 8비트 칩튠
nb = 0 if CHIP else int(T / BEAT)
for k in range(nb):
    t = k * BEAT
    if hush[0] <= t < hush[1] or t >= T - 0.5:
        continue
    full = t >= 3.0
    # 감동 구간(아플 때 · 고마움 · 끝까지) — 북을 줄이고 화음·피아노가 앞으로 나온다
    if any(a <= t < b for a, b in cues.get("soft", [])):
        if k % 2 == 0:
            put(kick(), t, 0.32)
            put(bass_note(ROOTS[int(t // 2) % 4], 0.9), t, 0.12)
        continue
    # 고민 구간은 북만 남겨 가라앉힌다 — 해법에서 다시 꽉 찬다
    if any(a <= t < b for a, b in cues.get("sparse", [])):
        put(kick(), t, 0.55)
        if k % 2 == 0:
            put(bass_note(ROOTS[3], 0.9), t, 0.2)
        continue
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


def tone(f0, f1, length, dec):
    n = int(length * SR)
    t = np.arange(n) / SR
    f = f0 + (f1 - f0) * t / length
    return np.sin(2 * np.pi * np.cumsum(f) / SR) * env(n, 0.004, dec)


def bell(f):
    n = int(0.9 * SR)
    t = np.arange(n) / SR
    s = sum(a * np.sin(2 * np.pi * f * m * t) for m, a in ((1, 1), (2, 0.5), (3, 0.25), (4.2, 0.15)))
    return s * env(n, 0.002, 0.35)


for t in cues.get("uhoh", []):  # 고민 — 내려가는 두 음 「어-오」
    put(tone(523, 500, 0.18, 0.12), t, 0.35)
    put(tone(415, 370, 0.32, 0.2), t + 0.2, 0.35)
for t in cues.get("dings", []):  # 해법 — 맑은 종 두 번
    put(bell(1046.5), t, 0.28)
    put(bell(1568), t + 0.12, 0.22)
    put(boom(), t, 0.5)

# 화음 깔개 — 마디(2초)마다 Am · F · C · G. 감동 구간에서는 크게, 그 밖에서는 낮게 깐다
CHORDS = [[220.0, 261.63, 329.63], [174.61, 220.0, 261.63], [261.63, 329.63, 392.0], [196.0, 246.94, 293.66]]


def soft_at(t):
    return any(a <= t < b for a, b in cues.get("soft", []))


def pad(freqs, length):
    n = int(length * SR)
    tt = np.arange(n) / SR
    s = sum(np.sin(2 * np.pi * f * tt) + 0.35 * np.sin(2 * np.pi * f * 2.003 * tt) + 0.5 * np.sin(2 * np.pi * f * 0.997 * tt) for f in freqs)
    a = np.minimum(1, tt / 0.5) * np.minimum(1, (length - tt) / 0.5)
    return s * a / len(freqs)


for bar in range(0 if CHIP else int(T // 2) + 1):
    t0 = bar * 2.0
    if t0 >= T - 0.8:
        break
    put(pad(CHORDS[bar % 4], 2.1), t0, 0.22 if soft_at(t0 + 1) else 0.07)
    if soft_at(t0 + 0.01):  # 피아노 같은 오르내림
        notes = CHORDS[bar % 4] + [CHORDS[bar % 4][1] * 2, CHORDS[bar % 4][2] * 2, CHORDS[bar % 4][1] * 2, CHORDS[bar % 4][0] * 2]
        for j, f in enumerate(notes[:8]):
            if soft_at(t0 + j * 0.25):
                put(bell(f), t0 + j * 0.25, 0.10)


# ───────── 칩튠 (게임판) — 네모파 베이스 · 네모파 아르페지오 · 잡음 하이햇 · 효과음 ─────────
def sq(f, length, duty=0.5, dec=0.12, vib=0.0):
    n = int(length * SR)
    t = np.arange(n) / SR
    ph = (f * t + vib * np.sin(2 * np.pi * 6 * t) / 6) % 1.0
    return np.where(ph < duty, 1.0, -1.0) * env(n, 0.002, dec)


def nz8(length, dec):
    n = int(length * SR)
    step = 8   # 낮은 해상도 잡음 — 옛 게임기 소리
    v = np.repeat(rng.choice([-1.0, 1.0], size=n // step + 1), step)[:n]
    return v * env(n, 0.0005, dec)


if CHIP:
    LEAD = [[440.0, 523.25, 659.25, 880.0], [349.23, 440.0, 523.25, 698.46], [523.25, 659.25, 783.99, 1046.5], [392.0, 493.88, 587.33, 783.99]]
    BASS = [110.0, 87.31, 130.81, 98.0]
    for k in range(int(T / BEAT)):
        t = k * BEAT
        if hush[0] <= t < hush[1] or t >= T - 0.5:
            continue
        bar = int(t // 2) % 4
        put(sq(BASS[bar], 0.22, 0.5, 0.09), t, 0.16)
        put(sq(BASS[bar] * 2, 0.12, 0.5, 0.05), t + BEAT / 2, 0.10)
        for q in range(4):   # 16분음표 아르페지오
            put(sq(LEAD[bar][(k * 4 + q) % 4], 0.11, 0.25, 0.05), t + q * BEAT / 4, 0.055)
        put(nz8(0.05, 0.012), t + BEAT / 2, 0.10)
        if k % 2 == 1:
            put(nz8(0.12, 0.04), t, 0.13)
        if k % 4 == 0:
            put(sq(60, 0.18, 0.5, 0.06), t, 0.22)

    def lvup(t0):   # 레벨업 — 올라가는 다섯 음
        for i, f in enumerate([523.25, 659.25, 783.99, 1046.5, 1318.5]):
            put(sq(f, 0.12, 0.25, 0.08), t0 + i * 0.07, 0.22)

    def coin(t0):
        put(sq(987.77, 0.07, 0.5, 0.05), t0, 0.2)
        put(sq(1318.5, 0.25, 0.5, 0.14), t0 + 0.07, 0.2)

    def hit(t0):
        put(nz8(0.25, 0.08), t0, 0.35)
        put(tone(300, 60, 0.2, 0.1), t0, 0.4)

    def fanfare(t0):
        for i, f in enumerate([523.25, 523.25, 523.25, 659.25, 783.99, 1046.5]):
            put(sq(f, 0.16 if i < 5 else 0.6, 0.5, 0.1 if i < 5 else 0.35), t0 + [0, .12, .24, .36, .6, .84][i], 0.22)

    for t0 in cues.get("lvup", []): lvup(t0)
    for t0 in cues.get("coin", []): coin(t0)
    for t0 in cues.get("hit", []): hit(t0)
    for t0 in cues.get("fanfare", []): fanfare(t0)

# 한 줄 앞 반 박자는 완전히 비운다 — 꼬리까지 잘라야 다음 말이 꽂힌다
h0, h1 = int(hush[0] * SR), int(hush[1] * SR)
r = int(0.01 * SR)
mix[h0 - r:h0] *= np.linspace(1, 0, r)
mix[h0:h1] = 0

# 내레이션 — 녹음이 있으면 넣고, 그동안 음악을 줄인다(덕킹)
voice = np.zeros(N)
for t0, f in cues.get("narr", []):
    with wave.open(f) as w:
        v = np.frombuffer(w.readframes(w.getnframes()), dtype=np.int16).astype(np.float64) / 32768.0
    i = int(t0 * SR)
    j = min(N, i + len(v))
    if i < N:
        voice[i:j] += v[: j - i]
if np.abs(voice).max() > 0:
    lvl = np.abs(voice)
    k = int(0.25 * SR)
    cs = np.concatenate([[0.0], np.cumsum(lvl)])              # 말소리 덩어리 — 0.25초 이동 평균(누적합으로 빠르게)
    lo = np.clip(np.arange(N) - k // 2, 0, N); hi = np.clip(np.arange(N) + k // 2, 0, N)
    lvl = (cs[hi] - cs[lo]) / np.maximum(hi - lo, 1)
    duck = 1 - 0.7 * np.clip(lvl / (lvl.max() * 0.15 + 1e-9), 0, 1)
    mix = mix / (np.abs(mix).max() + 1e-9) * 0.5 * duck + voice / (np.abs(voice).max() + 1e-9) * 0.95

# 끝은 0.8초 동안 사라진다 · 소리 크기 맞추기
fade = int(0.8 * SR)
mix[-fade:] *= np.linspace(1, 0, fade)
mix = np.tanh(mix * (2.6 if CHIP else 1.1))   # 칩튠은 소리가 가늘어 더 눌러 키운다
mix = mix / (np.abs(mix).max() + 1e-9) * 0.89
pcm = (mix * 32767).astype(np.int16)
stereo = np.stack([pcm, pcm], axis=1).ravel()
with wave.open(sys.argv[2], "wb") as w:
    w.setnchannels(2)
    w.setsampwidth(2)
    w.setframerate(SR)
    w.writeframes(stereo.tobytes())
print("wav", sys.argv[2], f"{T:.1f}s")
