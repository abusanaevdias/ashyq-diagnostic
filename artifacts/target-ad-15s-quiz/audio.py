"""Synthesises the original soundtrack (soundtrack.wav) from the timeline in composition.html.

120 BPM pulse + warm pad, a clock tick on every countdown second with a rising
tension tone, a buzzer at zero, a swipe on the struck answer and a chime on the reveal.
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
cd = TL["countdown"]
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


def chime(freqs, length=0.6):
    t = np.arange(int(length * SR)) / SR
    return sum(np.sin(2 * np.pi * f * t) for f in freqs) / len(freqs) * np.exp(-t * 6)


def buzzer():
    t = np.arange(int(0.35 * SR)) / SR
    return np.sign(np.sin(2 * np.pi * 140 * t)) * 0.5 * env(len(t), 0.005, 0.08)


# Am7 – Fmaj7 – C – G, one chord per bar (2 s); the countdown drops the pad to a low drone
CHORDS = [["A2", "E3", "G3", "C4"], ["F2", "C3", "E3", "A3"], ["C3", "E3", "G3", "B3"], ["G2", "D3", "G3", "B3"]]
bar = 2.0
for k in range(int(np.ceil(DUR / bar))):
    at = k * bar
    if cd["from"] <= at < cd["to"]:
        continue
    freqs = [note(n) for n in CHORDS[k % 4]]
    add(pad(freqs, min(bar + 0.6, DUR - at)), at, 0.11)
    t = np.arange(int(bar * SR)) / SR
    add(np.sin(2 * np.pi * freqs[0] / 2 * t) * env(len(t), 0.02, 0.4), at, 0.12)

# tension under the countdown: a low drone rising a semitone per second
n = int((cd["to"] - cd["from"]) * SR)
t = np.arange(n) / SR
freq = note("A2") * 2 ** (t / 12)
add(np.sin(2 * np.pi * np.cumsum(freq) / SR) * env(n, 0.3, 0.1), cd["from"], 0.14)

beat = 0.5
for k in range(int(DUR / beat)):
    at = k * beat
    if at >= end_start + 1.5:
        continue
    in_cd = cd["from"] <= at < cd["to"]
    add(kick(), at, 0.3 if in_cd else 0.5)
    if not in_cd:
        add(hat(), at + beat / 2, 0.12)

for i in range(int(cd["to"] - cd["from"])):
    add(tick(), cd["from"] + i, 0.9)
    add(tick(), cd["from"] + i + 0.5, 0.35)
add(buzzer(), TL["buzzer"], 0.35)
add(whoosh(0.25), TL["strikeTrue"] - 0.05, 0.3)
add(whoosh(TL["scan"]["to"] - TL["scan"]["from"]), TL["scan"]["from"], 0.15)
add(chime([note("C5"), note("E5"), note("G5")]), TL["reveal"], 0.35)
add(chime([note("G5"), note("C6")], 0.4), TL["reveal"] + 0.12, 0.25)

for s in TL["scenes"][1:]:
    add(whoosh(), s["start"] - 0.3, 0.18)
for p in TL["pops"]:
    add(pop(), p, 0.3)
add(kick(), end_start, 0.7)

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
