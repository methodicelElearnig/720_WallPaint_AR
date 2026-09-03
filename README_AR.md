# ציורי קיר — Arabic build (`720_WallPaint_AR`)

Arabic version of the Murals unit, imported from
`translation/export/murals_translation_he-ar_updated_FINAL.docx`
against the ID manifest in `translation/export/murals_translation_manifest.json`.

All **381** manifest rows were applied.

## ⚠ The Word file had two misaligned blocks — repaired here

In the translator's file the Hebrew column matches the manifest on all 381 rows,
but in two places the **Arabic column is pasted one row out of step**, so each
row carried its neighbour's translation. Both were repaired during import
(`TAKE_FROM` in `translation/tools/import_arabic.py`).

**SLIDE8** — the whole screen, Arabic sitting one row too high. The narration
read out of order and the two nav buttons were swapped.

**Q6** — from `MURALS-Q6-FBINCORR-01` to the end of the screen, Arabic sitting
one row too low. The incorrect-answer feedback lost its opening line, and the
button labels were scrambled: *help* carried "سؤال 6" (question 6), *close*
carried "مُساعَدة" (help), *submit* carried "إغلاق" (close).

Two rows fell off the ends of those runs and were taken from a row elsewhere in
the document whose Hebrew is character-for-character identical:

| ID | Hebrew | taken from |
|---|---|---|
| `MURALS-Q6-NAV-02` | חזרה | `MURALS-Q5-NAV-02` |
| `MURALS-Q5-FBINCORR-01` | זו טעות. התשובה הנכונה מסומנת. | `MURALS-Q2-FBINCORR-01` |

### One line still needs the translator

`MURALS-SLIDE8-NARR-01` — **גל הזכירה לחברים שיש עוד גוונים של ירוק** — has no
Arabic anywhere in the Word file; it fell off the top of the SLIDE8 shift. The
build carries a **drafted** rendering, marked with an HTML comment at its place
in `index.html`:

> ذكّرَتْ جنى أصدقاءها بأنّ هناك درجات أخرى مِن اللون الأخضر

The character **גל** appears only this once in the whole unit, so she has no
established Arabic name — the translator picked names for everyone else
(סתיו→سمر, דניאלה→عبير, אלון→وسام, שיר→سناء). **جنى** is a placeholder and needs
their sign-off along with the sentence.

Re-running the alignment audit on the repaired data reports 0 misaligned rows
and 0 empty cells.

## What changed relative to the Hebrew build

| File | Change |
|---|---|
| `index.html` | All learner-facing text, `alt` and `aria-label` values replaced with Arabic. `lang="ar"`. `<title>` translated. Q1 chip words translated in all four coupled places. |
| `applet/color_lab.html` | All 20 UI strings replaced. `lang="ar"`, Cairo webfont. |
| `js/questions/dragdrop.js` | `Q1_CORRECT_ANSWERS` updated to the Arabic chip labels. |
| `css/style-ar.css` | **New file.** Arabic typeface + translation-expansion layout fixes. |
| `css/style.css` | **Unchanged** — byte-identical to the Hebrew build. |

`css/style.css` was deliberately left untouched so that any future Hebrew CSS
fix can be copied straight across. Everything Arabic-specific is in
`css/style-ar.css`, which loads after it.

## The Q1 coupling — read before editing

In Q1 the chip's visible label doubles as the JavaScript matching value. Each
word appears in **five** places that must stay byte-identical:

1. `data-word="…"` on the chip `<div>` (`index.html`)
2. `ondragstart="q1DragStart(event,'…')"` (`index.html`)
3. `onclick="q1ChipClick(event,'…')"` (`index.html`)
4. the `<span class="q1-chip-label">` text (`index.html`)
5. `Q1_CORRECT_ANSWERS` in `js/questions/dragdrop.js`

| Hebrew | Arabic |
|---|---|
| כחול | الأزرق |
| צהוב | الأصفر |
| חמים ובהיר | الدافئ والفاتح |
| קריר וכהה | البارد والغامق |

Change one and answer-checking breaks silently. Verified working: placing the
three correct chips scores `correct`; a wrong set scores `tryagain`.

## Layout fixes in `css/style-ar.css`

Arabic runs longer than Hebrew, and several Figma boxes are fixed-size. Each fix
keeps the screen's layout and reading order — only the type scale or a blank's
position moves.

| Screen | Problem | Fix |
|---|---|---|
| SLIDE2 | Header paragraph ran a 5th line, spilling out below the white header shape | 32px / 39px line-height |
| Q2 | Story column was clipped inside its 205px `overflow:hidden` box and would have hit the illustration | 27px / 29px line-height |
| Q3 | Cairo's line box clipped the last line's descenders | `overflow: visible` |
| Q7 | The fill-in sentence needs one more line; the second blank and its trailing text landed on the line below | 30px type; second blank, its text, the closing line and the chip tray each move down one line |
| Q7B | Both fill-in rows ran under their blanks | 29px type; blanks and the "لترًا" label slide left |

## Font

`Assistant` has no Arabic glyphs, so `--font-main` is **Cairo** (Google Fonts),
loaded from the same CDN link the Hebrew build uses for Assistant. If the unit
has to run without internet, download Cairo's woff2 files into `fonts/` and
replace the `<link>` with local `@font-face` rules — the Hebrew build has the
same dependency.

## Still Hebrew, on purpose

* Developer comments throughout `index.html`, `style.css` and the JS files.
* The `#popup-adjuster` dev widget at the bottom of `index.html` — debug tooling,
  excluded from the translation export by design.
* Video narration and 9 images with Hebrew baked into the artwork — see the
  media checklist that came with this build.
