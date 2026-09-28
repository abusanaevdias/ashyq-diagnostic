"""Deterministic PDF -> native-content migration; never run in website runtime.

Usage: bundled-python scripts/import-free-library.py /path/to/three-pdfs
Generated JSON is a mechanical source conversion, not new educational content.
Paragraph gaps, font roles, table cell bounds, hyperlinks and source page IDs survive.
"""
import hashlib
import json
import re
import sys
from pathlib import Path

import pdfplumber

ROOT = Path(__file__).resolve().parents[1]
BASE = Path(sys.argv[1])
FILES = {
    "library": next(BASE.glob("*IELTS_Free_Library_V3.pdf")),
    "lab": next(BASE.glob("*Writing_Upgrade_Lab_V3.pdf")),
    "workbook": next(BASE.glob("*Writing_Workbook_V3.pdf")),
}

def clean(text):
    return re.sub(r"\s+", " ", text).strip()

def cell_text(page, box):
    # Slightly inset coordinates avoid neighbouring glyphs on cell borders.
    x0, top, x1, bottom = box
    return clean(page.crop((x0 + .4, top, x1 - .4, bottom)).extract_text() or "")

def extract(page, number, source):
    lines = [l for l in page.extract_text_lines() if 40 < l["top"] < page.height - 38]
    assert lines and "/ ASHYQ OPEN PRACTICE" in lines[0]["text"], (source, number)
    code = lines.pop(0)["text"].split(" / ")[0]
    title_lines = []
    while lines and max(c["size"] for c in lines[0]["chars"]) >= 18:
        title_lines.append(lines.pop(0)["text"])
    title = clean(" ".join(title_lines))
    assert title, (source, number, code)
    subtitle = ""
    if lines and max(c["size"] for c in lines[0]["chars"]) < 9:
        subtitle = clean(lines.pop(0)["text"])
    if source == "library" and number == 95:
        # This source page uses two columns (1-9 on left, 10-18 on right).
        # A whole-width extraction interleaves unrelated question fragments.
        q_top = next(line['top'] for line in lines if 'SP1-01' in line['text'])
        intro = [line for line in lines if line['top'] < q_top - .2]
        left = page.crop((48, q_top - .2, 296, page.height - 38)).extract_text_lines()
        right = page.crop((302, q_top - .2, 548, page.height - 38)).extract_text_lines()
        lines = intro + left + right
    blocks, tables = [], []
    for table in page.find_tables():
        x0, top, x1, bottom = table.bbox
        if not (80 < top < page.height - 60) or len(table.cells) < 2:
            continue
        # ReportLab tables draw header rectangles and each body-row bottom.
        # Extend the header-only detection with those horizontal rules.
        cols = sorted(set(round(c[0], 3) for c in table.cells) | {round(x1, 3)})
        rules = sorted(set(round(l["top"], 3) for l in page.lines
                           if abs(l["top"] - l["bottom"]) < .2
                           and l["top"] >= bottom - .2
                           and abs(l["x0"] - x0) < 2 and l["x1"] <= cols[1] + 2))
        ends = [bottom]
        next_header = min((other.bbox[1] for other in page.find_tables() if other.bbox[1] > top + 1), default=page.height)
        for y in rules:
            if y <= ends[-1] + .2:
                continue
            if y - ends[-1] > 120:
                break
            if y >= next_header:
                break
            ends.append(y)
        rows, start = [], top
        for end in ends:
            rows.append([cell_text(page, (a, start, b, end)) for a, b in zip(cols, cols[1:])])
            start = end
        tables.append((top, ends[-1], {"kind": "table", "rows": rows}))
    consumed = set()
    pending, previous = None, None

    def flush():
        nonlocal pending
        if pending:
            pending["text"] = clean(pending["text"])
            blocks.append(pending)
            pending = None

    for line in lines:
        top, bottom = line["top"], line["bottom"]
        containing = next((i for i, (a, b, _) in enumerate(tables) if a - .3 <= top <= b), None)
        if containing is not None:
            flush()
            if containing not in consumed:
                blocks.append(tables[containing][2]); consumed.add(containing)
            previous = None
            continue
        # Replace visual Task 1 input with native, accessible graph/flow components.
        if source == "library" and ((number == 51 and 228 < top < 350) or (number == 61 and 200 < top < 295)):
            flush()
            if not any(b["kind"] == "visual" for b in blocks):
                blocks.append({"kind": "visual", "id": "courses" if number == 51 else "books"})
            previous = None
            continue
        text = line["text"]
        chars = line["chars"]
        size = max(c["size"] for c in chars)
        bold = sum("Bold" in c["fontname"] for c in chars) > len(chars) * .65
        is_code = bool(re.fullmatch(r"(?:U0[1-4]|TR|CC|LR|GR|X)\-\d{2}(?: / [A-Z +\-]+)?", text))
        criterion = bool(re.fullmatch(r"(?:TR|CC|LR|GR|GRA|TA) (?:[5-9]|TARGET)", text))
        kind = "criterion" if criterion else "heading" if (bold and size >= 10.5) or is_code else "paragraph"
        href = next((h.get("uri") for h in page.hyperlinks if h.get("uri") and
                     h.get("top", -100) - 2 <= top <= h.get("bottom", -100) + 2), None)
        if href and (href.startswith("https://") or href.startswith("http://")):
            flush(); blocks.append({"kind": "link", "text": clean(text), "href": href}); previous = None; continue
        # Never coalesce a numbered exercise with the preceding exercise.
        numbered = bool(re.match(r"^(?:\d{1,2}\. |[A-C]\. |(?:[ELRSCGT]\d*|NEW\d*)-\d{2}\b)", text))
        if pending and (kind != pending["kind"] or previous is None or top - previous > 9 or numbered):
            flush()
        if not pending:
            pending = {"kind": kind, "text": text}
        else:
            pending["text"] += " " + text
        previous = bottom
    flush()
    is_answer = bool(re.search(r"(?:-KEY|-K$|-F$|-C$)", code))
    # V2 C = strong essay / reading answer page; only the latter is a key.
    if re.match(r"(?:E\d|T1[A-C])", code):
        is_answer = code.endswith("-F") or (code.startswith("T1") and code.endswith("-E"))
    if code.startswith("U"):
        is_answer = "-KEY-" in code
    if code in ["L01-B", "L02-B", "L03-B"]:
        is_answer = True
    exercise = bool(re.search(r"(?:-Q(?:-\d)?$|-E$|-D$|-B$|-A$)", code))
    if code.startswith("U"):
        exercise = "-Q-" in code
    elif code.startswith(("E", "T1")):
        exercise = code.endswith("-E") if code.startswith("E") else code.endswith("-D")
    elif code.startswith("R0"):
        exercise = code.endswith("-B")
    elif code.startswith("L0"):
        exercise = code.endswith("-A")
    elif code.startswith("S-"):
        exercise = code.startswith(("S-P", "S-REVIEW"))
    return {"code": code, "title": title, "subtitle": subtitle, "page": number,
            "source": source, "answer": is_answer, "exercise": exercise and not is_answer,
            "blocks": blocks}

output = {"version": 3, "sources": {}, "sections": []}
for source, path in FILES.items():
    with pdfplumber.open(path) as pdf:
        output["sources"][source] = {"file": path.name, "pages": len(pdf.pages),
                                        "sha256": hashlib.sha256(path.read_bytes()).hexdigest()}
        if source == "workbook":
            continue  # Repeats the lab's essays/questions, deliberately not counted twice.
        indices = range(3, 112) if source == "library" else range(2, 91)
        for index in indices:
            output["sections"].append(extract(pdf.pages[index], index + 1, source))
        if source == "library":
            # Same V3 Lab is appended verbatim, with different physical PDF page numbers.
            from pypdf import PdfReader
            lab = PdfReader(FILES["lab"])
            merged = PdfReader(path)
            assert len(merged.pages) == 112 + len(lab.pages)
            for i, p in enumerate(lab.pages):
                assert clean(p.extract_text()) == clean(merged.pages[112 + i].extract_text()), i

assert len(output["sections"]) == 198
assert len({(s["source"], s["code"]) for s in output["sections"]}) == 198
text = json.dumps(output, ensure_ascii=False, indent=2) + "\n"
(ROOT / "src/data/free-library-content.json").write_text(text)
print(f"Imported {len(output['sections'])} sections; lab/merged duplicate verified; {len(text)} characters")
