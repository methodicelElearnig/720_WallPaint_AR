#!/usr/bin/env python3
"""
verify_coverage.py — independent sanity sweep for extract_translations.py

Walks every individual text node (NOT comments, NOT script/style) inside
each .screen section and inside applet/color_lab.html, and checks that its
Hebrew-bearing content is captured as a substring of *some* manifest entry.
Anything left over is printed so a human can decide whether it was rightly
excluded (e.g. it was a dev comment) or is a real miss.
"""
import json
import re
from pathlib import Path
from bs4 import BeautifulSoup, NavigableString, Comment

ROOT = Path(__file__).resolve().parents[2]
HEBREW_RE = re.compile(r"[֐-׿]")
WS_RE = re.compile(r"\s+")


def norm(t):
    return WS_RE.sub(" ", t).strip()


def has_hebrew(t):
    return bool(HEBREW_RE.search(t))


manifest = json.loads((ROOT / "translation/export/murals_translation_manifest.json").read_text(encoding="utf-8"))
all_source_text = norm(" \x00 ".join(e["source"] for e in manifest["entries"]))

html = (ROOT / "index.html").read_text(encoding="utf-8")
soup = BeautifulSoup(html, "html.parser")

EXCLUDED_IDS = {"popup-adjuster"}

misses = []
for section in soup.find_all("section", class_="screen"):
    for node in section.find_all(string=True):
        if isinstance(node, Comment):
            continue
        if node.parent and node.parent.name in ("script", "style"):
            continue
        anc = node.parent
        excluded = False
        while anc is not None:
            if anc.get("id") in EXCLUDED_IDS:
                excluded = True
                break
            anc = anc.parent
        if excluded:
            continue
        text = norm(str(node))
        if not text or not has_hebrew(text):
            continue
        if text not in all_source_text:
            misses.append((section.get("id"), text))

# also check global containers explicitly (score popup, applet overlays, zoom overlay)
GLOBAL_IDS = ["score-popup-overlay", "s5-zoom-overlay", "q2-applet-overlay",
              "q3-applet-overlay", "q4-applet-overlay", "q4b-applet-overlay",
              "q4c-applet-overlay", "q5-applet-overlay"]
for gid in GLOBAL_IDS:
    container = soup.find(id=gid)
    if not container:
        continue
    for node in container.find_all(string=True):
        if isinstance(node, Comment):
            continue
        if node.parent and node.parent.name in ("script", "style"):
            continue
        text = norm(str(node))
        if not text or not has_hebrew(text):
            continue
        if text not in all_source_text:
            misses.append((gid, text))

# attributes sweep (alt/aria-label/title/placeholder) across whole doc
for el in soup.find_all(True):
    if el.name in ("script", "style"):
        continue
    if el.get("id") in EXCLUDED_IDS:
        continue
    for attr in ("alt", "aria-label", "title", "placeholder"):
        val = el.get(attr)
        if not val or not has_hebrew(val):
            continue
        val = norm(val)
        if val not in all_source_text:
            misses.append((f"[attr:{attr}] {el.name}", val))

print(f"index.html: {len(misses)} unmatched Hebrew fragments")
for loc, text in misses:
    print(f"  {loc!r:30} {text[:80]!r}")

# applet/color_lab.html — this is a heuristic, best-effort static check for a
# JSX file (BeautifulSoup can't parse JSX as DOM). It mirrors the same three
# regex passes extract_translations.py uses (plain JSX text, text immediately
# before a `{expr}`, and Hebrew string literals inside a simple ternary), so
# it independently re-derives the "expected" set rather than trusting the
# extractor's own output — but a pattern neither script's regexes anticipate
# would still be missed by both. Live interaction testing of the applet
# in a browser remains the authoritative check; this script already caught
# one real gap (סה"כ כוסות: {total} and a ternary's two branches) that the
# simple >text< regex alone could not see.
applet_html = (ROOT / "applet/color_lab.html").read_text(encoding="utf-8")
applet_misses = []
for m in re.finditer(r">\s*([^<>{}\n]*[֐-׿][^<>{}\n]*?)\s*<", applet_html):
    text = norm(m.group(1))
    if text and text not in all_source_text:
        applet_misses.append(text)
for m in re.finditer(r">\s*([^<>{}\n]*[֐-׿][^<>{}\n]*?)\s*\{", applet_html):
    text = norm(m.group(1))
    if text and text not in all_source_text:
        applet_misses.append(text)
ternary_re = re.compile(
    r"\{[^{}]*?\?\s*(['\"])([^'\"]*[֐-׿][^'\"]*)\1\s*:\s*(['\"])([^'\"]*[֐-׿][^'\"]*)\3[^{}]*?\}"
)
for m in ternary_re.finditer(applet_html):
    for branch_text in (m.group(2), m.group(4)):
        text = norm(branch_text)
        if text and text not in all_source_text:
            applet_misses.append(text)
title_m = re.search(r"<title>([^<]*)</title>", applet_html)
if title_m and has_hebrew(title_m.group(1)) and norm(title_m.group(1)) not in all_source_text:
    applet_misses.append(norm(title_m.group(1)))

print(f"\napplet/color_lab.html: {len(set(applet_misses))} unmatched Hebrew fragments")
for text in set(applet_misses):
    print(f"  {text[:80]!r}")
