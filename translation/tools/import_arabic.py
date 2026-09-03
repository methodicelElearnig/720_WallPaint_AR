#!/usr/bin/env python3
"""
import_arabic.py — build the Arabic index.html from the Hebrew source + the
translator's DOCX.

Mirrors extract_translations.py's DOM walk exactly, so every unit it visits
corresponds 1:1 to a manifest row (verified: 350 units, 0 unmatched). Each
unit is then rewritten in Arabic:

  * plain text element            -> replace its text
  * alt / aria-label / title      -> replace the attribute
  * element with inline markup    -> handled by an explicit RECIPES entry so
                                     bold runs, <br> line breaks and LTR
                                     ratio spans survive translation
Nothing is replaced unless its manifest ID has a non-empty Arabic string.
"""
import json, re, sys
from pathlib import Path
from bs4 import BeautifulSoup, NavigableString, Comment, Tag
sys.path.insert(0, '.')
import extract_translations as X

SRC = Path('src/index.html')
OUT = Path('out/index.html')
MANIFEST = Path('/mnt/user-data/uploads/ציור קיר/720_WallPaint 2/720_WallPaint/translation/export/murals_translation_manifest.json')

AR = json.load(open('ar_from_docx.json'))

# ── Alignment repair ─────────────────────────────────────────────────────
# In the translator's Word file the Arabic column is pasted one row out of
# step with the Hebrew in two blocks, so each row carries its neighbour's
# translation. Confirmed by audit_alignment.py: the Hebrew column matches the
# manifest on all 381 rows, and every displaced Arabic string is the accepted
# translation of an adjacent row's Hebrew.
#
#   SLIDE8 (whole screen) — Arabic sits one row too high
#   Q6 (from FBINCORR-01 to the end) — Arabic sits one row too low
#
# Each entry re-points an ID at the cell that actually holds its translation.
TAKE_FROM = {
    # SLIDE8 — shift back down
    'MURALS-SLIDE8-NARR-02': 'MURALS-SLIDE8-NARR-01',
    'MURALS-SLIDE8-NARR-03': 'MURALS-SLIDE8-NARR-02',
    'MURALS-SLIDE8-NAV-01':  'MURALS-SLIDE8-NARR-03',
    'MURALS-SLIDE8-NAV-02':  'MURALS-SLIDE8-NAV-01',
    # Q6 — shift back up
    'MURALS-Q6-FBINCORR-01': 'MURALS-Q6-FBINCORR-02',
    'MURALS-Q6-FBINCORR-02': 'MURALS-Q6-FBINCORR-03',
    'MURALS-Q6-FBINCORR-03': 'MURALS-Q6-FBINCORR-04',
    'MURALS-Q6-FBINCORR-04': 'MURALS-Q6-FBINCORR-05',
    'MURALS-Q6-FBINCORR-05': 'MURALS-Q6-ALT-01',
    'MURALS-Q6-ALT-01':      'MURALS-Q6-HELPBTN-01',
    'MURALS-Q6-HELPBTN-01':  'MURALS-Q6-CLOSE-01',
    'MURALS-Q6-CLOSE-01':    'MURALS-Q6-SUBMIT-01',
    'MURALS-Q6-SUBMIT-01':   'MURALS-Q6-NAV-01',
    'MURALS-Q6-NAV-01':      'MURALS-Q6-NAV-02',
    # ── ends of the shifted runs: the translation fell off the edge, so take
    #    it from a row elsewhere whose Hebrew is character-for-character the same
    'MURALS-Q6-NAV-02':      'MURALS-Q5-NAV-02',        # "חזרה"
    'MURALS-Q5-FBINCORR-01': 'MURALS-Q2-FBINCORR-01',   # "זו טעות. התשובה הנכונה מסומנת."
}

# The one line with no Arabic anywhere in the Word file — it fell off the top
# of the SLIDE8 shift. Drafted from its context (the two lines that follow it
# are translated and continue the same sentence) and FLAGGED FOR REVIEW: the
# character name גל has no established Arabic form, since this is her only
# appearance in the unit.
DRAFTED = {
    'MURALS-SLIDE8-NARR-01':
        'ذكّرَتْ جنى أصدقاءها بأنّ هناك درجات أخرى مِن اللون الأخضر',
}

# ── Explicit recipes for the 62 units whose element carries inline markup ──
# 'direct'  : replace only the element's own Hebrew text nodes (keeps child tags)
# 'inner'   : the named child tag wraps the whole string -> rewrite inside it
# 'nobr'    : Hebrew <br> were Figma layout wraps mid-sentence -> drop them,
#             let the Arabic wrap naturally inside the same box
# 'lines'   : Hebrew <br> were real line separators -> keep them, splitting the
#             Arabic at the given line-start markers
# 'bold'    : substring of the Arabic to wrap in <strong>
# 'ltr'     : substrings to wrap in <span dir="ltr"> (numeric ratios/equations)
# 'spans'   : rebuild as a sequence of (css-class, substring) spans
# 'text'    : use this literal instead of the DOCX string
RECIPES = {
    # slide3 — bold lead-in phrase
    'MURALS-SLIDE3-NARR-03': {'bold': 'الألوان الدافئة'},
    'MURALS-SLIDE3-NARR-04': {'bold': 'الألوان الباردة'},
    'MURALS-SLIDE3-NARR-05': {'bold': 'عند مزْج الألوان،'},
    # whole paragraph inside <strong>
    'MURALS-Q1-FBCORR-01':   {'inner': 'strong'},
    'MURALS-Q1-FBINCORR-01': {'inner': 'strong'},
    'MURALS-SLIDE5-NARR-03': {'inner': 'strong'},
    'MURALS-Q3-NARR-02':     {'inner': 'strong'},
    'MURALS-Q3-Q-01':        {'inner': 'strong'},
    'MURALS-Q4-Q-01':        {'inner': 'strong', 'nobr': True},
    'MURALS-Q4B-Q-01':       {'inner': 'strong'},
    'MURALS-Q4C-Q-01':       {'inner': 'strong'},
    'MURALS-Q5-Q-01':        {'inner': 'strong'},
    # "…, <button>try again</button>" — only the lead-in text is this unit
    'MURALS-Q1-FBTRY-01':  {'direct': True},
    'MURALS-Q2-FBTRY-01':  {'direct': True},
    'MURALS-Q3-FBTRY-01':  {'direct': True},
    'MURALS-Q4-FBTRY-01':  {'direct': True},
    'MURALS-Q4B-FBTRY-01': {'direct': True},
    'MURALS-Q4C-FBTRY-01': {'direct': True},
    'MURALS-Q5-FBTRY-01':  {'direct': True},
    'MURALS-Q6-FBTRY-01':  {'direct': True},
    'MURALS-Q7-FBTRY-01':  {'direct': True},
    # q7b: Hebrew put the full stop after the button; the Arabic retry label
    # already ends in one, so the lead-in takes the comma and the stray "."
    # after the button is dropped.
    'MURALS-Q7B-FBTRY-01': {'direct': True, 'text': 'هذه لَيْسَت الإجابة، ', 'drop_tail': True},
    # zoom CTA: the 🔍 lives in its own decorative span, so it must not be
    # repeated in the text run
    'MURALS-SLIDE5-APPBTN-01': {'direct': True, 'text': ' اُنقُروا هنا لفتح التطبيق بالحجم الكامل'},
    # yes/no buttons: text node followed by an empty ✓ span
    'MURALS-SLIDE5-OPT-01': {'direct': True},
    'MURALS-SLIDE5-OPT-02': {'direct': True},
    'MURALS-SLIDE5-OPT-03': {'direct': True},
    'MURALS-SLIDE5-OPT-04': {'direct': True},
    # bold run inside a sentence
    'MURALS-Q2-Q-02':  {'bold': 'هل هو على صواب؟'},
    'MURALS-Q3-NARR-01': {'bold': '2 : 3'},
    'MURALS-Q4-Q-02':  {'bold': 'كلّ الإجابات'},
    'MURALS-Q4B-Q-02': {'bold': 'التمارين أو المعادلات'},
    # LTR-locked numeric ratios
    'MURALS-Q2-FBCORR-04':   {'ltr': ['15 : 10', '3 : 2']},
    'MURALS-Q2-FBINCORR-04': {'ltr': ['15 : 10', '3 : 2']},
    # layout-only <br> (mid-sentence Figma wraps) -> drop
    'MURALS-Q2-HINT-01':  {'nobr': True},
    'MURALS-Q3-HINT-01':  {'nobr': True},
    'MURALS-Q5-HINT-01':  {'nobr': True},
    'MURALS-Q6-HINT-01':  {'nobr': True},
    'MURALS-Q7-HINT-01':  {'nobr': True},
    'MURALS-Q7B-HINT-01': {'nobr': True},
    'MURALS-Q4-NARR-02':  {'nobr': True}, 'MURALS-Q4-NARR-03': {'nobr': True},
    'MURALS-Q4-NARR-04':  {'nobr': True}, 'MURALS-Q4-NARR-05': {'nobr': True},
    'MURALS-Q4B-NARR-02': {'nobr': True}, 'MURALS-Q4B-NARR-03': {'nobr': True},
    'MURALS-Q4B-NARR-04': {'nobr': True}, 'MURALS-Q4B-NARR-05': {'nobr': True},
    'MURALS-Q4C-NARR-02': {'nobr': True}, 'MURALS-Q4C-NARR-03': {'nobr': True},
    'MURALS-Q4C-NARR-04': {'nobr': True}, 'MURALS-Q4C-NARR-05': {'nobr': True},
    # real multi-line blocks -> keep the line structure
    'MURALS-Q4B-HINT-01': {'lines': ['بِكَم ضِعف ازداد؟', 'هل أضَفْنا 14 لترًا']},
    'MURALS-Q4C-HINT-01': {'lines': ['بِكَم ضِعف ازداد؟', 'هل أضَفْنا 14 لترًا']},
    'MURALS-Q4B-FBCORR-02':   {'lines': ['"أ" هو التمثيل', '"ب" هو تمثيل', 'مِن المهمّ أنْ نتذكّر']},
    'MURALS-Q4B-FBINCORR-02': {'lines': ['"أ" هو التمثيل', '"ب" هو تمثيل', 'مِن المهمّ أنْ نتذكّر']},
    'MURALS-Q4C-FBCORR-02':   {'lines': ['عامل التوسيع هو 8'], 'ltr': ['8 · 3 = 24']},
    'MURALS-Q4C-FBINCORR-02': {'lines': ['عامل التوسيع هو 8'], 'ltr': ['8 · 3 = 24']},
    'MURALS-Q5-FBCORR-02':    {'lines': ['في الخليط "أ"، يشكّل']},
    'MURALS-Q5-FBINCORR-02':  {'lines': ['في الخليط "أ"، يشكّل']},
    # two styled spans (bold question number + semibold body)
    'MURALS-Q7-Q-01':  {'spans': [('q7-bold', '7. أ. '), ('q7-semibold', None)]},
    'MURALS-Q7B-Q-01': {'spans': [('q7b-bold', '7. ب. '), ('q7b-semibold', None)]},
    'MURALS-Q7B-Q-04': {'spans': [('q7b-semibold', 'نُذكّرُكُم بأنّ نسبة الخليط هي '),
                                  ('q7b-semibold', None)]},
}

problems = []


def set_plain(el, text, soup, recipe):
    """Rewrite el's children as Arabic, honouring bold / ltr / lines."""
    lines = [text]
    if recipe.get('lines'):
        lines = []
        rest = text
        for marker in recipe['lines']:
            i = rest.find(marker)
            if i < 0:
                problems.append(f"line marker not found: {marker!r} in {text[:60]!r}")
                continue
            lines.append(rest[:i].strip())
            rest = rest[i:]
        lines.append(rest.strip())

    new_children = []
    for n, line in enumerate(lines):
        if n:
            new_children.append(soup.new_tag('br'))
        new_children.extend(_render_line(line, soup, recipe))
    el.clear()
    for c in new_children:
        el.append(c)


def _render_line(line, soup, recipe):
    """Split one line into text nodes + <strong>/<span dir=ltr> wrappers."""
    marks = []  # (start, end, tagname, attrs)
    if recipe.get('bold') and recipe['bold'] in line:
        i = line.find(recipe['bold'])
        marks.append((i, i + len(recipe['bold']), 'strong', {}))
    for frag in recipe.get('ltr', []):
        i = line.find(frag)
        if i >= 0:
            marks.append((i, i + len(frag), 'span', {'dir': 'ltr'}))
    marks.sort()
    out, pos = [], 0
    for s, e, name, attrs in marks:
        if s < pos:
            continue
        if line[pos:s]:
            out.append(NavigableString(line[pos:s]))
        t = soup.new_tag(name, **attrs)
        t.string = line[s:e]
        out.append(t)
        pos = e
    if line[pos:]:
        out.append(NavigableString(line[pos:]))
    return out


def set_direct(el, text, recipe):
    """Replace the element's own Hebrew text nodes, leaving child tags alone."""
    heb_nodes = [c for c in el.contents
                 if isinstance(c, NavigableString) and not isinstance(c, Comment)
                 and X.HEBREW_RE.search(c)]
    if not heb_nodes:
        problems.append(f"direct: no Hebrew text node in {str(el)[:80]}")
        return
    heb_nodes[0].replace_with(NavigableString(text + ' '))
    for extra in heb_nodes[1:]:
        extra.replace_with(NavigableString(''))
    if recipe.get('drop_tail'):
        for c in list(el.contents):
            if isinstance(c, NavigableString) and c.strip() == '.':
                c.replace_with(NavigableString(' '))


def set_spans(el, text, soup, recipe):
    el.clear()
    rest = text
    specs = recipe['spans']
    for n, (cls, frag) in enumerate(specs):
        if frag is None:
            piece, rest = rest, ''
        else:
            if not rest.startswith(frag):
                i = rest.find(frag)
                if i < 0:
                    problems.append(f"span fragment not found: {frag!r}")
                    piece, rest = rest, ''
                else:
                    piece, rest = rest[:i + len(frag)], rest[i + len(frag):]
            else:
                piece, rest = frag, rest[len(frag):]
        t = soup.new_tag('span', **{'class': cls})
        t.string = piece
        el.append(t)


def main():
    man = json.load(open(MANIFEST))
    by_key = {}
    for e in man['entries']:
        by_key.setdefault((e['screen'], e['type'], e['source']), []).append(e['id'])

    # Repair the two misaligned blocks, reading every value from a snapshot so
    # the corrections cannot cascade into each other.
    snapshot = dict(AR)
    for target, source in TAKE_FROM.items():
        AR[target] = snapshot[source]
    AR.update(DRAFTED)

    soup = BeautifulSoup(SRC.read_text(encoding='utf-8'), 'html.parser')

    units = []
    for screen_id, idx, ctype, label in X.SCREENS:
        section = soup.find('section', id=f'screen-{screen_id}')
        for el, text, kind in X.extract_screen(section, screen_id):
            d = kind if kind in ('image-alt-text', 'aria-label', 'placeholder') else 'text'
            units.append((el, text, kind, screen_id, X.classify_type(el, section, default=d)))
    for cid, sid, ft in X.GLOBAL_CONTAINERS:
        c = soup.find(id=cid)
        for el, text, kind in X.extract_global_container(c, sid, ft):
            d = kind if kind in ('image-alt-text', 'aria-label', 'placeholder') else ft
            units.append((el, text, kind, sid, X.classify_type(el, c, default=d)))

    used, applied, skipped = {}, [], []
    for el, text, kind, sid, tname in units:
        key = (sid, tname, text)
        ids = by_key.get(key)
        if not ids:
            problems.append(f"NO MANIFEST ROW: {key}")
            continue
        i = used.get(key, 0); used[key] = i + 1
        mid = ids[min(i, len(ids) - 1)]
        recipe = RECIPES.get(mid, {})
        ar = recipe.get('text') or AR.get(mid, '')
        if not ar:
            skipped.append((mid, text))
            continue

        if kind in ('image-alt-text', 'aria-label', 'placeholder'):
            attr = {'image-alt-text': 'alt', 'aria-label': None, 'placeholder': 'placeholder'}[kind] \
                   if kind != 'aria-label' else None
            if kind == 'aria-label':
                for a in ('aria-label', 'title'):
                    if el.get(a) and X.norm(el[a]) == text:
                        el[a] = ar
            else:
                el[attr] = ar
            applied.append(mid); continue

        if recipe.get('direct') or kind == 'leftover':
            set_direct(el, ar, recipe)
        elif recipe.get('spans'):
            set_spans(el, ar, soup, recipe)
        else:
            target = el
            if recipe.get('inner'):
                child = el.find(recipe['inner'])
                if child is None:
                    problems.append(f"inner {recipe['inner']} missing for {mid}")
                else:
                    target = child
            set_plain(target, ar, soup, recipe)
        applied.append(mid)

    OUT.parent.mkdir(exist_ok=True)
    OUT.write_text(str(soup), encoding='utf-8')
    print(f"applied {len(applied)} / {len(units)} units")
    if skipped:
        print(f"skipped (no Arabic): {len(skipped)}")
        for mid, t in skipped: print('   ', mid, t[:60])
    if problems:
        print(f"!! PROBLEMS: {len(problems)}")
        for p in problems: print('   ', p)
    else:
        print("no problems")


if __name__ == '__main__':
    main()
