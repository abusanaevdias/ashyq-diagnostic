"""Soundtrack for one product ad:  python3 audio.py compass  →  soundtrack-compass.wav

Reads the #timeline block of <ad>.html. Besides scenes/duration it understands an
optional "sfx" object: pop / tick / buzz / chime / swoosh are lists of times,
click is a list of [from, to] ranges (keyboard or tap bursts), "quiet" is a list
of [from, to] ranges where the beat drops out. Needs numpy.
"""
import json
import re
import sys
import wave
from pathlib import Path

import numpy as np

HERE = Path(__file__).parent
SR = 48000
AD = sys.argv[1]
html = (HERE / f"{AD}.html").read_text(encoding="utf-8")
TL = json.loads(re.search(r'<script id="timeline" type="application/json">(.*?)</script>', html, re.S).group(1))
SFX = TL.get("sfx", {})
DUR = TL["duration"]
N = int(SR * DUR)
rng = np.random.default_rng(sum(map(ord, AD)))
mix = np.zeros(N)


def add(sig, at, gain=1.0):
    i = int(at * SR)
    if 0 <= i < N:
        sig = sig[: N - i]
        mix[i : i + len(sig)] += sig * gain


def env(n, attack, release):
    e = np.ones(n)
    a, r = int(attack * SR), int(release * SR)
    if a:
        e[:a] = np.linspace(0, 1, a)
    if r:
        e[-r:] *= np.linspace(1, 0, r)
    return e


def lowpass(x, cutoff):
    alpha = 1 - np.exp(-2 * np.pi * cutoff / SR)
    y = np.empty_like(x)
    acc = 0.0
    for i, v in enumerate(x):
        acc += alpha * (v - acc)
        y[i] = acc
    return y


def tone(freq, length, decay):
    t = np.arange(int(length * SR)) / SR
    return np.sin(2 * np.pi * freq * t) * np.exp(-t * decay)


def kick():
    t = np.arange(int(0.3 * SR)) / SR
    return np.sin(2 * np.pi * np.cumsum(48 + 90 * np.exp(-t * 28)) / SR) * np.exp(-t * 9)


def hat():
    n = int(0.05 * SR)
    noise = rng.standard_normal(n)
    return (noise - lowpass(noise, 6000)) * np.exp(-np.arange(n) / SR * 90)


def click():
    t = np.arange(int(0.03 * SR)) / SR
    return (np.sin(2 * np.pi * 2100 * t) * 0.6 + rng.standard_normal(len(t)) * 0.25) * np.exp(-t * 180)


def pop():
    t = np.arange(int(0.12 * SR)) / SR
    return np.sin(2 * np.pi * np.cumsum(520 + 900 * t / t[-1]) / SR) * np.exp(-t * 32)


def whoosh(length=0.4):
    n = int(length * SR)
    return lowpass(rng.standard_normal(n), 2500) * np.sin(np.pi * np.linspace(0, 1, n)) ** 2


def note(name):
    names = {"C": -9, "D": -7, "E": -5, "F": -4, "G": -2, "A": 0, "B": 2}
    return 440 * 2 ** ((names[name[0]] + 12 * (int(name[1]) - 4)) / 12)


def pad(freqs, length):
    n = int(length * SR)
    t = np.arange(n) / SR
    return sum(np.sin(2 * np.pi * f * t) + 0.25 * np.sin(4 * np.pi * f * t) for f in freqs) / len(freqs) * env(n, 0.3, 0.5)


quiet = SFX.get("quiet", [])
in_quiet = lambda at: any(a <= at < b for a, b in quiet)
CHORDS = [["C3", "E3", "G3"], ["A2", "E3", "C4"], ["F2", "C3", "A3"], ["G2", "D3", "B3"]]
for k in range(int(np.ceil(DUR / 2))):
    at = k * 2.0
    add(pad([note(n) for n in CHORDS[k % 4]], min(2.5, DUR - at)), at, 0.1)
for k in range(int(DUR / 0.5)):
    at = k * 0.5
    if in_quiet(at) or at >= DUR - 1.0:
        continue
    add(kick(), at, 0.45)
    add(hat(), at + 0.25, 0.1)

for s in TL["scenes"][1:]:
    add(whoosh(), s["start"] - 0.3, 0.2)
for at in SFX.get("pop", []):
    add(pop(), at, 0.3)
for a, b in SFX.get("click", []):
    for i in range(int((b - a) / 0.09)):
        add(click(), a + i * 0.09 + rng.uniform(0, 0.03), 0.3)
for at in SFX.get("tick", []):
    add(tone(3200, 0.03, 220), at, 0.6)
for at in SFX.get("buzz", []):
    tb = np.arange(int(0.4 * SR)) / SR
    add(np.sign(np.sin(2 * np.pi * 110 * tb)) * 0.5 * env(len(tb), 0.005, 0.1), at, 0.3)
for at in SFX.get("chime", []):
    for i, n in enumerate(["C5", "E5", "G5", "C6"]):
        add(tone(note(n), 0.6, 6), at + i * 0.07, 0.2)
rl = TL.get("roulette")
if rl:  # decelerating ticks: the eOut curve crosses each step boundary
    for k in range(1, rl["steps"] + 1):
        p = 1 - (1 - k / rl["steps"]) ** (1 / 3)
        add(tone(2600, 0.025, 240), rl["from"] + p * (rl["to"] - rl["from"]), 0.5)
for at in SFX.get("swoosh", []):
    add(whoosh(0.25), at, 0.3)
add(kick(), TL["scenes"][-1]["start"], 0.7)

mix[: int(0.03 * SR)] *= np.linspace(0, 1, int(0.03 * SR))
mix[-int(0.8 * SR) :] *= np.linspace(1, 0, int(0.8 * SR))
mix = np.tanh(mix * 1.2)
mix *= 10 ** (-1 / 20) / np.max(np.abs(mix))
stereo = np.stack([mix, mix], axis=1)
out = HERE / f"soundtrack-{AD}.wav"
with wave.open(str(out), "wb") as w:
    w.setnchannels(2)
    w.setsampwidth(2)
    w.setframerate(SR)
    w.writeframes((stereo * 32767).astype("<i2").tobytes())
print(out)
