'use strict';

/* ============================================================
   slide18.js — סרטון סיום + פופאפ ציון

   Flow:
     1. onEnterScreen → initSlide18() → video.play()
     2. video timeupdate → _slide18CheckStopPoint() → עוצר קצת
        לפני הסוף האמיתי (SLIDE18_STOP_BEFORE_END), כי בפריימים
        האחרונים ממש הילדים כבר לא מוצגים בפריים.
        video onended נשאר כרשת ביטחון בלבד למקרה שה-timeupdate
        לא הספיק לתפוס את נקודת העצירה.
     3. עצירה → show "סיימתי" button
     4. click "סיימתי" → openScorePopup() → calculate score + show popup
     5. click ✕ → closeScorePopup()

   Score: 10 questions × 10 pts = 100 max
   Report: 70+ = success (postMessage to parent)
   ============================================================ */

/* שניות לפני סוף הסרטון בהן יש לעצור — הפריים האחרון "האמיתי" שבו
   הילדים עדיין מוצגים במלואם (בפריימים שממש בסוף הם כבר נעלמים) */
var SLIDE18_STOP_BEFORE_END = 0.3;

var _slide18Stopped = false;

function initSlide18() {
  var video   = document.getElementById('slide18-video');
  var doneBtn = document.getElementById('slide18-done-btn');
  var overlay = document.getElementById('slide18-pre-overlay');

  _slide18Stopped = false;
  if (video) {
    video.pause();
    video.currentTime = 0;
    video.ontimeupdate = _slide18CheckStopPoint;
  }
  if (doneBtn) doneBtn.classList.remove('slide18-done-btn--visible');
  if (overlay) overlay.classList.remove('slide18-pre-overlay--hidden');
}

function startSlide18Video() {
  var overlay = document.getElementById('slide18-pre-overlay');
  var video   = document.getElementById('slide18-video');
  if (overlay) overlay.classList.add('slide18-pre-overlay--hidden');
  if (video)   video.play().catch(function() {});
}

/* נקרא בכל timeupdate — עוצר את הסרטון ברגע שמגיעים לנקודת העצירה,
   לפני שהילדים נעלמים מהפריים בסוף הסרטון בפועל */
function _slide18CheckStopPoint() {
  var video = document.getElementById('slide18-video');
  if (!video || _slide18Stopped || !isFinite(video.duration)) return;

  var stopAt = Math.max(0, video.duration - SLIDE18_STOP_BEFORE_END);
  if (video.currentTime >= stopAt) {
    _freezeSlide18AtStopPoint(stopAt);
  }
}

/* עוצר את הסרטון וקופא בנקודת stopAt — נקראת פעם אחת בלבד */
function _freezeSlide18AtStopPoint(stopAt) {
  var video = document.getElementById('slide18-video');
  if (!video || _slide18Stopped) return;
  _slide18Stopped = true;

  video.pause();
  video.currentTime = stopAt;

  var doneBtn = document.getElementById('slide18-done-btn');
  if (doneBtn) doneBtn.classList.add('slide18-done-btn--visible');
}

/* רשת ביטחון: אם הסרטון בכל זאת הגיע לסוף האמיתי בלי שה-timeupdate
   תפס את נקודת העצירה (למשל אם duration לא היה זמין בזמן) */
function onSlide18VideoEnded() {
  var video = document.getElementById('slide18-video');
  if (video && isFinite(video.duration)) {
    _freezeSlide18AtStopPoint(Math.max(0, video.duration - SLIDE18_STOP_BEFORE_END));
    return;
  }

  var doneBtn = document.getElementById('slide18-done-btn');
  if (doneBtn) doneBtn.classList.add('slide18-done-btn--visible');
}

/* ── Score calculation ─────────────────────────────────────── */
function calculateScore() {
  /* Radio / numeric questions: 10 pts if correct, 0 otherwise */
  var radioQuestions = [
    { id: 'screen-q2',  attr: 'q2State'  },
    { id: 'screen-q3',  attr: 'q3State'  },
    { id: 'screen-q4',  attr: 'q4State'  },
    { id: 'screen-q4b', attr: 'q4bState' },
    { id: 'screen-q4c', attr: 'q4cState' },
    { id: 'screen-q5',  attr: 'q5State'  },
    { id: 'screen-q6',  attr: 'q6State'  },
  ];

  /* Drag-drop questions: partial credit stored in data-qScore */
  var dragDropIds = ['screen-q1', 'screen-q7', 'screen-q7b'];

  var score = 0;

  radioQuestions.forEach(function(q) {
    var el = document.getElementById(q.id);
    if (!el) return;
    if (el.dataset[q.attr] === 'correct') score += 10;
  });

  dragDropIds.forEach(function(id) {
    var el = document.getElementById(id);
    if (!el || el.dataset.qScore === undefined) return;
    score += parseFloat(el.dataset.qScore) || 0;
  });

  return Math.round(score);
}

/* ── Popup ─────────────────────────────────────────────────── */
function openScorePopup() {
  var score = calculateScore();
  var overlay = document.getElementById('score-popup-overlay');
  var valueEl = document.getElementById('score-popup-value');
  if (!overlay || !valueEl) return;

  valueEl.textContent = score;
  overlay.style.display = 'flex';

  /* Report to LMS / parent frame */
  var success = (score >= 70);
  if (window.parent !== window) {
    window.parent.postMessage({
      type:    'SCORE',
      score:   score,
      success: success
    }, '*');
  }
}

function closeScorePopup() {
  var overlay = document.getElementById('score-popup-overlay');
  if (overlay) overlay.style.display = 'none';
}
