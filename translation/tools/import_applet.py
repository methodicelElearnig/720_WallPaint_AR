#!/usr/bin/env python3
"""import_applet.py — Arabic build of applet/color_lab.html.

The applet is JSX inside a <script type="text/babel"> block, so this is a
targeted string swap (same approach extract_translations.py used to read it),
each replacement keyed to its manifest ID and required to hit exactly once.
"""
import json, re
from pathlib import Path

SRC = Path('src/applet/color_lab.html')
OUT = Path('out/applet/color_lab.html')
MANIFEST = Path('/mnt/user-data/uploads/ציור קיר/720_WallPaint 2/720_WallPaint/translation/export/murals_translation_manifest.json')

AR = json.load(open('ar_from_docx.json'))
man = json.load(open(MANIFEST))
pairs = [(e['id'], e['source']) for e in man['entries'] if e['screen'] == 'APPLET']

html = SRC.read_text(encoding='utf-8')

# language + Arabic webfont
html = html.replace('<html lang="he" dir="rtl">', '<html lang="ar" dir="rtl">', 1)
html = html.replace("--font: 'Assistant', Arial, sans-serif;",
                    "--font: 'Cairo', 'Segoe UI', Arial, sans-serif;", 1)
assert '<head>' in html
html = html.replace(
    '<head>',
    '<head>\n  <link href="https://fonts.googleapis.com/css2?'
    'family=Cairo:wght@400;600;700&display=swap" rel="stylesheet">', 1)

problems = []
# longest first, so "צבע צהוב (כוסות)" is not clipped by a shorter substring
for mid, he in sorted(pairs, key=lambda p: -len(p[1])):
    ar = AR.get(mid, '')
    if not ar:
        problems.append(f'{mid}: no Arabic'); continue
    n = html.count(he)
    if n != 1:
        problems.append(f'{mid}: source found {n}x — {he!r}')
        if n == 0:
            continue
    html = html.replace(he, ar)

OUT.parent.mkdir(parents=True, exist_ok=True)
OUT.write_text(html, encoding='utf-8')

left = [l.strip()[:120] for l in html.split('\n') if re.search(r'[֐-׿]', l)]
print(f'replaced {len(pairs) - len(problems)} / {len(pairs)} applet strings')
print('problems:', problems or 'none')
print('Hebrew lines left:', left or 'none')
