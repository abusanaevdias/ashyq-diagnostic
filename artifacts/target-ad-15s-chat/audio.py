"""Synthesises the original soundtrack (soundtrack.wav) from the timeline in composition.html.

120 BPM pulse + warm pad, a breakdown under the dark beat, a pop on every chat
message, keyboard ticks while ASHYQ is typing, a swipe on the price strike.
Needs numpy:  python3 audio.py
"""
import json
import re
import wave
from pathlib import Path

import numpy as np

HERE = Path(__file__).parent
SR = 48000
html = (HERE / "composition.html").read_text(encoding="utf-8")
TL = json.loads(re.search(r'<script id="timeline" type="application/json">(.*?)</script>', html, re.S).group(1))
DUR = TL["duration"]
N = int(SR * DUR)
rng = np.random.default_rng(7)
mix = np.zeros(N)
scenes = {s["id"]: s for s in TL["scenes"]}
dark_a, dark_b = scenes["s5"]["start"], scenes["s5"]["end"]
end_start = scenes["s6"]["start"]


def add(sig, at, gain=1.0):
    i = int(at * SR)
    if i >= N:
        return
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


def kick():
    t = np.arange(int(0.35 * SR)) / SR
    freq = 48 + 90 * np.exp(-t * 28)
    return np.sin(2 * np.pi * np.cumsum(freq) / SR) * np.exp(-t * 9)


def hat():
    n = int(0.05 * SR)
    noise = rng.standard_normal(n)
    hp = noise - lowpass(noise, 6000)
    return hp * np.exp(-np.arange(n) / SR * 90)


def click():
    t = np.arange(int(0.03 * SR)) / SR
    return (np.sin(2 * np.pi * 2100 * t) * 0.6 + rng.standard_normal(len(t)) * 0.25) * np.exp(-t * 180)


def pop():
    t = np.arange(int(0.12 * SR)) / SR
    freq = 520 + 900 * (t / t[-1])
    return np.sin(2 * np.pi * np.cumsum(freq) / SR) * np.exp(-t * 32)


def tick():
    t = np.arange(int(0.02 * SR)) / SR
    return np.sin(2 * np.pi * 3200 * t) * np.exp(-t * 260)


def whoosh(length=0.45):
    n = int(length * SR)
    x = np.linspace(0, 1, n)
    noise = lowpass(rng.standard_normal(n), 2500)
    return noise * np.sin(np.pi * x) ** 2


def pad(freqs, length):
    n = int(length * SR)
    t = np.arange(n) / SR
    sig = np.zeros(n)
    for f in freqs:
        for detune in (-0.12, 0.12):
            ff = f * 2 ** (detune / 12)
            sig += np.sin(2 * np.pi * ff * t) + 0.25 * np.sin(2 * np.pi * 2 * ff * t) + 0.08 * np.sin(2 * np.pi * 3 * ff * t)
    return sig / (len(freqs) * 2) * env(n, 0.35, 0.6)


def note(name):
    names = {"C": -9, "D": -7, "E": -5, "F": -4, "G": -2, "A": 0, "B": 2}
    return 440 * 2 ** ((names[name[0]] + 12 * (int(name[1]) - 4)) / 12)


# Am7 – Fmaj7 – C – G, one chord per bar (2 s)
CHORDS = [["A2", "E3", "G3", "C4"], ["F2", "C3", "E3", "A3"], ["C3", "E3", "G3", "B3"], ["G2", "D3", "G3", "B3"]]
bar = 2.0
for k in range(int(np.ceil(DUR / bar))):
    at = k * bar
    freqs = [note(n) for n in CHORDS[k % 4]]
    in_dark = dark_a <= at < dark_b
    add(pad(freqs, min(bar + 0.6, DUR - at)), at, 0.16 if in_dark else 0.11)
    if not in_dark:
        t = np.arange(int(bar * SR)) / SR
        add(np.sin(2 * np.pi * freqs[0] / 2 * t) * env(len(t), 0.02, 0.4), at, 0.12)

beat = 0.5
for k in range(int(DUR / beat)):
    at = k * beat
    if dark_a <= at < dark_b or at >= end_start + 1.5:
        continue
    add(kick(), at, 0.5)
    add(hat(), at + beat / 2, 0.12)

n = int(0.5 * SR)
riser = lowpass(rng.standard_normal(n), 3000) * np.linspace(0, 1, n) ** 2
add(riser, end_start - 0.5, 0.3)
add(kick(), end_start, 0.7)

for s in TL["scenes"][1:]:
    add(whoosh(), s["start"] - 0.3, 0.22)
for m in TL["messages"]:
    add(pop(), m["t"], 0.32)
    if "typing" in m:
        steps = int((m["t"] - m["typing"]) / 0.07)
        for i in range(steps):
            add(click(), m["typing"] + i * 0.07 + rng.uniform(0, 0.02), 0.18)
for p in TL["pops"]:
    add(pop(), p, 0.3)
add(whoosh(0.25), TL["strike"] - 0.05, 0.3)
add(pop(), TL["newPrice"], 0.4)

mix[: int(0.05 * SR)] *= np.linspace(0, 1, int(0.05 * SR))
mix[-int(0.8 * SR) :] *= np.linspace(1, 0, int(0.8 * SR))
mix = np.tanh(mix * 1.2)
mix *= 10 ** (-1 / 20) / np.max(np.abs(mix))
stereo = np.stack([mix, mix], axis=1)

with wave.open(str(HERE / "soundtrack.wav"), "wb") as w:
    w.setnchannels(2)
    w.setsampwidth(2)
    w.setframerate(SR)
    w.writeframes((stereo * 32767).astype("<i2").tobytes())
print(HERE / "soundtrack.wav")
