/**
 * config.js — הגדרות גלובליות
 *
 * WHY THIS FILE EXISTS (not in figma-lomda-builder skill standard):
 *   הפרויקט כולל iframe applet ("מעבדת חקר צבעים") המוטמע ב-SLIDE5
 *   ובשאלות QUES2–QUES4C. ה-URL של האפליקציה יסופק על ידי הלקוח
 *   בשלב מאוחר יותר. config.js מאפשר עדכון URL יחיד במקום אחד.
 *
 * ערוך קובץ זה כדי לחבר את ה-applet וקבצי ה-audio.
 */
const CONFIG = {
  // URL לאפליקציית מעבדת חקר צבעים
  // כשהapplet יסופק — עדכן כאן (נתיב יחסי או URL)
  appletUrl: 'applet/placeholder.html',

  // בסיס לנתיבי audio — מיושר עם תקן הסקיל: audio/ בשורש
  audioBase: 'audio/',

  // בסיס לנתיבי וידאו — video/ בשורש
  videoBase: 'video/'
};
