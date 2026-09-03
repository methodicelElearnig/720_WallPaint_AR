/**
 * content.js — כל תוכן הלומדה ומטא-דאטה של מדיה
 *
 * PLACEHOLDER — ערכים יתמלאו לאחר קריאת פיגמה מסך מסך
 *
 * ⚠️ קובץ הפיגמה אינו סופי. מסכים ו-assets יתווספו.
 *
 * כלל מדיה:
 *   videoFile / audioFile = null תמיד (שם קובץ לא hardcoded).
 *   videoKey  / audioKey  = מזהה סמנטי (string) לשימוש המנוע לבניית נתיב.
 *   המנוע: CONFIG.videoBase + screen.videoKey + '.mp4'
 *          CONFIG.audioBase + screen.audioKey + '.mp3'
 *   null = אין מדיה לאותו מסך. המנוע מטפל ב-null בשקט (ללא שגיאה).
 *   כשקובץ יסופק — מעדכנים כאן בלבד, ללא שינוי בקוד המנוע.
 *
 * Schema:
 *
 *   Slide:       { id, figmaId, type:'slide',       audioKey, narration }
 *   Video:       { id, figmaId, type:'video',       videoKey, audioKey, narration }
 *   Video-end:   { id, figmaId, type:'video-end',   videoKey, audioKey, narration }
 *   Slide-applet:{ id, figmaId, type:'slide-applet',audioKey, narration, instructions }
 *   Question:    { id, figmaId, type:'question',    questionType, progressGroup,
 *                  hasApplet, stateFrameIds,
 *                  text, [words, blanks] | [options] | [],
 *                  correct, helpText,
 *                  correctExplanation, incorrectExplanation,
 *                  audioKey }
 *
 *   הערה: videoFile / audioFile אינם בשימוש. המנוע בונה את הנתיב מ-key בלבד.
 */

const CONTENT = {

  screens: [

    // ----------------------------------------------------------
    // SLIDE1 — מסך פתיחה (וידאו)
    // Figma: ⏳ טרם קיים בפיגמה
    // ⚠️ מסך זה אינו מיוצג עדיין בפיגמה — יתווסף בשלב מאוחר
    // גרסת וידאו: ► נעול עד סיום וידאו
    // ----------------------------------------------------------
    {
      id: 'slide1',
      figmaId: null,          // TODO: יתווסף כשהפריים ייווצר בפיגמה
      type: 'video',
      videoKey: 'slide1-opening',  // TODO: שם הקובץ ייקבע בהסכמה עם הלקוח
      audioKey: null,
      narration: ''                // TODO: טקסט קריינות מפיגמה
    },

    // ----------------------------------------------------------
    // SLIDE2 — פתיחה (תוכן ללא וידאו)
    // Figma: 2:6
    // ► תמיד פתוח
    // ----------------------------------------------------------
    {
      id: 'slide2',
      figmaId: '2:6',
      type: 'slide',
      audioKey: 'slide2-narration', // TODO: שם הקובץ ייקבע בהסכמה עם הלקוח
      narration: ''                  // TODO: טקסט קריינות מפיגמה
    },

    // ----------------------------------------------------------
    // SLIDE3 — המורה מסבירה צבעים (וידאו + קריינות מורה)
    // Figma: 2:17
    // ► נעול עד סיום וידאו
    // ----------------------------------------------------------
    {
      id: 'slide3',
      figmaId: '2:17',
      type: 'video',
      videoKey: 'slide3-teacher', // TODO: שם הקובץ ייקבע בהסכמה עם הלקוח
      audioKey: 'slide3-narration',
      narration: ''               // TODO: טקסט קריינות מפיגמה
    },

    // ----------------------------------------------------------
    // QUES1 — Drag & Drop Word Bank
    // Figma main: 2:5 | Progress: 1
    // שאלה: השלמת משפטים על יחס צבעים
    // ----------------------------------------------------------
    {
      id: 'q1',
      figmaId: '2:5',
      type: 'question',
      questionType: 'dragdrop',
      progressGroup: 1,
      hasApplet: false,
      stateFrameIds: {
        main:      '2:5',
        help:      '6:67',
        tryagain:  '6:202',
        correct:   '6:113',
        incorrect: '6:242'
      },
      text: '',   // TODO: טקסט שאלה מפיגמה
      words: [],  // TODO: רשימת chips מפיגמה
      blanks: [], // TODO: [{ id: 'b1', sentence: '...' }, ...]
      correct: {},              // TODO: { b1: '...', b2: '...', b3: '...' }
      helpText: '',             // TODO: מפיגמה 6:67
      correctExplanation: '',   // TODO: מפיגמה 6:113
      incorrectExplanation: '', // TODO: מפיגמה 6:242
      audioKey: null
    },

    // ----------------------------------------------------------
    // SLIDE5 — דניאלה + אפליקציה
    // Figma: 5:7 (main) / 5:15 (applet open)
    // ► נעול עד פתיחת applet
    // ----------------------------------------------------------
    {
      id: 'slide5',
      figmaId: '5:7',
      type: 'slide-applet',
      audioKey: 'slide5-narration', // TODO: שם הקובץ ייקבע בהסכמה עם הלקוח
      narration: '',                 // TODO
      instructions: ''               // TODO: הוראות פעילות (חלק שמאל ב-5:15)
    },

    // ----------------------------------------------------------
    // QUES2 — Radio, 3 options
    // Figma main: 5:31 | Progress: 2 | ישומון: כן
    // שאלה: האם הוספת 12 כוסות צהוב שומרת על היחס?
    // ----------------------------------------------------------
    {
      id: 'q2',
      figmaId: '5:31',
      type: 'question',
      questionType: 'radio',
      progressGroup: 2,
      hasApplet: true,
      stateFrameIds: {
        main:      '5:31',
        help:      '7:195',
        tryagain:  '7:218',
        correct:   '7:303',
        incorrect: '7:332'
      },
      text: '',
      options: [], // TODO: [{ id: 'a', text: '...' }, ...]
      correct: '',
      helpText: '',
      correctExplanation: '',   // TODO: מפיגמה 7:303
      incorrectExplanation: '', // TODO: מפיגמה 7:332
      audioKey: null
    },

    // ----------------------------------------------------------
    // QUES3 — Radio, 4 options
    // Figma main: 7:358 | Progress: 3 | ישומון: כן
    // שאלה: יחס חדש אחרי שפיכת 2 ליטר צהוב
    // ⚠ States 7:422/7:451/7:491 מסומנים ללא שם ב-Figma
    // ----------------------------------------------------------
    {
      id: 'q3',
      figmaId: '7:358',
      type: 'question',
      questionType: 'radio',
      progressGroup: 3,
      hasApplet: true,
      stateFrameIds: {
        main:      '7:358',
        help:      '7:388',
        tryagain:  '7:422',  // ⚠ שם שגוי בפיגמה
        correct:   '7:451',  // ⚠ שם שגוי בפיגמה
        incorrect: '7:491'   // ⚠ שם שגוי בפיגמה
      },
      text: '',
      options: [], // TODO: [{ id: 'a', text: '...' }, ...]
      correct: '',
      helpText: '',
      correctExplanation: '',   // TODO: מפיגמה 7:451
      incorrectExplanation: '', // TODO: מפיגמה 7:491
      audioKey: null
    },

    // ----------------------------------------------------------
    // QUES4 — Radio, 4 fraction options + קריינות מורה
    // Figma main: 7:526 | Progress: 4 | ישומון: כן
    // שאלה: בחר משוואת פרופורציה נכונה
    // ----------------------------------------------------------
    {
      id: 'q4',
      figmaId: '7:526',
      type: 'question',
      questionType: 'radio',
      progressGroup: 4,
      hasApplet: true,
      stateFrameIds: {
        main:      '7:526',
        help:      '9:1183',
        tryagain:  '9:1222',
        correct:   '9:1264',
        incorrect: '9:1309'
      },
      text: '',
      options: [], // TODO: אפשרויות עם שברים — מבנה ייקבע לאחר קריאת פיגמה 7:526
      correct: '',
      helpText: '',
      correctExplanation: '',   // TODO: מפיגמה 9:1264
      incorrectExplanation: '', // TODO: מפיגמה 9:1309
      audioKey: 'ques4-narration'  // קריינות מורה — שם הקובץ ייקבע בהסכמה עם הלקוח
    },

    // ----------------------------------------------------------
    // QUES4B — Radio, 3 fraction options
    // Figma main: 9:1352 | Progress: 4 | ישומון: כן
    // שאלה: בחר תרגיל נכון לפתרון
    // ----------------------------------------------------------
    {
      id: 'q4b',
      figmaId: '9:1352',
      type: 'question',
      questionType: 'radio',
      progressGroup: 4,
      hasApplet: true,
      stateFrameIds: {
        main:      '9:1352',
        help:      '9:1666',
        tryagain:  '9:1701',
        correct:   '9:1743',
        incorrect: '9:1785'
      },
      text: '',
      options: [], // TODO: אפשרויות עם שברים — מבנה ייקבע לאחר קריאת פיגמה 9:1352
      correct: '',
      helpText: '',
      correctExplanation: '',   // TODO: מפיגמה 9:1743
      incorrectExplanation: '', // TODO: מפיגמה 9:1785
      audioKey: null
    },

    // ----------------------------------------------------------
    // QUES4C — Numeric Input
    // Figma main: 9:1824 (שם שגוי בפיגמה: "QUES4B") | Progress: 4 | ישומון: כן
    // שאלה: כמה ליטרים כחול להוסיף?
    // ⚠ כל 5 states מסומנים "QUES4B" בפיגמה — זוהו לפי y-position
    // ----------------------------------------------------------
    {
      id: 'q4c',
      figmaId: '9:1824',
      type: 'question',
      questionType: 'numeric',
      progressGroup: 4,
      hasApplet: true,
      stateFrameIds: {
        main:      '9:1824',  // ⚠ שם שגוי בפיגמה: "QUES4B"
        help:      '9:1854',  // ⚠ שם שגוי בפיגמה
        tryagain:  '9:1920',  // ⚠ שם שגוי בפיגמה
        correct:   '9:1939',  // ⚠ שם שגוי בפיגמה
        incorrect: '9:1964'   // ⚠ שם שגוי בפיגמה
      },
      text: '',
      correct: null,            // TODO: מספר שלם — מפיגמה 9:1939
      helpText: '',
      correctExplanation: '',   // TODO: מפיגמה 9:1939
      incorrectExplanation: '', // TODO: מפיגמה 9:1964
      audioKey: null
    },

    // ----------------------------------------------------------
    // SLIDE8 — ילדה מחזיקה ציור
    // Figma: 8:114
    // ► תמיד פתוח
    // ----------------------------------------------------------
    {
      id: 'slide8',
      figmaId: '8:114',
      type: 'slide',
      audioKey: 'slide8-narration', // TODO: שם הקובץ ייקבע בהסכמה עם הלקוח
      narration: ''                  // TODO
    },

    // ----------------------------------------------------------
    // QUES5 — Radio, 3 options
    // Figma main: 8:122 | Progress: 5
    // שאלה: איזו תערובת מכילה יחס צהוב גבוה יותר?
    // ----------------------------------------------------------
    {
      id: 'q5',
      figmaId: '8:122',
      type: 'question',
      questionType: 'radio',
      progressGroup: 5,
      hasApplet: false,
      stateFrameIds: {
        main:      '8:122',
        help:      '8:225',
        tryagain:  '8:255',
        correct:   '8:280',
        incorrect: '8:408'
      },
      text: '',
      options: [],
      correct: '',
      helpText: '',
      correctExplanation: '',   // TODO: מפיגמה 8:280
      incorrectExplanation: '', // TODO: מפיגמה 8:408
      audioKey: null
    },

    // ----------------------------------------------------------
    // SLIDE10 — ילדים ליד קיר (וידאו)
    // Figma: 8:438
    // ► נעול עד סיום וידאו
    // ----------------------------------------------------------
    {
      id: 'slide10',
      figmaId: '8:438',
      type: 'video',
      videoKey: 'slide10-wall',     // TODO: שם הקובץ ייקבע בהסכמה עם הלקוח
      audioKey: 'slide10-narration',
      narration: ''                  // TODO
    },

    // ----------------------------------------------------------
    // QUES6 — Radio, 4 options
    // Figma main: 8:446 | Progress: 6
    // שאלה: גובה עץ בקנה מידה 1:20
    // ----------------------------------------------------------
    {
      id: 'q6',
      figmaId: '8:446',
      type: 'question',
      questionType: 'radio',
      progressGroup: 6,
      hasApplet: false,
      stateFrameIds: {
        main:      '8:446',
        help:      '8:475',
        tryagain:  '8:514',
        correct:   '8:544',
        incorrect: '8:579'
      },
      text: '',
      options: [], // TODO: אפשרויות מפיגמה 8:446
      correct: '',
      helpText: '',
      correctExplanation: '',   // TODO: מפיגמה 8:544
      incorrectExplanation: '', // TODO: מפיגמה 8:579
      audioKey: null
    },

    // ----------------------------------------------------------
    // QUES7 — Drag & Drop, 2 blanks
    // Figma main: 8:610 | Progress: 7
    // שאלה: השלמת נוסחת כמויות (7א)
    // ----------------------------------------------------------
    {
      id: 'q7',
      figmaId: '8:610',
      type: 'question',
      questionType: 'dragdrop',
      progressGroup: 7,
      hasApplet: false,
      stateFrameIds: {
        main:      '8:610',
        help:      '8:651',
        tryagain:  '8:689',
        correct:   '8:719',
        incorrect: '8:814'
      },
      text: '',
      words: [],  // TODO: chips מפיגמה 8:610
      blanks: [],
      correct: {},
      helpText: '',
      correctExplanation: '',   // TODO: מפיגמה 8:719
      incorrectExplanation: '', // TODO: מפיגמה 8:814
      audioKey: null
    },

    // ----------------------------------------------------------
    // QUES7B — Drag & Drop, 2 blanks
    // Figma main: 8:846 | Progress: 7
    // שאלה: חישוב ליטרים לפי מנות (7ב)
    // ⚠ Frame 8:1099 מסומן "CORRECT" בפיגמה אך הוא INCORRECT
    // ----------------------------------------------------------
    {
      id: 'q7b',
      figmaId: '8:846',
      type: 'question',
      questionType: 'dragdrop',
      progressGroup: 7,
      hasApplet: false,
      stateFrameIds: {
        main:      '8:846',
        help:      '8:967',
        tryagain:  '8:1034',
        correct:   '8:1063',
        incorrect: '8:1099'   // ⚠ שם שגוי בפיגמה: "CORRECT"
      },
      text: '',
      words: [],  // TODO: chips מפיגמה 8:846
      blanks: [],
      correct: {},
      helpText: '',
      correctExplanation: '',   // TODO: מפיגמה 8:1063
      incorrectExplanation: '', // TODO: מפיגמה 8:1099
      audioKey: null
    },

    // ----------------------------------------------------------
    // SLIDE18 — מסך סיום (וידאו סגירה)
    // Figma: 2:2
    // וידאו-end: בסיום הוידאו מופיע כפתור "סיום" → פופ-אפ ציון
    // ----------------------------------------------------------
    {
      id: 'slide18',
      figmaId: '2:2',
      type: 'video-end',
      videoKey: 'slide18-closing', // TODO: שם הקובץ ייקבע בהסכמה עם הלקוח
      audioKey: null,
      narration: ''                // TODO: בלוני דיבור מפיגמה (אם יש)
    }

  ] // end screens

}; // end CONTENT
