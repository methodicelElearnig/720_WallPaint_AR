'use strict';
/* ============================================================
   radio4.js — QUES4A multi-select question handler

   Correct answers: options 2 ("2/3 = 16/X") and 4 ("3/2 = X/16")
   States on #screen-q4: data-q4-state="main|tryagain|correct|incorrect"
   Help panel:           data-q4-help="true|false"
   NEXT gate:            data-q-done="true" (set on correct OR incorrect)
   Applet modal:         data-q4-applet-open on #q4-applet-overlay

   Key difference from radio.js / radio3.js:
     Multi-select — learner may pick more than one option (toggle).
     Submit is correct only when the exact set {2, 4} is selected.
     Two-attempt rule mirrors QUES2/QUES3.

   Public API:
     initQ4()            — called by onEnterScreen() — resets to main
     selectQ4Option(n)   — click on option (toggles selection)
     toggleQ4Help()      — עזרה button click
     submitQ4()          — צדקתי? button click
     retryQ4()           — "נסו שוב" click
     openQ4Applet()      — ישומון button click
     closeQ4Applet()     — × inside modal
   ============================================================ */

var q4State = {
  selected: [],   /* array of currently-selected values */
  attempts: 0
};

var Q4A_CORRECT = [2, 4];   /* correct answer values */

/* ── helpers ──────────────────────────────────────────── */
function q4SetsMatch(arr) {
  if (arr.length !== Q4A_CORRECT.length) return false;
  var sorted = arr.slice().sort(function(a,b){ return a-b; });
  for (var i = 0; i < sorted.length; i++) {
    if (sorted[i] !== Q4A_CORRECT[i]) return false;
  }
  return true;
}

/* ── init ─────────────────────────────────────────────── */
var _q4AudioTimer = null;

function initQ4() {
  var screen = document.getElementById('screen-q4');
  if (!screen) return;

  q4State.selected = [];
  q4State.attempts = 0;

  screen.dataset.q4State = 'main';
  screen.dataset.q4Help  = 'false';
  delete screen.dataset.qDone;

  screen.querySelectorAll('.q4-option').forEach(function(opt) {
    opt.classList.remove('q4-opt-selected', 'q4-opt-wrong', 'q4-opt-correct');
  });

  var btn = screen.querySelector('.q4-submit-btn');
  if (btn) btn.disabled = true;

  var overlay = document.getElementById('q4-applet-overlay');
  if (overlay) overlay.classList.remove("open");

  /* Reset audio-gated elements */
  ['.q4-question', '.q4-options', '.q4-submit-btn', '.q4-help-btn', '.q4-app-btn', '.q4-progress']
    .forEach(function(sel) {
      var el = screen.querySelector(sel);
      if (el) el.classList.remove('q4-revealed');
    });

  /* Clear any pending audio timer */
  if (_q4AudioTimer) { clearTimeout(_q4AudioTimer); _q4AudioTimer = null; }
  var audio = document.getElementById('q4-audio');
  if (audio) { audio.pause(); audio.currentTime = 0; audio.onended = null; }

  updateNavButtons();
}

/* ── entrance audio sequence (called from onEnterScreen) ─ */
function startQ4AudioSequence() {
  var screen = document.getElementById('screen-q4');
  var audio  = document.getElementById('q4-audio');
  if (!screen || !audio) return;

  /* Start narration after illustration animation finishes (0.3s delay + 0.4s duration) */
  _q4AudioTimer = setTimeout(function() {
    audio.playbackRate = 1.1;
    audio.play().catch(function() {});

    audio.onended = function() {
      audio.onended = null;
      /* Reveal question */
      var q = screen.querySelector('.q4-question');
      if (q) q.classList.add('q4-revealed');
      /* Reveal options + buttons 2.5s after question */
      ['.q4-options', '.q4-submit-btn', '.q4-help-btn', '.q4-app-btn', '.q4-progress']
        .forEach(function(sel) {
          var el = screen.querySelector(sel);
          if (el) el.classList.add('q4-revealed');
        });
    };
  }, 800);
}

/* ── option selection (toggle) ─────────────────────────── */
function selectQ4Option(val) {
  var screen = document.getElementById('screen-q4');
  if (!screen) return;
  var state = screen.dataset.q4State;
  if (state === 'correct' || state === 'incorrect') return;
  if (state === 'tryagain') retryQ4();

  var idx = q4State.selected.indexOf(val);
  if (idx === -1) {
    q4State.selected.push(val);
  } else {
    q4State.selected.splice(idx, 1);
  }

  screen.querySelectorAll('.q4-option').forEach(function(opt) {
    var v = parseInt(opt.dataset.value, 10);
    opt.classList.toggle('q4-opt-selected', q4State.selected.indexOf(v) !== -1);
  });

  var btn = screen.querySelector('.q4-submit-btn');
  if (btn) btn.disabled = (q4State.selected.length === 0);
}

/* ── help toggle ──────────────────────────────────────── */
function toggleQ4Help() {
  var screen = document.getElementById('screen-q4');
  if (!screen) return;
  screen.dataset.q4Help = (screen.dataset.q4Help === 'true') ? 'false' : 'true';
}

/* ── submit ───────────────────────────────────────────── */
function submitQ4() {
  var screen = document.getElementById('screen-q4');
  if (!screen || q4State.selected.length === 0) return;

  q4State.attempts++;

  if (q4SetsMatch(q4State.selected)) {
    /* ✓ Correct */
    Q4A_CORRECT.forEach(function(v) { q4MarkOption(v, 'correct'); });
    screen.dataset.q4State = 'correct';
    screen.dataset.qDone   = 'true';

  } else if (q4State.attempts === 1) {
    /* ✗ First wrong → tryagain (no marks yet, mirrors QUES2/3 behaviour) */
    screen.dataset.q4State = 'tryagain';

  } else {
    /* ✗ Second wrong → incorrect — reveal correct + mark wrongly-selected */
    q4State.selected.forEach(function(v) {
      if (Q4A_CORRECT.indexOf(v) === -1) q4MarkOption(v, 'wrong');
    });
    Q4A_CORRECT.forEach(function(v) { q4MarkOption(v, 'correct'); });
    screen.dataset.q4State = 'incorrect';
    screen.dataset.qDone   = 'true';
  }

  updateNavButtons();
}

/* ── retry (נסו שוב) ──────────────────────────────────── */
function retryQ4() {
  var screen = document.getElementById('screen-q4');
  if (!screen) return;

  q4State.selected = [];
  screen.dataset.q4State = 'main';

  screen.querySelectorAll('.q4-option').forEach(function(opt) {
    opt.classList.remove('q4-opt-selected', 'q4-opt-wrong', 'q4-opt-correct');
  });

  var btn = screen.querySelector('.q4-submit-btn');
  if (btn) btn.disabled = true;
}

/* ── applet modal ─────────────────────────────────────── */
function openQ4Applet() {
  var overlay = document.getElementById('q4-applet-overlay');
  if (overlay) overlay.classList.add("open");
}

function closeQ4Applet() {
  var overlay = document.getElementById('q4-applet-overlay');
  if (overlay) overlay.classList.remove("open");
}

/* ── mark option ──────────────────────────────────────── */
function q4MarkOption(val, type) {
  var screen = document.getElementById('screen-q4');
  if (!screen) return;
  screen.querySelectorAll('.q4-option').forEach(function(opt) {
    if (parseInt(opt.dataset.value, 10) === val) {
      opt.classList.add(type === 'correct' ? 'q4-opt-correct' : 'q4-opt-wrong');
    }
  });
}
