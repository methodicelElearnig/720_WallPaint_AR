# ARCHITECTURE — ציור קיר (720 WallPaint)

## עקרונות

- HTML5 + CSS3 + Vanilla JS בלבד — ללא frameworks, ללא build tools
- Single HTML file (`index.html`) — כל המסכים inline
- RTL מלא (`dir="rtl"`, `direction: rtl`)
- נתיבים יחסיים בלבד — עובד מ-`file://`
- Figma הוא Source of Truth לעיצוב — **מצב נוכחי: לא סופי**

### Future-proofing

הארכיטקטורה בנויה לתמוך בהרחבה עתידית ללא שינויים במנוע הניווט:
- מסכים נוספים: הוספת entry ל-`CONTENT.screens` בלבד
- וידאו נוסף: הוספת `videoFile` לכל מסך ב-`content.js`
- Audio נוסף: הוספת `audioFile` לכל מסך ב-`content.js`
- שמות קבצי מדיה אינם hardcoded — מוגדרים ב-`content.js` בלבד

---

## מבנה תיקיות

```
720_WallPaint/
├── index.html              # כל המסכים inline כ-sections
├── index_dev.html          # כלי פיתוח — ניווט חופשי בלי gating
├── config.js               # URL applet, נתיבי media (ניתן לעריכה)
│
├── css/
│   └── style.css           # כל ה-CSS — קובץ יחיד (תקן figma-lomda-builder)
│                           # מכיל: variables, reset, base, layout,
│                           #        screens, nav, progress, slides,
│                           #        questions, animations
│
├── js/
│   ├── main.js             # ScreenManager + scaleApp + goTo + postMessage bridge
│   ├── engine.js           # QuestionEngine — state machine + scoring
│   ├── audio.js            # AudioManager — graceful fallback
│   ├── questions/
│   │   ├── dragdrop.js     # DragDropQuestion + touch polyfill
│   │   ├── radio.js        # RadioQuestion
│   │   └── numeric.js      # NumericQuestion
│   └── data/
│       └── content.js      # כל תוכן, מדיה ומטא-דאטה של המסכים
│
├── img/                    # כל assets — PNG/SVG/WEBP (תקן figma-lomda-builder)
│   │                       # naming: bg-slide2.png, bg-slide3.png,
│   │                       #         char-teacher.png, illu-ques1.png,
│   │                       #         arrow-nav.png, help-btn-open.png, ...
│   └── .gitkeep
│
├── video/                  # קבצי וידאו — MP4/WEBM (placeholders עד שיסופקו)
│   └── .gitkeep
│
├── audio/                  # קריינות — MP3 (תקן figma-lomda-builder)
│   │                       # placeholders עד שיסופקו
│   └── .gitkeep
│
├── applet/
│   └── placeholder.html    # iframe placeholder עד שהapplet יסופק
│                           # (config.js נשמר בגלל applet — אינו בתקן הסקיל)
│
├── PROJECT_BRIEF.md
├── ARCHITECTURE.md
└── README.md
```

---

## זרימת למידה (17 מסכים)

```
index  screen  id        type            gating
  0      0     slide1    video           ► נעול עד סיום וידאו   ← ⏳ טרם בפיגמה
  1      1     slide2    slide           ► תמיד פתוח
  2      2     slide3    video           ► נעול עד סיום וידאו
  3      3     q1        question        ► נעול עד תשובה
  4      4     slide5    slide-applet    ► נעול עד פתיחת applet
  5      5     q2        question        ► נעול עד תשובה
  6      6     q3        question        ► נעול עד תשובה
  7      7     q4        question        ► נעול עד תשובה
  8      8     q4b       question        ► נעול עד תשובה
  9      9     q4c       question        ► נעול עד תשובה
 10     10     slide8    slide           ► תמיד פתוח
 11     11     q5        question        ► נעול עד תשובה
 12     12     slide10   video           ► נעול עד סיום וידאו
 13     13     q6        question        ► נעול עד תשובה
 14     14     q7        question        ► נעול עד תשובה
 15     15     q7b       question        ► נעול עד תשובה
 16     16     slide18   video-end       כפתור סיום → פופ-אפ ציון (אין ►)
```

---

## ארכיטקטורת JS

### ScreenManager (`js/main.js`)

אחראי על ניווט בין מסכים, viewport scaling, postMessage bridge.

```
TOTAL_SCREENS    — מספר המסכים הכולל (נגזר מ-DOM)
currentScreen    — אינדקס המסך הנוכחי (0-based)

scaleApp()       — מחשב scale ומיישם transform על #app-scaler
goTo(n)          — ניווט לפי אינדקס + resetScreenState()
resetScreenState() — מאפס UI; דולג על מסכים עם screenNDone=true
unlock(screenId) — מפעיל ► למסך נתון
updateProgress() — עדכון מחוון 1–7
showScorePopup() — מציג פופ-אפ ציון סופי (לאחר SLIDE18)
```

**קריטריוני נעילה לפי type:**

| type | תנאי לפתיחת ► |
|------|---------------|
| `slide` | תמיד פתוח |
| `video` | `videoWatched[screenId] === true` (sessionStorage) |
| `slide-applet` | `appletOpened === true` |
| `question` | `state === 'correct' \|\| state === 'incorrect'` |
| `video-end` | אין ►; כפתור סיום מופיע אחרי `ended` |

**ניווט חזרה לשאלה שנפתרה:** state אחרון נשמר, לא ניתן לשינוי.

**postMessage bridge (נדרש עבור `index_dev.html`):**
```js
// מקבל: { type: 'DEV_GOTO', screen: n }
// שולח: { type: 'DEV_READY', total: screenCount }
```

### QuestionEngine (`js/engine.js`)

State machine לכל שאלה + חישוב ציון.

```
מצב per שאלה:
  id            — 'q1' ... 'q7b'
  type          — 'dragdrop' | 'radio' | 'numeric'
  attempts      — 0 | 1 | 2
  state         — 'main' | 'tryagain' | 'correct' | 'incorrect'
  helpUsed      — boolean
  appletOpened  — boolean
  score         — null | 0 | 1 | 2

Transitions:
  submit(answer) →
    correct  → state='correct',   score=2-attempts, unlock(►)
    wrong×1  → state='tryagain',  attempts++
    wrong×2  → state='incorrect', score=0,          unlock(►), showAnswers()

  openHelp()   → helpUsed=true     (ללא השפעה על ניקוד)
  openApplet() → appletOpened=true (ללא השפעה על ניקוד)

getTotalScore() → סכום כל ה-scores (0–20)
isPassing()     → getTotalScore() >= 14  (70% מתוך 20)
```

**Persistence:** sessionStorage לכל מצב שאלה ולכל video-watched flag.

**ציון עובר:** 70% = 14 נקודות מתוך 20.

### VideoManager (בתוך `js/main.js` או module נפרד)

```
videoWatched = {}   — { screenId: boolean } — נשמר ב-sessionStorage

onVideoEnded(screenId) →
  videoWatched[screenId] = true
  sessionStorage.setItem(...)
  unlock(screenId)        // מפעיל ► (או כפתור סיום ב-slide18)

onReturn(screenId) →
  if (videoWatched[screenId]) → ► כבר פתוח, מציג state שנשמר
  else                        → ► נעול, וידאו מתחיל מחדש
```

**כלל:** וידאו מתאפס לתחילה בכל חזרה למסך.
**כלל:** completion state נשמר — לא נאבד בחזרה.

### DragDropQuestion (`js/questions/dragdrop.js`)

```
init(containerEl, data)   — יצירת word bank + drop zones + event listeners
getAnswer()               → { blankId: value, ... }
lock()                    → disable all interactions
showCorrect(answers)      → מסמן נכון/שגוי
reset()                   → מחזיר ל-initial state
```

**Touch polyfill:** touchstart/touchmove/touchend → dragstart/dragover/drop.
**Click-to-place:** קליק על chip → מונח ב-blank הריק הראשון.

### RadioQuestion (`js/questions/radio.js`)

```
init(containerEl, data)   — יצירת custom radio options + toggle behavior
getAnswer()               → selectedValue | null
lock()                    → disable all
showCorrect(correctAnswer) → מסמן נכון/שגוי
```

### NumericQuestion (`js/questions/numeric.js`)

```
init(containerEl, data)   — input[type=number], validation: מספר שלם חיובי
getAnswer()               → number | null
lock()
showCorrect(answer)
```

### AudioManager (`js/audio.js`)

```
play(screenId)   → מנגן audio/[screenId].mp3 (נתיב מ-CONFIG.audioBase)
stop()
replay()
```

**Graceful fallback:** קובץ חסר → שתיקה, אין שגיאה ב-console.
**Autoplay policy:** ממתין ל-user gesture ראשון.
**כלל:** קריינות אינה חוסמת התקדמות אלא אם כן צוין במפורש.

---

## מיפוי מדיה

### מנגנון רזולוציית מדיה

`content.js` מכיל **מפתחות סמנטיים** בלבד — לא שמות קבצים.
המנוע בונה את הנתיב בזמן ריצה:

```js
// בתוך engine / audio manager:
if (screen.audioKey) audio.src = CONFIG.audioBase + screen.audioKey + '.mp3';
if (screen.videoKey) video.src = CONFIG.videoBase + screen.videoKey + '.mp4';
```

- `null` → אין מדיה לאותו מסך; המנוע מטפל בשקט ללא שגיאה
- שמות קבצים סמנטיים ניתנים לשינוי ב-`content.js` בלבד, **ללא שינוי בקוד המנוע**
- שמות אינם hardcoded בשום מקום מחוץ ל-`content.js`

### וידאו — Gating

| מסך | videoKey | gating |
|-----|----------|--------|
| SLIDE1 | `slide1-opening` | ► נעול עד `ended` |
| SLIDE3 | `slide3-teacher` | ► נעול עד `ended` |
| SLIDE10 | `slide10-wall` | ► נעול עד `ended` |
| SLIDE18 | `slide18-closing` | כפתור סיום אחרי `ended` |

`videoKey: null` → `<video>` ריק (placeholder); gating עדיין פעיל לפי type.

### Audio

| מסך | audioKey | הערות |
|-----|----------|-------|
| SLIDE2 | `slide2-narration` | |
| SLIDE3 | `slide3-narration` | כפוף לוידאו |
| SLIDE5 | `slide5-narration` | |
| SLIDE8 | `slide8-narration` | |
| SLIDE10 | `slide10-narration` | כפוף לוידאו |
| QUES4 | `ques4-narration` | קריינות מורה בשאלה |

`audioKey: null` → ללא קריינות. אין שגיאה.

---

## מסך סיום (SLIDE18) — זרימה מפורטת

```
1. לומד מגיע ל-SLIDE18 (video-end)
2. וידאו מתנגן עם native HTML5 controls
3. בסיום הוידאו (ended event):
   → כפתור "סיום" מופיע (מוסתר עד כאן)
   → sessionStorage: videoWatched['slide18'] = true
4. לומד לוחץ "סיום"
5. פופ-אפ ציון נפתח:
   - ציון: X / 20
   - מצב: עבר (≥14) / לא עבר
   - הודעת סיום
   - כפתור X לסגירה
6. לחיצה על X → פופ-אפ נסגר
   - חץ ◄ אחורה זמין כרגיל
   - אין ► קדימה (מסך אחרון)
```

---

## ארכיטקטורת CSS

### CSS Variables (`css/style.css`)

```css
:root {
  /* צבעים — יעודכנו מפיגמה */
  --color-text:     #232020;   /* מאומת מפיגמה */
  --color-correct:  ...;
  --color-incorrect: ...;
  --color-tryagain:  ...;
  --color-help-bg:   ...;
  --color-card-bg:   ...;

  /* טיפוגרפיה — מאומת מפיגמה */
  --font-main:    'Assistant', 'Arial Hebrew', Arial, sans-serif;
  --font-numbers: 'Open Sans', Arial, sans-serif;

  /* layout */
  --screen-width:  1920px;
  --screen-height: 1080px;
}
```

### Screen System

```html
<section class="screen active" data-screen="0" id="screen-slide1">
<section class="screen"        data-screen="1" id="screen-slide2">
```

מסך פעיל = `.screen.active { display: block }`.
כל שאר המסכים: `display: none`.

### Question States

כרטיס שאלה עם class: `.state-main` / `.state-tryagain` / `.state-correct` / `.state-incorrect`.

### RTL

```css
html, body { direction: rtl; }
```

חצי ניווט: RTL — `◄` = קדימה (next), `►` = אחורה (prev).
**כלל:** לא להפוך direction על container שלם — לתקן רק element ספציפי.

---

## Data Structure (`js/data/content.js`)

### Schema לכל מסך

```javascript
// Slide (ללא וידאו)
{ id: 'slide2',  figmaId: '2:6',  type: 'slide',
  audioKey: 'slide2-narration',  // null = ללא קריינות
  narration: ''                  // TODO: טקסט מפיגמה
}

// Video screen
{ id: 'slide1',  figmaId: null,   type: 'video',   // figmaId: null = טרם בפיגמה
  videoKey: 'slide1-opening',    // מפתח סמנטי — שם קובץ ייקבע עם הלקוח
  audioKey: null,
  narration: ''
}

// Video-end (SLIDE18)
{ id: 'slide18', figmaId: '2:2',  type: 'video-end',
  videoKey: 'slide18-closing',
  audioKey: null,
  narration: ''
}

// Slide-applet (SLIDE5)
{ id: 'slide5',  figmaId: '5:7',  type: 'slide-applet',
  audioKey: 'slide5-narration',
  narration: '',
  instructions: ''               // הוראות פעילות ב-applet state
}

// Question
{ id: 'q1', figmaId: '2:5', type: 'question',
  questionType: 'dragdrop',      // 'dragdrop' | 'radio' | 'numeric'
  progressGroup: 1,              // 1–7 (מחוון)
  hasApplet: false,
  stateFrameIds: { main, help, tryagain, correct, incorrect },
  text: '',
  words: [], blanks: [], correct: {},   // dragdrop
  // options: [], correct: '',           // radio
  // correct: null,                      // numeric
  helpText: '',
  correctExplanation: '',
  incorrectExplanation: '',
  audioKey: null                 // מפתח קריינות בשאלה (כמו QUES4: 'ques4-narration')
}
```

**כלל רזולוציה (לפיתוח):**
```js
// audio
if (screen.audioKey) audio.src = CONFIG.audioBase + screen.audioKey + '.mp3';

// video
if (screen.videoKey) video.src = CONFIG.videoBase + screen.videoKey + '.mp4';
```

---

## Applet / יישומון

### שימוש כפול
1. **SLIDE5 — inline:** לחיצה על phone-frame → applet נפתח (class toggle) → unlock(►)
2. **QUES2/3/4/4B/4C — modal:** כפתור "ישומון" → modal overlay עם `<iframe>`

### config.js
```javascript
const CONFIG = {
  appletUrl: 'applet/placeholder.html',  // יוחלף ב-URL הסופי
  audioBase: 'audio/',
  videoBase: 'video/'                    // בסיס לנתיבי וידאו
};
```

---

## מחוון התקדמות

7 עיגולים: `1 2 3 4 5 6 7`

| עיגול | שאלות | תנאי ✓ |
|-------|-------|--------|
| 1 | QUES1 | QUES1 הושלמה |
| 2 | QUES2 | QUES2 הושלמה |
| 3 | QUES3 | QUES3 הושלמה |
| 4 | QUES4 + QUES4B + QUES4C | כל שלושתן הושלמו |
| 5 | QUES5 | QUES5 הושלמה |
| 6 | QUES6 | QUES6 הושלמה |
| 7 | QUES7 + QUES7B | שתיהן הושלמו |

עיגולים: לא לחיצים (disabled navigation).

---

## ניקוד — Scoring

| תנאי | ניקוד |
|------|-------|
| נכון בניסיון 1 | 2 |
| נכון בניסיון 2 | 1 |
| שגוי (×2) | 0 |
| עזרה / ישומון | ללא השפעה |

**מקסימום: 20 נקודות** (10 שאלות × 2)
**ציון עובר: 70%** = 14/20 נקודות

---

## Figma Frame Reference (לפיתוח)

⚠️ **קובץ הפיגמה אינו סופי.** מסכים נוספים ו-assets יתווספו.

| מסך | Frame ID | הערות |
|-----|----------|-------|
| SLIDE1 | ⏳ — טרם קיים בפיגמה | וידאו פתיחה |
| SLIDE2 | 2:6 | |
| SLIDE3 | 2:17 | |
| SLIDE5 main | 5:7 | |
| SLIDE5 applet open | 5:15 | |
| SLIDE8 | 8:114 | |
| SLIDE10 | 8:438 | |
| SLIDE18 | 2:2 | וידאו סגירה |
| QUES1 | 2:5 | |
| QUES2 | 5:31 | |
| QUES3 | 7:358 | |
| QUES4 | 7:526 | + קריינות מורה |
| QUES4B | 9:1352 | |
| QUES4C | 9:1824 | שגוי נקרא "QUES4B" בפיגמה |
| QUES5 | 8:122 | |
| QUES6 | 8:446 | |
| QUES7 | 8:610 | |
| QUES7B | 8:846 | |

### States — Frame IDs

| שאלה | main | help | tryagain | correct | incorrect |
|------|------|------|----------|---------|-----------|
| QUES1 | 2:5 | 6:67 | 6:202 | 6:113 | 6:242 |
| QUES2 | 5:31 | 7:195 | 7:218 | 7:303 | 7:332 |
| QUES3 | 7:358 | 7:388 | 7:422* | 7:451* | 7:491* |
| QUES4 | 7:526 | 9:1183 | 9:1222 | 9:1264 | 9:1309 |
| QUES4B | 9:1352 | 9:1666 | 9:1701 | 9:1743 | 9:1785 |
| QUES4C | 9:1824* | 9:1854* | 9:1920* | 9:1939* | 9:1964* |
| QUES5 | 8:122 | 8:225 | 8:255 | 8:280 | 8:408 |
| QUES6 | 8:446 | 8:475 | 8:514 | 8:544 | 8:579 |
| QUES7 | 8:610 | 8:651 | 8:689 | 8:719 | 8:814 |
| QUES7B | 8:846 | 8:967 | 8:1034 | 8:1063 | 8:1099* |

*שם שגוי בפיגמה — זוהה לפי x-position וצילום מסך.

---

## Placeholders — מעקב

| רכיב | מצב | פעולה |
|------|-----|-------|
| SLIDE1 frame בפיגמה | ⏳ טרם נוצר | כשיתווסף — לעדכן figmaId ב-content.js |
| video/*.mp4 | ⏳ חסר | כשיסופק — להוסיף שם ב-content.js.videoFile |
| audio/*.mp3 | ⏳ חסר | כשיסופק — להוסיף שם ב-content.js.audioFile |
| applet/index.html | placeholder | כשיסופק — לעדכן CONFIG.appletUrl |
| פופ-אפ ציון — עיצוב | ⏳ טרם בפיגמה | כשיתווסף — לממש לפי Figma |
| כפתור "סיום" SLIDE18 — עיצוב | ⏳ טרם בפיגמה | כשיתווסף — לממש לפי Figma |
