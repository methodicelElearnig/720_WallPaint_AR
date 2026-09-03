# ציור קיר — לומדה אינטראקטיבית
### משרד החינוך — תכנית 720 | כיתה ז' | יחס ופרופורציה

---

## הפעלה

פתח את `index.html` ישירות בדפדפן — אין צורך בשרת.

```
file:///path/to/720_WallPaint/index.html
```

**דפדפנים נתמכים:** Chrome 90+, Firefox 88+, Safari 14+, Edge 90+

---

## מבנה הפרויקט

```
720_WallPaint/
├── index.html          # נקודת כניסה
├── config.js           # הגדרות: URL אפליקציה, נתיבי audio
├── css/                # עיצוב
├── js/                 # לוגיקה
├── assets/             # גרפיקה ושמע
│   ├── backgrounds/
│   ├── characters/
│   ├── illustrations/
│   ├── icons/
│   └── audio/
└── applet/             # אפליקציית מעבדת חקר צבעים
```

---

## Placeholders

### Audio
קבצי קריינות טרם סופקו. כשיתקבלו — יש להניח ב:
```
assets/audio/slide2.mp3
assets/audio/slide3.mp3
assets/audio/slide5.mp3
assets/audio/slide8.mp3
assets/audio/slide10.mp3
```

### Applet (יישומון)
אפליקציית מעבדת חקר צבעים טרם סופקה.
כשתתקבל — יש לעדכן ב-`config.js`:
```javascript
appletUrl: 'applet/index.html'  // או URL חיצוני
```

---

## תיעוד

- [`PROJECT_BRIEF.md`](PROJECT_BRIEF.md) — מטרות, מבנה, ניקוד
- [`ARCHITECTURE.md`](ARCHITECTURE.md) — ארכיטקטורה טכנית מלאה

---

## מפתח

פרויקט זה מפותח על בסיס עיצוב פיגמה.
Figma file: `vUmRePxl3GTK1gPunwDqx1`
