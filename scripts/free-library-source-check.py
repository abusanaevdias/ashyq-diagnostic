"""Read-only source fidelity audit: every migrated section's words and PDF digests."""
import hashlib
import json
import re
from collections import Counter
from pathlib import Path
import pdfplumber

ROOT = Path(__file__).resolve().parents[1]
data = json.loads((ROOT / 'src/data/free-library-content.json').read_text())
paths = {'library': 'ashyq-ielts-free-library-v3.pdf', 'lab': 'ashyq-writing-upgrade-lab-v3.pdf', 'workbook': 'ashyq-writing-workbook-v3.pdf'}
pdfs = {}
for source, name in paths.items():
    path = ROOT / 'public/library/pdf' / name
    assert hashlib.sha256(path.read_bytes()).hexdigest() == data['sources'][source]['sha256']
    pdfs[source] = pdfplumber.open(path)
    assert len(pdfs[source].pages) == data['sources'][source]['pages']

def tokens(text):
    return Counter(re.findall(r'[^\W_]+', text.lower(), re.UNICODE))

failures = []
for section in data['sections']:
    page = pdfs[section['source']].pages[section['page'] - 1]
    lines = [line for line in page.extract_text_lines() if 40 < line['top'] < page.height - 38]
    # Visual-only labels deliberately replaced with accessible SVG/table/flow.
    if section['source'] == 'library':
        lines = [line for line in lines if not ((section['page'] == 51 and 228 < line['top'] < 350) or (section['page'] == 61 and 200 < line['top'] < 295))]
    expected = tokens(' '.join(line['text'] for line in lines).replace(' / ASHYQ OPEN PRACTICE', ''))
    parts = [section['code'], section['title'], section['subtitle']]
    for block in section['blocks']:
        parts.append(block.get('text', ''))
        parts.extend(cell for row in block.get('rows', []) for cell in row)
    actual = tokens(' '.join(parts))
    missing, extra = expected - actual, actual - expected
    if missing or extra:
        failures.append((section['source'], section['code'], dict(missing), dict(extra)))
if failures:
    for failure in failures:
        print(failure)
    raise SystemExit(f'{len(failures)} section(s) differ from source words')
print(f'PASS: all {len(data["sections"])} migrated sections preserve source words; three original PDF digests/pages match')
