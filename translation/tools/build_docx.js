/**
 * build_docx.js — Murals (ציורי קיר) translation export DOCX
 *
 * Reads translation/export/murals_translation_manifest.json and
 * asset_localization_report.json, writes
 * translation/export/murals_translation_he-ar.docx.
 *
 * Regenerate after editing extract_translations.py or re-running it:
 *   node translation/tools/build_docx.js
 */
const fs = require("fs");
const path = require("path");
const {
  Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell,
  HeadingLevel, AlignmentType, WidthType, ShadingType, BorderStyle,
  PageBreak, VerticalAlign, ExternalHyperlink,
} = require("docx");

const ROOT = path.resolve(__dirname, "..", "..");
const EXPORT_DIR = path.join(ROOT, "translation", "export");
const manifest = JSON.parse(fs.readFileSync(path.join(EXPORT_DIR, "murals_translation_manifest.json"), "utf-8"));
const assetReport = JSON.parse(fs.readFileSync(path.join(EXPORT_DIR, "asset_localization_report.json"), "utf-8"));

const SCREEN_ORDER = [
  "slide1", "slide2", "slide3", "q1", "slide5", "q2", "q3", "q4", "q4b",
  "q4c", "slide8", "q5", "slide10", "q6", "q7", "q7b", "slide18", "APPLET",
];

const COMPONENT_LABELS = {
  "video": "Video screen — Continue (►) stays locked until the clip ends",
  "slide": "Content slide — always unlocked",
  "slide-applet": "Content slide with the embedded Color Lab applet",
  "video-end": "Closing video, then the final score popup",
  "question-radio": "Question — single/multiple choice",
  "question-dragdrop": "Question — drag word-bank chips into blanks",
  "question-numeric": "Question — numeric input",
  "color-lab-applet": "Embedded React applet (used inside SLIDE5 and QUES2–QUES5)",
};

const TYPE_GLOSSARY = [
  ["narration / instruction / question", "Body text, task instructions, or the question prompt itself"],
  ["video-narration", "Spoken narration heard in a video clip, with no on-screen equivalent — taken from the clip's Hebrew subtitle (SRT) file. Each row is one subtitle cue; the note under the Hebrew gives the cue number and how long it is on screen, so the Arabic can be timed to the same clip."],
  ["option", "One answer choice in a multiple-choice question"],
  ["word-bank-chip", "A draggable word in a fill-in-the-blank word bank"],
  ["sentence-stem", "The fixed part of a fill-in-the-blank sentence, around the blank"],
  ["hint", "Text shown in the help (עזרה) popup"],
  ["feedback-tryagain / feedback-correct / feedback-incorrect", "Feedback shown after submitting an answer"],
  ["nav-button / submit-button / retry-button / help-button / close-button / applet-button / play-button / done-button", "Button label (visible text or screen-reader aria-label)"],
  ["aria-label / image-alt-text / placeholder", "Accessibility text — read by screen readers, not usually visible"],
  ["dialogue", "Speech-bubble dialogue between characters"],
  ["popup-text / label / ui-text / title", "Other on-screen text: popups, small labels, applet UI"],
];

function groupBy(arr, keyFn) {
  const m = new Map();
  for (const item of arr) {
    const k = keyFn(item);
    if (!m.has(k)) m.set(k, []);
    m.get(k).push(item);
  }
  return m;
}

const bySreen = groupBy(manifest.entries, (e) => e.screen);

function heCell(text, { bold = false, size = 22, color } = {}) {
  return new Paragraph({
    bidirectional: true,
    alignment: AlignmentType.RIGHT,
    children: [new TextRun({ text: text || "", rightToLeft: true, bold, size, color, font: "Arial" })],
  });
}

function enCell(text, { bold = false, size = 20, italics = false, color } = {}) {
  return new Paragraph({
    alignment: AlignmentType.LEFT,
    children: [new TextRun({ text: text || "", bold, italics, size, color, font: "Arial" })],
  });
}

function cell(children, { width, shading, valign = VerticalAlign.CENTER } = {}) {
  return new TableCell({
    width: { size: width, type: WidthType.DXA },
    verticalAlign: valign,
    shading: shading ? { type: ShadingType.CLEAR, fill: shading } : undefined,
    margins: { top: 80, bottom: 80, left: 100, right: 100 },
    children: Array.isArray(children) ? children : [children],
  });
}

const COL_ID = 1500, COL_TYPE = 1300, COL_HE = 3150, COL_AR = 3076;
const HEADER_FILL = "2F5233"; // deep green, matches the paint-mixing theme without copying brand colors
const ALT_FILL = "F2F2F2";

function bilingualHeaderCell(nativeText, englishGloss, width) {
  // Two separate paragraphs, each internally single-direction, instead of one
  // run mixing Hebrew/Arabic + English — a single mixed-direction run lets
  // the Unicode bidi algorithm reorder the two scripts unpredictably (visually
  // confirmed garbled in review), even though the underlying text is correct.
  return cell(
    [
      heCell(nativeText, { bold: true, color: "FFFFFF" }),
      enCell(englishGloss, { bold: true, color: "FFFFFF", size: 16 }),
    ],
    { width, shading: HEADER_FILL }
  );
}

function screenTable(entries) {
  const headerRow = new TableRow({
    tableHeader: true,
    children: [
      cell(enCell("ID", { bold: true, color: "FFFFFF" }), { width: COL_ID, shading: HEADER_FILL }),
      cell(enCell("Type", { bold: true, color: "FFFFFF" }), { width: COL_TYPE, shading: HEADER_FILL }),
      bilingualHeaderCell("עברית (מקור)", "Hebrew source", COL_HE),
      bilingualHeaderCell("العربية (ترجمة)", "Arabic translation", COL_AR),
    ],
  });

  const rows = entries.map((e, i) => {
    const fill = i % 2 === 1 ? ALT_FILL : undefined;
    const heChildren = [heCell(e.source)];
    if (e.note) {
      heChildren.push(enCell(`⚠ Translator note: ${e.note}`, { italics: true, size: 16, color: "9C4221" }));
    } else if (e.requiresDevSync) {
      heChildren.push(enCell("⚠ Requires developer sync — this string's value is also used by the app's code.", { italics: true, size: 16, color: "9C4221" }));
    }
    return new TableRow({
      children: [
        cell(enCell(e.id, { size: 16 }), { width: COL_ID, shading: fill }),
        cell(enCell(e.type, { size: 18 }), { width: COL_TYPE, shading: fill }),
        cell(heChildren, { width: COL_HE, shading: fill }),
        cell(heCell(e.translation || ""), { width: COL_AR, shading: fill }),
      ],
    });
  });

  return new Table({
    width: { size: COL_ID + COL_TYPE + COL_HE + COL_AR, type: WidthType.DXA },
    columnWidths: [COL_ID, COL_TYPE, COL_HE, COL_AR],
    rows: [headerRow, ...rows],
  });
}

function screenSection(screenId, entries) {
  const idx = entries[0].screenIndex;
  const label = entries[0].screenLabel;
  const component = entries[0].component;
  const componentLabel = COMPONENT_LABELS[component] || component;
  const heading = screenId === "APPLET"
    ? "APPLET — Color Lab (applet/color_lab.html)"
    : `SCREEN ${idx} — ${screenId.toUpperCase()}`;

  return [
    new Paragraph({
      heading: HeadingLevel.HEADING_1,
      pageBreakBefore: true,
      children: [new TextRun({ text: heading })],
    }),
    new Paragraph({
      bidirectional: true,
      alignment: AlignmentType.RIGHT,
      spacing: { after: 80 },
      children: [new TextRun({ text: label, rightToLeft: true, italics: true, size: 22, font: "Arial" })],
    }),
    new Paragraph({
      spacing: { after: 200 },
      children: [new TextRun({ text: componentLabel, italics: true, size: 20, color: "555555" })],
    }),
    screenTable(entries),
    new Paragraph({ text: "", spacing: { after: 100 } }),
  ];
}

function coverPage({ isPreview = false, title = null } = {}) {
  const total = manifest.entries.length;
  const screens = new Set(manifest.entries.map((e) => e.screen)).size;
  return [
    new Paragraph({
      heading: HeadingLevel.TITLE,
      alignment: AlignmentType.CENTER,
      spacing: { before: 1200, after: 200 },
      children: [new TextRun({ text: "ציורי קיר — Murals" })],
    }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { after: 400 },
      children: [new TextRun({ text: title || "Translation Export — Hebrew → Arabic", size: 32, bold: true })],
    }),
    ...(isPreview ? [new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { after: 200 },
      children: [new TextRun({
        text: "PREVIEW SAMPLE ONLY — a few representative screens for a quick internal look at the translator "
          + "experience. This is not a source of truth: translate in the full murals_translation_he-ar.docx instead.",
        bold: true, color: "9C4221", size: 20,
      })],
    })] : []),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { after: 40 },
      children: [new TextRun({ text: "משרד החינוך — תכנית 720 | כיתה ז׳ | יחס ופרופורציה", rightToLeft: true, size: 24 })],
    }),
    new Paragraph({
      bidirectional: true,
      alignment: AlignmentType.CENTER,
      children: [new TextRun({ text: "", rightToLeft: true })],
    }),
    new Paragraph({ text: "", spacing: { after: 400 } }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      children: [new TextRun({ text: `${total} translatable strings across ${screens} screens/components`, size: 22 })],
    }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { after: 600 },
      children: [new TextRun({ text: "Source: index.html + applet/color_lab.html — no learner-facing file was modified to produce this export.", size: 18, italics: true, color: "555555" })],
    }),
    new Paragraph({ heading: HeadingLevel.HEADING_2, children: [new TextRun("How to use this document")] }),
    ...[
      "This document is grouped by screen, in the order a learner sees them (SLIDE1 → SLIDE18), followed by the shared Color Lab applet used inside several screens.",
      "Each row has a stable ID (e.g. MURALS-Q2-OPTION-02) — please keep the ID column untouched. It is how the Arabic translation gets matched back to the right place in the code; the Hebrew wording is never used as a lookup key.",
      "Please translate only the \"Arabic translation\" column. Leave every other column exactly as-is.",
      "A few rows carry a ⚠ translator note (in italics, under the Hebrew text) — these flag numeral-only options, single-letter option markers (א/ב/ג), or places where the visible word is also used by the app's code and must stay in sync with a developer if changed. Read these before translating that row.",
      "This workbook covers on-screen and screen-reader text only. A separate list — \"Asset Localization Report\" (last section of this document) — covers Hebrew words baked directly into PNG images (like the \"?צדקתי\" submit-button graphic), which need a fresh graphic export rather than a text translation.",
      "RTL note: both Hebrew and Arabic columns are already set to right-to-left paragraph direction, so Arabic typed into the translation column should align and read correctly without extra formatting.",
    ].map((t) => new Paragraph({ spacing: { after: 120 }, bullet: { level: 0 }, children: [new TextRun({ text: t, size: 20 })] })),
    new Paragraph({ heading: HeadingLevel.HEADING_2, spacing: { before: 300 }, children: [new TextRun("Type column glossary")] }),
    ...TYPE_GLOSSARY.map(([types, desc]) => new Paragraph({
      spacing: { after: 80 },
      children: [
        new TextRun({ text: types + ":  ", bold: true, size: 20 }),
        new TextRun({ text: desc, size: 20 }),
      ],
    })),
  ];
}

function assetAppendix({ assets = assetReport.assets, heading = "Appendix A — Assets requiring localization" } = {}) {
  const headerRow = new TableRow({
    tableHeader: true,
    children: [
      cell(enCell("Image file", { bold: true, color: "FFFFFF" }), { width: 2400, shading: HEADER_FILL }),
      cell(heCell("Baked-in Hebrew text", { bold: true, color: "FFFFFF" }), { width: 2200, shading: HEADER_FILL }),
      cell(enCell("Used in screen(s)", { bold: true, color: "FFFFFF" }), { width: 1800, shading: HEADER_FILL }),
      cell(enCell("Note", { bold: true, color: "FFFFFF" }), { width: 2626, shading: HEADER_FILL }),
    ],
  });
  const rows = assets.map((a, i) => {
    const fill = i % 2 === 1 ? ALT_FILL : undefined;
    return new TableRow({
      children: [
        cell(enCell(a.file, { size: 18 }), { width: 2400, shading: fill }),
        cell(heCell(a.bakedText), { width: 2200, shading: fill }),
        cell(enCell(a.usedInScreens.join(", "), { size: 18 }), { width: 1800, shading: fill }),
        cell(enCell(a.note, { size: 16 }), { width: 2626, shading: fill }),
      ],
    });
  });
  return [
    new Paragraph({ heading: HeadingLevel.HEADING_1, pageBreakBefore: true, children: [new TextRun(heading)] }),
    new Paragraph({
      spacing: { after: 200 },
      children: [new TextRun({
        text: "These images have Hebrew text baked into the graphic itself (not translatable as text). "
          + "They need a fresh export from Figma with Arabic text before the localized version can ship. "
          + assetReport.meta.method,
        size: 20,
      })],
    }),
    new Table({
      width: { size: 2400 + 2200 + 1800 + 2626, type: WidthType.DXA },
      columnWidths: [2400, 2200, 1800, 2626],
      rows: [headerRow, ...rows],
    }),
  ];
}

function regenAppendix() {
  return [
    new Paragraph({ heading: HeadingLevel.HEADING_1, pageBreakBefore: true, children: [new TextRun("Appendix B — Regenerating this export")] }),
    ...[
      "If the Hebrew source (index.html or applet/color_lab.html) changes, regenerate everything with:",
    ].map((t) => new Paragraph({ spacing: { after: 120 }, children: [new TextRun({ text: t, size: 20 })] })),
    new Paragraph({
      spacing: { after: 120 },
      children: [new TextRun({ text: "python3 translation/tools/extract_translations.py", font: "Courier New", size: 20 })],
    }),
    new Paragraph({
      spacing: { after: 200 },
      children: [new TextRun({ text: "node translation/tools/build_docx.js", font: "Courier New", size: 20 })],
    }),
    ...[
      "IDs are stable across regeneration: an entry keeps its ID as long as (screen, type, Hebrew source text) is unchanged, and any Arabic translation already entered in the manifest JSON carries forward automatically.",
      "If a string's Hebrew wording changes or it's removed from the source, its old entry moves to an \"orphaned\" list inside murals_translation_manifest.json instead of being deleted — so an in-progress Arabic translation is never silently lost. Review that list by hand after each regeneration.",
      "translation/tools/verify_coverage.py runs an independent sweep for any learner-facing Hebrew text left outside the manifest — run it after any extraction-logic change.",
      "translation/tools/asset_localization_report.py rebuilds Appendix A from a hand-maintained list — there is no reliable way to auto-detect baked-in image text, so re-review new/changed images by eye and update that script's ASSETS list.",
    ].map((t) => new Paragraph({ spacing: { after: 120 }, bullet: { level: 0 }, children: [new TextRun({ text: t, size: 20 })] })),
  ];
}

// --preview-screens q1,q2 --out <path> --title "..." lets a caller (see
// build_preview_docx.js) render a subset of screens without duplicating any
// of the formatting logic above. Plain `node build_docx.js` with no flags
// keeps producing the full, real export exactly as before.
const argv = process.argv.slice(2);
const flag = (name) => {
  const i = argv.indexOf(`--${name}`);
  return i === -1 ? null : argv[i + 1];
};
const screenFilterArg = flag("preview-screens");
const outArg = flag("out");
const titleArg = flag("title");
const screenFilter = screenFilterArg ? screenFilterArg.split(",") : SCREEN_ORDER;

const children = [
  ...coverPage({ isPreview: !!screenFilterArg, title: titleArg }),
];

for (const screenId of screenFilter) {
  const entries = bySreen.get(screenId);
  if (!entries || entries.length === 0) continue;
  children.push(...screenSection(screenId, entries));
}

if (!screenFilterArg) {
  children.push(...assetAppendix());
  children.push(...regenAppendix());
} else {
  // Preview still shows the asset rows relevant to the previewed screens,
  // for the "screen with an asset requiring localization" sample case.
  const relevantAssets = assetReport.assets.filter((a) =>
    a.usedInScreens.some((s) => screenFilter.includes(s))
  );
  if (relevantAssets.length) {
    children.push(...assetAppendix({ assets: relevantAssets, heading: "Localized assets used on these screens" }));
  }
}

const doc = new Document({
  sections: [{ properties: {}, children }],
  styles: {
    default: {
      document: { run: { font: "Arial", size: 20 } },
    },
  },
});

Packer.toBuffer(doc).then((buf) => {
  const out = outArg ? path.resolve(ROOT, outArg) : path.join(EXPORT_DIR, "murals_translation_he-ar.docx");
  fs.writeFileSync(out, buf);
  console.log("Wrote", out);
});
