#!/usr/bin/env python3
"""
finish_html.py — the pieces the manifest walk deliberately did not cover.

  1. <html lang> + <title>
  2. Arabic webfont (Cairo) in place of Assistant
  3. img alt="" values the extractor skipped because they duplicated their
     parent button's aria-label — sync them to the (now Arabic) aria-label
  4. Q1 drag-and-drop word keys: the chip's visible label doubles as the JS
     matching value, so data-word, both inline handlers, the label span and
     Q1_CORRECT_ANSWERS must move to Arabic together.
"""
import re
from pathlib import Path
from bs4 import BeautifulSoup

HTML = Path('out/index.html')
DRAG = Path('out/dragdrop.js')

# Hebrew word key -> Arabic (from MURALS-Q1-CHIP-01..04 in the DOCX)
Q1_WORDS = {
    'כחול':        'الأزرق',
    'צהוב':        'الأصفر',
    'חמים ובהיר':  'الدافئ والفاتح',
    'קריר וכהה':   'البارد والغامق',
}

AR_TITLE = 'رسم جداريّ — برنامج 720'

soup = BeautifulSoup(HTML.read_text(encoding='utf-8'), 'html.parser')

# 1 ── language + document title ─────────────────────────────────────────
html_tag = soup.find('html')
html_tag['lang'] = 'ar'
html_tag['dir'] = 'rtl'
soup.find('title').string = AR_TITLE

# 2 ── Arabic webfont ────────────────────────────────────────────────────
for link in soup.find_all('link', href=True):
    if 'fonts.googleapis.com' in link['href']:
        link['href'] = ('https://fonts.googleapis.com/css2?'
                        'family=Cairo:wght@400;600;700&'
                        'family=Open+Sans:wght@700&display=swap')

# 3 ── alt text that mirrors its button's aria-label ─────────────────────
synced = 0
for img in soup.find_all('img', alt=True):
    if not re.search(r'[֐-׿]', img['alt']):
        continue
    p, hops = img.parent, 0
    while p is not None and hops < 3:
        label = p.get('aria-label') if hasattr(p, 'get') else None
        if label:
            img['alt'] = label
            synced += 1
            break
        p, hops = p.parent, hops + 1

# 4 ── Q1 word keys ──────────────────────────────────────────────────────
out = str(soup)
for he, ar in Q1_WORDS.items():
    for pat, rep in (
        (f'data-word="{he}"',            f'data-word="{ar}"'),
        (f"q1DragStart(event,'{he}')",   f"q1DragStart(event,'{ar}')"),
        (f"q1ChipClick(event,'{he}')",   f"q1ChipClick(event,'{ar}')"),
    ):
        out = out.replace(pat, rep)
HTML.write_text(out, encoding='utf-8')

js = DRAG.read_text(encoding='utf-8')
js = js.replace(
    "const Q1_CORRECT_ANSWERS = { 1: '5', 2: 'כחול', 3: 'קריר וכהה' };",
    "const Q1_CORRECT_ANSWERS = { 1: '5', 2: 'الأزرق', 3: 'البارد والغامق' };\n"
    "/* AR build: these values are the chips' visible Arabic labels — they must\n"
    "   stay byte-identical to data-word / q1DragStart / q1ChipClick in index.html. */"
)
DRAG.write_text(js, encoding='utf-8')

print(f'alt synced: {synced}')
print('remaining Hebrew attrs in index.html:',
      len(re.findall(r'(?:data-word|alt|aria-label)="[^"]*[֐-׿]', out)))
print('dragdrop.js answer key ->',
      re.search(r'const Q1_CORRECT_ANSWERS = .*', js).group(0))
