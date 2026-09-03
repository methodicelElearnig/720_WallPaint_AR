#!/usr/bin/env python3
"""Audit the translator's DOCX for rows where the Arabic does not belong to the
Hebrew it sits next to — the fingerprint of a column pasted one row off.

Signal: the Arabic in row N is, elsewhere in the document, the accepted
translation of the Hebrew in a NEARBY row (N±1, N±2). A single such row is
noise; a run of them is a shifted block.

Arabic duals ("لترَيْن" for 2 litres) legitimately drop digits, so a digit
comparison is reported separately and only when the Arabic gains a digit the
Hebrew never had.
"""
import json, re
from collections import Counter, defaultdict

MANIFEST = ('/mnt/user-data/uploads/ציור קיר/720_WallPaint 2/'
            '720_WallPaint/translation/export/murals_translation_manifest.json')
man = json.load(open(MANIFEST))
ar = json.load(open('/home/claude/work/ar_from_docx.json'))
rows = [(e['id'], e['source'], ar.get(e['id'], '')) for e in man['entries']]
byid = {e['id']: e for e in man['entries']}

votes = defaultdict(Counter)
for _, he, a in rows:
    if a:
        votes[he][a] += 1
major = {he: c.most_common(1)[0][0] for he, c in votes.items()}
owner = defaultdict(set)
for he, a in major.items():
    owner[a].add(he)

displaced = []
for i, (rid, he, a) in enumerate(rows):
    if not a:
        displaced.append((i, rid, 'EMPTY'))
        continue
    others = owner.get(a, set()) - {he}
    if not others:
        continue
    for d in (-1, 1, -2, 2):
        j = i + d
        if 0 <= j < len(rows) and rows[j][1] in others:
            displaced.append((i, rid, f'holds the Arabic for {rows[j][0]} ({d:+d})'))
            break

print(f'{len(rows)} rows checked — {len(displaced)} sit next to the wrong Hebrew\n')
prev = None
for i, rid, why in displaced:
    e = byid[rid]
    if prev is not None and i != prev + 1:
        print('   ' + '-' * 60)
    prev = i
    print(f'{rid:26} [{e["screen"]}]  {why}')
    print(f'   HE {e["source"][:64]}')
    print(f'   AR {ar.get(rid, "")[:64]}')

print('\n\nArabic that gained a digit its Hebrew never had:')
extra = 0
for rid, he, a in rows:
    dh, da = Counter(re.findall(r'\d', he)), Counter(re.findall(r'\d', a))
    gained = da - dh
    if gained:
        extra += 1
        print(f'   {rid:26} +{sorted(gained.elements())}  HE {he[:40]}  AR {a[:40]}')
if not extra:
    print('   none')
