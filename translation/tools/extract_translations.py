#!/usr/bin/env python3
"""
extract_translations.py — Murals (ציורי קיר) translation export

Extracts learner-facing Hebrew text from index.html + applet/color_lab.html
into a stable, machine-readable manifest for professional Arabic translation.

Usage:
    python3 translation/tools/extract_translations.py

Regenerate any time the Hebrew source (index.html / applet/color_lab.html)
changes. IDs are stable across regeneration: if an existing manifest is
found at translation/export/murals_translation_manifest.json, matching
entries (same screen + type + Hebrew source text) keep their ID and any
Arabic translation already entered. Entries whose source text changed or
disappeared are moved to "orphaned" instead of being silently deleted, so
in-progress translations are never lost silently.

Does NOT touch any learner-facing file. Read-only against the project;
only writes into translation/export/.
"""
import json
import re
import sys
from pathlib import Path
from bs4 import BeautifulSoup, NavigableString, Comment

ROOT = Path(__file__).resolve().parents[2]
INDEX_HTML = ROOT / "index.html"
APPLET_HTML = ROOT / "applet" / "color_lab.html"
EXPORT_DIR = ROOT / "translation" / "export"
MANIFEST_PATH = EXPORT_DIR / "murals_translation_manifest.json"

HEBREW_RE = re.compile(r"[֐-׿]")
WS_RE = re.compile(r"\s+")

INLINE_FORMAT_TAGS = {"strong", "b", "em", "i", "sup", "sub", "u", "wbr", "br"}

# Tags whose entire purpose is a single run of prose — when one of these has
# 2+ <span>/<a> children that each independently contain Hebrew, they're
# almost always the same sentence split across styling runs (e.g. a bold
# "7. א. " lead-in span next to a regular-weight continuation span), not
# separate translation units. Merging them here fixes real fragmentation
# bugs (confirmed in Q7/Q7B) without touching container tags like <div>,
# where sibling spans are frequently genuinely distinct UI pieces (e.g. a
# question label next to a button group).
PROSE_CONTAINER_TAGS = {"p", "li", "td", "th"}
INLINE_PHRASING_TAGS = {"span", "a"}

# Elements/ids that are developer/debug tooling and must NEVER be exported,
# even though they may contain Hebrew text.
EXCLUDED_IDS = {"popup-adjuster"}

# ── Screen architecture (matches ARCHITECTURE.md — 17 screens, in order) ──
SCREENS = [
    ("slide1",  0,  "video",             "פתיחה — סתיו נכנסת לכיתה (וידאו)"),
    ("slide2",  1,  "slide",             "פתיחה — בחירת ציור חוף טרופי"),
    ("slide3",  2,  "video",             "המורה מסבירה על צבעים חמים/קרים (וידאו)"),
    ("q1",      3,  "question-dragdrop", "שאלה 1 — השלמת משפטים על יחס צבעים"),
    ("slide5",  4,  "slide-applet",      "היכרות עם יישומון מעבדת חקר הצבעים"),
    ("q2",      5,  "question-radio",    "שאלה 2 — שמירת יחס בתוספת כמות צבע"),
    ("q3",      6,  "question-radio",    "שאלה 3 — יחס חדש אחרי שפיכת צבע"),
    ("q4",      7,  "question-radio",    "שאלה 4.א — בחירת משוואת פרופורציה"),
    ("q4b",     8,  "question-radio",    "שאלה 4.ב — בחירת תרגיל לפתרון"),
    ("q4c",     9,  "question-numeric",  "שאלה 4.ג — כמה ליטר כחול להוסיף"),
    ("slide8",  10, "slide",             "ילדה מציגה את הציור"),
    ("q5",      11, "question-radio",    "שאלה 5 — השוואת יחסי צהוב בין תערובות"),
    ("slide10", 12, "video",             "הילדים ליד הקיר האמיתי (וידאו)"),
    ("q6",      13, "question-radio",    "שאלה 6 — גובה עץ בקנה מידה 1:20"),
    ("q7",      14, "question-dragdrop", "שאלה 7.א — נוסחת כמויות בשיטת המנות"),
    ("q7b",     15, "question-dragdrop", "שאלה 7.ב — חישוב ליטרים לפי מנות"),
    ("slide18", 16, "video-end",         "סיום — סרטון סגירה ופופאפ ציון"),
]
SCREEN_ORDER = {sid: i for i, (sid, _, _, _) in enumerate(SCREENS)}
SCREEN_META = {sid: (idx, ctype, label) for sid, idx, ctype, label in SCREENS}

# Global (outside any .screen) containers that ARE learner-facing,
# mapped to the screen they conceptually belong to.
GLOBAL_CONTAINERS = [
    ("score-popup-overlay", "slide18", "popup"),
    ("s5-zoom-overlay",     "slide5",  "modal"),
    ("q2-applet-overlay",   "q2",      "applet-modal"),
    ("q3-applet-overlay",   "q3",      "applet-modal"),
    ("q4-applet-overlay",   "q4",      "applet-modal"),
    ("q4b-applet-overlay",  "q4b",     "applet-modal"),
    ("q4c-applet-overlay",  "q4c",     "applet-modal"),
    ("q5-applet-overlay",   "q5",      "applet-modal"),
]

TYPE_RULES = [
    # (substring found in element's own class or ancestor class within screen, type)
    ("nav-next",        "nav-button"),
    ("nav-prev",        "nav-button"),
    ("nav-btn",         "nav-button"),
    ("retry-btn",       "retry-button"),
    ("tryagain-action", "retry-button"),
    ("submit-btn",      "submit-button"),
    ("help-btn",        "help-button"),
    ("help-close-btn",  "close-button"),
    ("help-popup-close-btn", "close-button"),
    ("app-btn",         "applet-button"),
    ("zoom-cta",        "applet-button"),
    ("phone-hotspot",   "applet-button"),
    ("yn-btn",          "option"),
    ("applet-close-btn","close-button"),
    ("zoom-close-btn",  "close-button"),
    ("score-popup-close","close-button"),
    ("play-btn",        "play-button"),
    ("done-btn",        "done-button"),
    ("help-popup",      "hint"),
    ("help-text",       "hint"),
    ("tryagain-msg",    "feedback-tryagain"),
    ("tryagain-text",   "feedback-tryagain"),
    ("fb-correct",      "feedback-correct"),
    ("feedback-correct-text", "feedback-correct"),
    ("fb-incorrect",    "feedback-incorrect"),
    ("feedback-incorrect-text", "feedback-incorrect"),
    ("-question",       "question"),
    ("-q-sub",          "question"),
    ("instruction",     "instruction"),
    ("opt-text",        "option"),
    ("chip-label",      "word-bank-chip"),
    ("drop-label",      "answer-drop-target"),
    ("score-popup-title", "popup-text"),
    ("score-popup-score-label", "popup-text"),
    ("litrim",          "label"),
    ("stem",            "sentence-stem"),
    ("label",           "label"),
    ("-story",          "narration"),
    ("-narration",      "narration"),
    ("bubble",          "dialogue"),
    ("batch-desc",      "narration"),
    ("-text",           "narration"),
]

# Short tag used inside IDs (MURALS-{SCREEN}-{TAG}-{SEQ}) — kept distinct from
# the full `type` value shown in its own DOCX column. Long tags like
# "FEEDBACKTRYAGAIN" wrap across 2-3 lines in the ID column next to a short
# one-word Hebrew answer, visually overwhelming the row; short tags fix that
# without losing information (the Type column still spells it out in full).
ID_TAG_ABBREV = {
    "narration": "NARR",
    "instruction": "INSTR",
    "question": "Q",
    "option": "OPT",
    "word-bank-chip": "CHIP",
    "sentence-stem": "STEM",
    "hint": "HINT",
    "feedback-tryagain": "FBTRY",
    "feedback-correct": "FBCORR",
    "feedback-incorrect": "FBINCORR",
    "nav-button": "NAV",
    "submit-button": "SUBMIT",
    "retry-button": "RETRY",
    "help-button": "HELPBTN",
    "close-button": "CLOSE",
    "applet-button": "APPBTN",
    "play-button": "PLAY",
    "done-button": "DONE",
    "aria-label": "ARIA",
    "image-alt-text": "ALT",
    "placeholder": "PLACEHOLDER",
    "dialogue": "DLG",
    "popup-text": "POPUP",
    "label": "LABEL",
    "ui-text": "UI",
    "title": "TITLE",
    "answer-drop-target": "DROP",
    "text": "TEXT",
}


GENERIC_TYPES = {"label", "narration", "text"}


def _inside_option_container(el, screen_root):
    """True if any ancestor (e.g. q5-option, q6-option) marks this as an
    answer-choice card — a stronger, more specific signal than a generic
    '-label'/'-text' class the choice's own text span happens to carry."""
    node = el
    while node is not None:
        cls = node.get("class") if hasattr(node, "get") else None
        if cls and any(c.endswith("-option") for c in cls):
            return True
        if node is screen_root:
            break
        node = node.parent
    return False


def classify_type(el, screen_root, default="text"):
    """Walk up from el to screen_root one ancestor at a time; the CLOSEST
    ancestor whose own class list matches a rule wins (proximity, not the
    order rules happen to appear in TYPE_RULES). `default` is the type to
    fall back to when no CSS-class rule matches — callers pass the type
    already known from *how* the string was found (e.g. an `alt` attribute)
    so that information is never discarded in favor of a generic bucket."""
    node = el
    while node is not None:
        cls = node.get("class") if hasattr(node, "get") else None
        if cls:
            joined = " ".join(cls)
            for needle, type_name in TYPE_RULES:
                if needle in joined:
                    if type_name in GENERIC_TYPES and _inside_option_container(el, screen_root):
                        return "option"
                    return type_name
        if node is screen_root:
            break
        node = node.parent
    if default in GENERIC_TYPES and _inside_option_container(el, screen_root):
        return "option"
    if default == "text" and el.name == "button":
        return "button"
    return default


def norm(text):
    return WS_RE.sub(" ", text).strip()


def has_hebrew(text):
    return bool(HEBREW_RE.search(text))


def css_path(el, screen_root):
    """Best-effort short locator: tag.class chain + id + sourceline."""
    parts = []
    node = el
    depth = 0
    while node is not None and depth < 6:
        if hasattr(node, "name") and node.name:
            seg = node.name
            if node.get("id"):
                seg += f"#{node.get('id')}"
            elif node.get("class"):
                seg += "." + ".".join(node.get("class")[:2])
            parts.append(seg)
        if node is screen_root:
            break
        node = node.parent
        depth += 1
    parts.reverse()
    locator = " > ".join(parts)
    line = getattr(el, "sourceline", None)
    if line:
        return f"line {line} · {locator}"
    return locator


def extract_leaves(el, screen_root, results, seen_ids):
    """Recursively find maximal text leaves containing Hebrew."""
    if not hasattr(el, "name") or el.name in ("script", "style", "template"):
        return
    if el.get("id") in EXCLUDED_IDS:
        return

    text = norm(el.get_text(separator=" ", strip=True))
    if not has_hebrew(text):
        return

    children = [c for c in el.find_all(True, recursive=False)]
    qualifying_children = [
        c for c in children
        if c.name not in INLINE_FORMAT_TAGS
        and c.get("id") not in EXCLUDED_IDS
        and has_hebrew(norm(c.get_text(separator=" ", strip=True)))
    ]

    # A <p>/<li>/<td>/<th> with 2+ qualifying <span>/<a> children is almost
    # always one sentence split across styling runs — capture the whole
    # thing as one unit instead of fragmenting it per span.
    if (
        el.name in PROSE_CONTAINER_TAGS
        and len(qualifying_children) > 1
        and all(c.name in INLINE_PHRASING_TAGS for c in qualifying_children)
    ):
        key = id(el)
        if key not in seen_ids:
            seen_ids.add(key)
            results.append((el, text, "leaf"))
        return

    if qualifying_children:
        for c in children:
            extract_leaves(c, screen_root, results, seen_ids)
        # capture any direct text this element owns outside of qualifying children
        # (explicitly exclude Comment — it subclasses NavigableString in bs4,
        # and dev comments here are frequently written in Hebrew)
        direct = "".join(
            str(c) for c in el.contents
            if isinstance(c, NavigableString) and not isinstance(c, Comment)
        )
        direct = norm(direct)
        if has_hebrew(direct):
            key = (id(el), "leftover")
            if key not in seen_ids:
                seen_ids.add(key)
                results.append((el, direct, "leftover"))
        return

    key = id(el)
    if key not in seen_ids:
        seen_ids.add(key)
        results.append((el, text, "leaf"))


def extract_attributes(section, results, seen_attr_ids):
    """Separate pass: alt / aria-label / title / placeholder on any element."""
    for el in section.find_all(True):
        if el.name in ("script", "style", "template"):
            continue
        if el.get("id") in EXCLUDED_IDS:
            continue
        for attr in ("alt", "aria-label", "title", "placeholder"):
            val = el.get(attr)
            if not val:
                continue
            val = norm(val)
            if not has_hebrew(val):
                continue
            # Skip alt text that merely duplicates the parent button's aria-label
            # (same visible/spoken label captured twice for one control).
            if attr == "alt":
                parent = el.parent
                hops = 0
                skip = False
                while parent is not None and hops < 3:
                    parent_label = parent.get("aria-label") if hasattr(parent, "get") else None
                    if parent_label and norm(parent_label) == val:
                        skip = True
                        break
                    parent = parent.parent
                    hops += 1
                if skip:
                    continue
            key = (id(el), attr)
            if key in seen_attr_ids:
                continue
            seen_attr_ids.add(key)
            attr_type = {
                "alt": "image-alt-text",
                "aria-label": "aria-label",
                "title": "aria-label",
                "placeholder": "placeholder",
            }[attr]
            results.append((el, val, attr_type))


def extract_screen(section, screen_id):
    results = []
    seen_ids = set()
    seen_attr_ids = set()
    extract_leaves(section, section, results, seen_ids)
    extract_attributes(section, results, seen_attr_ids)
    # Supplementary: capture EVERY answer-option element even if it holds no
    # Hebrew (e.g. a pure ratio like "1 : 1") so a question's full answer
    # set stays visible to the translator for context, instead of silently
    # showing 2 of 4 options just because the other two are numeral-only.
    for el in section.find_all(True):
        cls = el.get("class")
        if not cls or "opt-text" not in " ".join(cls):
            continue
        if id(el) in seen_ids:
            continue
        text = norm(el.get_text(separator=" ", strip=True))
        if not text:
            continue
        seen_ids.add(id(el))
        results.append((el, text, "leaf"))
    return results


def extract_global_container(container, screen_id, forced_type):
    results = []
    seen_ids = set()
    seen_attr_ids = set()
    extract_leaves(container, container, results, seen_ids)
    extract_attributes(container, results, seen_attr_ids)
    return results


COUPLING_NOTES = {
    "q1": (
        "word-bank-chip",
        "This chip's visible label is also used as a literal JS matching value "
        "(data-word attribute, inline onclick argument, and Q1_CORRECT_ANSWERS "
        "in js/questions/dragdrop.js). If translated, all four locations must be "
        "updated together or answer-checking will break."
    ),
}


def build_entries(screen_id, raw_items):
    idx, ctype, label = SCREEN_META[screen_id]
    entries = []
    for el, text, kind in raw_items:
        type_name = classify_type(el, el if kind == "attr-root" else el)
        entries.append({
            "screen": screen_id,
            "screenIndex": idx,
            "component": ctype,
            "screenLabel": label,
            "type": type_name,
            "source": text,
            "sourceFile": "index.html",
            "sourceLocator": css_path(el, el),
            "_el": el,
        })
    return entries


def main():
    html = INDEX_HTML.read_text(encoding="utf-8")
    soup = BeautifulSoup(html, "html.parser")

    all_raw = []  # list of dict entries (pre-ID)

    for screen_id, idx, ctype, label in SCREENS:
        section = soup.find("section", id=f"screen-{screen_id}")
        if section is None:
            print(f"WARNING: section screen-{screen_id} not found", file=sys.stderr)
            continue
        items = extract_screen(section, screen_id)
        for el, text, kind in items:
            attr_default = kind if kind in ("image-alt-text", "aria-label", "placeholder") else "text"
            type_name = classify_type(el, section, default=attr_default)
            entry = {
                "screen": screen_id,
                "screenIndex": idx,
                "component": ctype,
                "screenLabel": label,
                "type": type_name,
                "source": text,
                "sourceFile": "index.html",
                "sourceLocator": css_path(el, section),
                "note": "",
            }
            if screen_id in COUPLING_NOTES and type_name == COUPLING_NOTES[screen_id][0]:
                entry["note"] = COUPLING_NOTES[screen_id][1]
                entry["requiresDevSync"] = True
            if type_name == "option" and not has_hebrew(text):
                entry["note"] = (
                    "Numeral/ratio only, no Hebrew words — included for context "
                    "(full answer set) but likely needs no wording translation. "
                    "Confirm Western vs. Arabic-Indic digit convention with client."
                )
            elif type_name == "option" and len(text.strip()) == 1 and has_hebrew(text):
                entry["note"] = (
                    "Single-letter option marker (Hebrew ordinal א/ב/ג), not a word. "
                    "Confirm with client whether to use Arabic ordinal letters "
                    "(א→أ, ב→ب, ג→ج) or switch to numerals for the Arabic version."
                )
            all_raw.append(entry)

    for container_id, screen_id, forced_type in GLOBAL_CONTAINERS:
        container = soup.find(id=container_id)
        if container is None:
            print(f"WARNING: global container #{container_id} not found", file=sys.stderr)
            continue
        idx, ctype, label = SCREEN_META[screen_id]
        items = extract_global_container(container, screen_id, forced_type)
        for el, text, kind in items:
            attr_default = kind if kind in ("image-alt-text", "aria-label", "placeholder") else forced_type
            type_name = classify_type(el, container, default=attr_default)
            entry = {
                "screen": screen_id,
                "screenIndex": idx,
                "component": f"{ctype} / {forced_type}",
                "screenLabel": label,
                "type": type_name,
                "source": text,
                "sourceFile": "index.html",
                "sourceLocator": f"#{container_id} :: " + css_path(el, container),
                "note": "",
            }
            all_raw.append(entry)

    # ── applet/color_lab.html (JSX — regex-based, not real DOM) ──
    applet_entries = extract_applet_strings()
    all_raw.extend(applet_entries)

    # ── de-dup exact duplicate (screen, type, source, sourceLocator) ──
    dedup = []
    seen = set()
    for e in all_raw:
        key = (e["screen"], e["type"], e["source"], e["sourceLocator"])
        if key in seen:
            continue
        seen.add(key)
        dedup.append(e)

    # sort by screen order, then first appearance order (stable sort preserves insertion order)
    dedup.sort(key=lambda e: (SCREEN_ORDER.get(e["screen"], 999),))

    manifest = assign_stable_ids(dedup)
    write_outputs(manifest)


def extract_applet_strings():
    """color_lab.html embeds a React/JSX component inside a <script type="text/babel">
    block; BeautifulSoup can't parse JSX as DOM, so this uses a small targeted
    regex pass instead. The component is short and stable (~500 lines);
    if it grows substantially, re-verify this list by hand."""
    if not APPLET_HTML.exists():
        return []
    html = APPLET_HTML.read_text(encoding="utf-8")
    entries = []
    seen = set()

    # <title> tag
    m = re.search(r"<title>([^<]*)</title>", html)
    if m and has_hebrew(m.group(1)):
        title_text = norm(m.group(1))
        entries.append(_applet_entry(title_text, "title", "browser tab <title>"))
        seen.add(title_text)

    # JSX text content between > and < that contains Hebrew (skip pure code lines)
    for m in re.finditer(r">\s*([^<>{}\n]*[֐-׿][^<>{}\n]*?)\s*<", html):
        text = norm(m.group(1))
        if not text or text in seen:
            continue
        seen.add(text)
        entries.append(_applet_entry(text, "ui-text", f"JSX text node near offset {m.start()}"))

    # Static Hebrew text immediately followed by a JS expression, e.g.
    # `סה"כ כוסות: {total}` — the plain >text< pass above can't cross the
    # `{...}` boundary, so this text was silently missed until a live
    # interaction test surfaced it (confirmed live in the Color Lab applet).
    for m in re.finditer(r">\s*([^<>{}\n]*[֐-׿][^<>{}\n]*?)\s*\{", html):
        text = norm(m.group(1))
        if not text or text in seen:
            continue
        seen.add(text)
        entries.append(_applet_entry(
            text, "ui-text", f"JSX text node near offset {m.start()}",
            note="Followed immediately by a dynamically-inserted number "
                 "(e.g. a cup count). Keep the translation compatible with "
                 "a number appearing right after it."
        ))

    # Simple ternaries with a Hebrew string literal on each branch, e.g.
    # `{total === 0 ? 'הוסיפו צבע' : 'הגוון שנוצר'}` — both branches render
    # as visible text depending on app state; neither appears in static
    # markup, only after user interaction changes the condition.
    ternary_re = re.compile(
        r"\{[^{}]*?\?\s*(['\"])([^'\"]*[֐-׿][^'\"]*)\1\s*:\s*(['\"])([^'\"]*[֐-׿][^'\"]*)\3[^{}]*?\}"
    )
    for m in ternary_re.finditer(html):
        for branch_text in (m.group(2), m.group(4)):
            text = norm(branch_text)
            if not text or text in seen:
                continue
            seen.add(text)
            entries.append(_applet_entry(
                text, "ui-text", f"JSX conditional (ternary) branch near offset {m.start()}",
                note="One of two states shown depending on app state (e.g. before/after "
                     "the learner enters a value) — only appears after interaction, not "
                     "in the applet's initial static markup."
            ))

    return entries


def _applet_entry(text, type_name, locator, note=""):
    return {
        "screen": "APPLET",
        "screenIndex": 900,
        "component": "color-lab-applet",
        "screenLabel": "יישומון מעבדת חקר הצבעים (applet/color_lab.html) — מוטמע ב-SLIDE5 וב-QUES2–QUES5",
        "type": type_name,
        "source": text,
        "sourceFile": "applet/color_lab.html",
        "sourceLocator": locator,
        "note": note,
    }


def assign_stable_ids(dedup_entries):
    existing = {}
    orphan_candidates = {}
    if MANIFEST_PATH.exists():
        try:
            old = json.loads(MANIFEST_PATH.read_text(encoding="utf-8"))
            for e in old.get("entries", []):
                key = (e["screen"], e["type"], e["source"])
                existing[key] = e
                orphan_candidates[key] = e
        except Exception as exc:
            print(f"WARNING: could not read existing manifest for ID stability: {exc}", file=sys.stderr)

    seq_counters = {}  # (screen, type) -> next seq
    # seed counters from existing manifest ids to avoid collisions
    id_re = re.compile(r"^MURALS-(.+)-(\d+)$")
    for e in existing.values():
        m = id_re.match(e.get("id", ""))
        if m:
            seq_key = (e["screen"], e["type"])
            n = int(m.group(2))
            seq_counters[seq_key] = max(seq_counters.get(seq_key, 0), n)

    final_entries = []
    matched_keys = set()
    for e in dedup_entries:
        key = (e["screen"], e["type"], e["source"])
        if key in existing:
            old = existing[key]
            e["id"] = old["id"]
            e["translation"] = old.get("translation", "")
            if old.get("note") and not e.get("note"):
                e["note"] = old["note"]
            matched_keys.add(key)
        else:
            seq_key = (e["screen"], e["type"])
            seq_counters[seq_key] = seq_counters.get(seq_key, 0) + 1
            screen_tag = e["screen"].upper()
            type_tag = ID_TAG_ABBREV.get(e["type"]) or re.sub(r"[^A-Z0-9]+", "", e["type"].upper()) or "TEXT"
            e["id"] = f"MURALS-{screen_tag}-{type_tag}-{seq_counters[seq_key]:02d}"
            e["translation"] = ""
        e["status"] = "active"
        final_entries.append(e)

    # Hand-added entries (manual=True) have no counterpart in the HTML — e.g.
    # video narration taken from a clip's SRT subtitle file, which is spoken
    # aloud but never rendered on screen. They must survive regeneration
    # instead of being orphaned. Re-insert each one after the last entry of
    # its screen that came from the HTML, keeping screen grouping intact.
    manual_entries = [v for k, v in orphan_candidates.items()
                      if k not in matched_keys and v.get("manual")]
    for me in manual_entries:
        same_screen = [i for i, e in enumerate(final_entries) if e["screen"] == me["screen"]]
        pos = (same_screen[-1] + 1) if same_screen else len(final_entries)
        final_entries.insert(pos, {**me, "status": "active"})
        matched_keys.add((me["screen"], me["type"], me["source"]))

    orphaned = [
        {**v, "status": "orphaned"}
        for k, v in orphan_candidates.items()
        if k not in matched_keys
    ]

    return {"entries": final_entries, "orphaned": orphaned}


def write_outputs(manifest):
    EXPORT_DIR.mkdir(parents=True, exist_ok=True)
    out = {
        "meta": {
            "unit": "ציורי קיר (Murals) — תכנית 720, כיתה ז', יחס ופרופורציה",
            "sourceLanguage": "he",
            "targetLanguage": "ar",
            "generatedFrom": ["index.html", "applet/color_lab.html"],
            "idScheme": "MURALS-{SCREEN}-{TYPE}-{SEQ}",
            "totalScreens": len(SCREENS),
            "totalEntries": len(manifest["entries"]),
            "totalOrphaned": len(manifest["orphaned"]),
            "regenerate": "python3 translation/tools/extract_translations.py",
            "notes": (
                "IDs are stable across regeneration when (screen, type, Hebrew source) "
                "is unchanged. Entries removed or edited in the source move to "
                "'orphaned' instead of being deleted, so in-progress Arabic "
                "translations are never silently lost — review 'orphaned' after "
                "each regeneration and re-merge manually if the text just moved."
            ),
        },
        "entries": [{k: v for k, v in e.items() if not k.startswith("_")} for e in manifest["entries"]],
        "orphaned": manifest["orphaned"],
    }
    MANIFEST_PATH.write_text(json.dumps(out, ensure_ascii=False, indent=2), encoding="utf-8")
    print(f"Wrote {MANIFEST_PATH} — {len(out['entries'])} entries, {len(out['orphaned'])} orphaned")


if __name__ == "__main__":
    main()
