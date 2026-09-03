# Translation export — ציורי קיר (Murals)

Hebrew → Arabic translation export for the Murals unit, built the way
Articulate Storyline's "Export Translation" workflow works: everything a
professional translator needs lives in one Word file, IDs stay stable so
the Arabic answers can be imported back later, and nothing here touches
the learner-facing unit itself.

## For the translator

Open [`export/murals_translation_he-ar.docx`](export/murals_translation_he-ar.docx)
and fill in the "Arabic translation" column only. Full instructions are on
its cover page.

## Files

```
translation/
  export/
    murals_translation_he-ar.docx       — hand this to the translator
    murals_translation_manifest.json    — machine-readable source of truth (ID ↔ Hebrew ↔ Arabic)
    asset_localization_report.json      — PNGs with Hebrew text baked into the graphic (not translatable as text)
  tools/
    extract_translations.py             — index.html + applet/color_lab.html → manifest JSON
    build_docx.js                       — manifest JSON → DOCX
    asset_localization_report.py        — writes the asset report (hand-maintained list, see file docstring)
    verify_coverage.py                  — independent sweep: any learner-facing Hebrew NOT in the manifest?
```

## Translator preview (a few screens only)

`build_docx.js` can render a subset of screens for a quick look, instead of
the full 370-row document:

```bash
node translation/tools/build_docx.js --preview-screens q2,q1,q3 \
  --out translation/export/PREVIEW_sample_screens.docx \
  --title "Translator Preview — 3 Sample Screens"
```

This is a convenience view only, clearly marked as such on its own cover
page — `murals_translation_he-ar.docx` + `murals_translation_manifest.json`
stay the single source of truth for translation and, later, import.

## Regenerating after the Hebrew source changes

```bash
python3 translation/tools/extract_translations.py
python3 translation/tools/verify_coverage.py      # should report 0 unmatched fragments in both files
cd translation/tools && npm install && cd ../..    # first time only — installs the docx package
node translation/tools/build_docx.js
```

IDs (e.g. `MURALS-Q2-OPTION-02`) are stable across regeneration: an entry
keeps its ID and any Arabic translation already in the manifest as long as
its (screen, type, Hebrew source) is unchanged. If a string changes or is
removed, its old entry moves to `orphaned` in the manifest instead of being
deleted, so an in-progress translation is never silently lost — review that
list by hand after regenerating.

`asset_localization_report.json` is **not** auto-derived from the HTML —
several of the flagged images use `alt=""` despite containing baked-in
Hebrew text, so no attribute scan can find them reliably. If `img/` assets
change, re-open the new/changed ones by eye and update the `ASSETS` list in
`asset_localization_report.py` by hand.

## Screenshots / thumbnails

Investigated per the brief: `index_dev.html`'s screen-jump bridge
(`postMessage({type:'DEV_GOTO', screen:n})`) makes it easy to render any of
the 17 screens on demand, and this was confirmed working in-browser during
this export. Turning that into saved image files for the DOCX would need a
headless-browser dependency (e.g. Playwright + a downloaded Chromium
binary, ~300MB) that isn't installed in this environment — not implemented,
to avoid adding a heavy, fragile dependency for a nice-to-have. If wanted
later, a short Playwright script driving `index_dev.html` is the
straightforward way to add it.
