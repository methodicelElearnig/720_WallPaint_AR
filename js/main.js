/**
 * main.js — ScreenManager + viewport scaling + postMessage bridge
 *
 * Core functions (per figma-lomda-builder skill):
 *   scaleApp()         — מתאים #app-scaler לגודל החלון
 *   goTo(n)            — ניווט למסך n
 *   resetScreenState() — מאפס UI בעת חזרה למסך
 *
 * postMessage bridge — נדרש עבור index_dev.html:
 *   Chrome חוסם contentWindow.goTo() ב-file:// protocol.
 *   index_dev.html שולח { type: 'DEV_GOTO', screen: n }
 *   main.js מאזין ומפעיל goTo(n).
 *
 * PLACEHOLDER — לא מיושם עדיין
 */

'use strict';

const TOTAL_SCREENS = 16;
// סדר: slide2(0), slide3(1), q1(2), slide5(3), q2(4), q3(5),
//       q4(6), q4b(7), q4c(8), slide8(9), q5(10),
//       slide10(11), q6(12), q7(13), q7b(14), slide18(15)
let currentScreen = 0;

/* ─── Viewport scaling ───────────────────────────────────── */
function scaleApp() {
  const scaler = document.getElementById('app-scaler');
  if (!scaler) return;
  const scale = Math.min(window.innerWidth / 1920, window.innerHeight / 1080);
  const left  = (window.innerWidth  - 1920 * scale) / 2;
  const top   = (window.innerHeight - 1080 * scale) / 2;
  scaler.style.transform = `scale(${scale})`;
  scaler.style.left = left + 'px';
  scaler.style.top  = top  + 'px';
}
window.addEventListener('resize', scaleApp);
scaleApp();
// Initial nav state (runs after DOM is ready since scripts load at end of body)
updateNavButtons();

/* ─── Screen navigation ──────────────────────────────────── */
function goTo(n) {
  const screens = document.querySelectorAll('.screen');
  if (n < 0 || n >= screens.length) return;
  resetScreenState();
  screens[currentScreen].classList.remove('active');
  currentScreen = n;
  screens[currentScreen].classList.add('active');
  onEnterScreen(screens[currentScreen]);
  updateNavButtons();
  // TODO: trigger audio narration for new screen (audio.js)
}

/* updateNavButtons — מנהל מצב disabled של חצי הניווט
   RTL: .nav-next = שמאל = קדימה | .nav-prev = ימין = אחורה

   שכבות:
     1. גבולות: PREV disabled במסך 0, NEXT disabled במסך אחרון
     2. וידאו-גייט: NEXT נעול אם data-video-gate מצביע לוידאו שטרם נצפה
     3. שאלה-גייט: NEXT נעול אם data-q-state קיים ו-data-q-done !== 'true'
*/
function updateNavButtons() {
  const screens = document.querySelectorAll('.screen');
  const activeScreen = screens[currentScreen];
  if (!activeScreen) return;
  const prev = activeScreen.querySelector('.nav-prev');
  const next = activeScreen.querySelector('.nav-next');
  if (prev) prev.disabled = (currentScreen <= 0);
  if (next) {
    const atLastScreen = (currentScreen >= screens.length - 1);

    // Video gate
    const videoGateId = activeScreen.dataset.videoGate;
    let   videoLocked = false;
    if (videoGateId) {
      const gateVideo = document.getElementById(videoGateId);
      videoLocked = !gateVideo || gateVideo.dataset.watched !== 'true';
    }

    // Question gate — NEXT נעול עד השלמת שאלה (correct או incorrect)
    const isQuestionScreen = activeScreen.dataset.qState !== undefined;
    const questionLocked   = isQuestionScreen && activeScreen.dataset.qDone !== 'true';

    // Applet gate — NEXT נעול עד פתיחת applet (data-applet-gate על המסך)
    const hasAppletGate  = activeScreen.dataset.appletGate === 'true';
    const appletLocked   = hasAppletGate && activeScreen.dataset.appletOpened !== 'true';

    next.disabled = atLastScreen || videoLocked || questionLocked || appletLocked;
  }
}

/* markVideoWatched — מסמן וידאו כ"נצפה" ומשחרר את נעילת ה-►
   נקרא מ: onended (הפעלה תקינה) + onerror (graceful fallback לקובץ placeholder)
*/
function markVideoWatched(videoId) {
  const video = document.getElementById(videoId);
  if (video) video.dataset.watched = 'true';
  updateNavButtons();
}

function resetScreenState() {
  // Pause all videos when leaving any screen
  document.querySelectorAll('video').forEach(function(v) {
    v.pause();
  });

  // Stop slide3 audio when leaving
  ['slide3-audio-stav','slide3-audio-yellow','slide3-audio-blue'].forEach(function(id) {
    var a = document.getElementById(id);
    if (a) { a.pause(); a.currentTime = 0; a.onended = null; }
  });

  // Stop Q4 audio when leaving
  var q4audio = document.getElementById('q4-audio');
  if (q4audio) { q4audio.pause(); q4audio.currentTime = 0; q4audio.onended = null; }

  // Called before navigating AWAY from currentScreen.
  // Answered questions (qDone=true) → preserve state (lומד רואה מצב אחרון).
  // Unanswered questions → reset to initial state.
  const screens = document.querySelectorAll('.screen');
  const leavingScreen = screens[currentScreen];
  if (!leavingScreen) return;

  // QUES1
  if (leavingScreen.id === 'screen-q1' && leavingScreen.dataset.qDone !== 'true') {
    initQ1();
  }
  // SLIDE5 — סגור applet ויזואלית בעת יציאה מהמסך
  if (leavingScreen.id === 'screen-slide5') {
    leavingScreen.dataset.s5State = 'closed';
  }
  // QUES2
  if (leavingScreen.id === 'screen-q2' && leavingScreen.dataset.qDone !== 'true') {
    initQ2();
  }
  // QUES3
  if (leavingScreen.id === 'screen-q3' && leavingScreen.dataset.qDone !== 'true') {
    initQ3();
  }
  // QUES4A
  if (leavingScreen.id === 'screen-q4' && leavingScreen.dataset.qDone !== 'true') {
    initQ4();
  }
  // QUES4B
  if (leavingScreen.id === 'screen-q4b' && leavingScreen.dataset.qDone !== 'true') {
    initQ4b();
  }
  // QUES4C
  if (leavingScreen.id === 'screen-q4c' && leavingScreen.dataset.qDone !== 'true') {
    initQ4c();
  }
  // QUES5
  if (leavingScreen.id === 'screen-q5' && leavingScreen.dataset.qDone !== 'true') {
    initQ5();
  }
  // QUES6
  if (leavingScreen.id === 'screen-q6' && leavingScreen.dataset.qDone !== 'true') {
    initQ6();
  }
  // QUES7
  if (leavingScreen.id === 'screen-q7' && leavingScreen.dataset.qDone !== 'true') {
    initQ7();
  }
  // QUES7B
  if (leavingScreen.id === 'screen-q7b' && leavingScreen.dataset.qDone !== 'true') {
    initQ7b();
  }
}

/* onEnterScreen — נקרא בכניסה למסך חדש (אחרי goTo)
   מאפשר לכל מסך לאתחל את מצבו מחדש / לשחזר sessionStorage */
function onEnterScreen(screenEl) {
  if (!screenEl) return;
  // QUES1 — sync JS state with DOM state on every entry
  if (screenEl.id === 'screen-q1') {
    if (screenEl.dataset.qDone === 'true') {
      // Restore done flag to JS state so DnD remains locked on completed question
      q1State.done = true;
    } else {
      initQ1();
    }
  }
  if (screenEl.id === 'screen-slide2') {
    var s2next = screenEl.querySelector('.nav-next');
    if (s2next) {
      setTimeout(function() {
        s2next.disabled = true;
        setTimeout(function() { s2next.disabled = false; }, 4000);
      }, 0);
    }
  }
  if (screenEl.id === 'screen-slide3') { initSlide3(); }
  if (screenEl.id === 'screen-slide5') { initS5(); }
  if (screenEl.id === 'screen-q2') { initQ2(); }
  if (screenEl.id === 'screen-q3') { initQ3(); }
  if (screenEl.id === 'screen-q4')  { initQ4(); startQ4AudioSequence(); }
  if (screenEl.id === 'screen-q4b') { initQ4b(); }
  if (screenEl.id === 'screen-q4c') { initQ4c(); }
  if (screenEl.id === 'screen-q5')  { initQ5();  }
  if (screenEl.id === 'screen-q6')  { initQ6();  }
  if (screenEl.id === 'screen-q7')  { initQ7();  }
  if (screenEl.id === 'screen-q7b')    { initQ7b(); }
  if (screenEl.id === 'screen-slide1')  { initSlide1();  }
  if (screenEl.id === 'screen-slide10') { initSlide10(); }
  if (screenEl.id === 'screen-slide18') { initSlide18(); }
}

/* ─── Dev mode: postMessage bridge ──────────────────────── */
window.addEventListener('message', (e) => {
  if (!e.data || e.data.type !== 'DEV_GOTO') return;
  const n = parseInt(e.data.screen, 10);
  if (!isNaN(n)) goTo(n);
});

// Notify index_dev.html of actual screen count (DOM-based, auto-updates)
if (window.parent !== window) {
  const screenCount = document.querySelectorAll('.screen').length;
  window.parent.postMessage({ type: 'DEV_READY', total: screenCount }, '*');
}
