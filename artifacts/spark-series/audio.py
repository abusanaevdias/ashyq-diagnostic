"""Synthesises the soundtrack for one «Искра vs IELTS» episode.

    python3 audio.py 1   →  soundtrack-ep1.wav

Light 120 BPM beat, keyboard clicks while Искра answers, a proud pop, a
fail buzzer with a stamp thud, a "got it" chime on the fix and a sparkle
"дзинь" on the series plate. Timings come from episodes.js. Needs numpy.
"""
import json
import re
import sys
import wave
from pathlib import Path

import numpy as np

HERE = Path(__file__).parent
SR = 48000
EP = sys.argv[1] if len(sys.argv) > 1 else "1"
DATA = json.loads(re.search(r"window\.EPISODES = (\{.*\});", (HERE / "episodes.js").read_text(encoding="utf-8"), re.S).group(1))
T = DATA["timeline"]
DUR = T["duration"]
N = int(SR * DUR)
rng = np.random.default_rng(int(EP))
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


def whoosh(length=0.4):
    n = int(length * SR)
    return lowpass(rng.standard_normal(n), 2500) * np.sin(np.pi * np.linspace(0, 1, n)) ** 2


def note(name):
    names = {"C": -9, "D": -7, "E": -5, "F": -4, "G": -2, "A": 0, "B": 2}
    return 440 * 2 ** ((names[name[0]] + 12 * (int(name[1]) - 4)) / 12)


def pad(freqs, length):
    n = int(length * SR)
    t = np.arange(n) / SR
    sig = sum(np.sin(2 * np.pi * f * t) + 0.25 * np.sin(4 * np.pi * f * t) for f in freqs)
    return sig / len(freqs) * env(n, 0.3, 0.5)


# F – G – Am – C, one chord per bar; the fail beat drops to a single low hit
CHORDS = [["F2", "C3", "A3"], ["G2", "D3", "B3"], ["A2", "E3", "C4"], ["C3", "E3", "G3"]]
for k in range(int(np.ceil(DUR / 2))):
    at = k * 2.0
    add(pad([note(n) for n in CHORDS[k % 4]], min(2.5, DUR - at)), at, 0.1)
for k in range(int(DUR / 0.5)):
    at = k * 0.5
    if T["fail"] <= at < T["rule"] or at >= DUR - 1.0:
        continue
    add(kick(), at, 0.45)
    add(hat(), at + 0.25, 0.1)

# sparkle «дзинь» on the plate
for i, f in enumerate([note("E5") * 2, note("B5") * 2, note("E5") * 4]):
    add(tone(f, 0.5, 9), 0.05 + i * 0.06, 0.18)
# typing
a, b = T["typing"]
for i in range(int((b - a) / 0.09)):
    add(click(), a + i * 0.09 + rng.uniform(0, 0.03), 0.3)
add(tone(880, 0.2, 18), T["done"], 0.3)
# fail: buzzer + stamp thud
tb = np.arange(int(0.45 * SR)) / SR
add(np.sign(np.sin(2 * np.pi * 110 * tb)) * 0.5 * env(len(tb), 0.005, 0.1), T["fail"], 0.3)
add(kick(), T["fail"] + 0.06, 0.9)
# the fix: rising chime
for i, n in enumerate(["C5", "E5", "G5", "C6"]):
    add(tone(note(n), 0.6, 6), T["fix"] + i * 0.07, 0.2)
for at in (T["fail"], T["rule"], T["end"]):
    add(whoosh(), at - 0.3, 0.2)
add(kick(), T["end"], 0.7)

mix[: int(0.03 * SR)] *= np.linspace(0, 1, int(0.03 * SR))
mix[-int(0.8 * SR) :] *= np.linspace(1, 0, int(0.8 * SR))
mix = np.tanh(mix * 1.2)
mix *= 10 ** (-1 / 20) / np.max(np.abs(mix))
stereo = np.stack([mix, mix], axis=1)
out = HERE / f"soundtrack-ep{EP}.wav"
with wave.open(str(out), "wb") as w:
    w.setnchannels(2)
    w.setsampwidth(2)
    w.setframerate(SR)
    w.writeframes((stereo * 32767).astype("<i2").tobytes())
print(out)
