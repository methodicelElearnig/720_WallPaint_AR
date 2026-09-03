'use strict';
/* ============================================================
   radio3.js — QUES3 single-choice radio question handler

   Correct answer: option 4 ("1:1")
   States on #screen-q3: data-q3-state="main|tryagain|correct|incorrect"
   Help panel:           data-q3-help="true|false"
   NEXT gate:            data-q-done="true" (set on correct OR incorrect)
   Applet modal:         data-q3-applet-open on #q3-applet-overlay

   Public API (mirrors radio.js pattern):
     initQ3()            — called by onEnterScreen() — resets to main
     selectQ3Option(n)   — click on option row
     toggleQ3Help()      — עזרה button click
     submitQ3()          — צדקתי? button click
     retryQ3()           — "נסו שוב" click
     openQ3Applet()      — ישומון button click
     closeQ3Applet()     — × inside modal

   Option rows reuse .q2-option / .q2-opt-marker / .q2-opt-text CSS.
   ============================================================ */

var q3State = {
  selected: null,   // 1 | 2 | 3 | 4
  attempts: 0       // 0 → first submit; 1 → second submit
};

var Q3_CORRECT = 4;   // option 4 = "1:1"

/* ── init ─────────────────────────────────────────────── */
function initQ3() {
  var screen = document.getElementById('screen-q3');
  if (!screen) return;

  q3State.selected = null;
  q3State.attempts = 0;

  screen.dataset.q3State = 'main';
  screen.dataset.q3Help  = 'false';
  delete screen.dataset.qDone;

  /* Clear option classes (reuses .q2-option structure) */
  screen.querySelectorAll('.q2-option').forEach(function(opt) {
    opt.classList.remove('q2-opt-selected', 'q2-opt-wrong', 'q2-opt-correct');
  });

  var btn = screen.querySelector('.q3-submit-btn');
  if (btn) btn.disabled = true;
  delete screen.dataset.qSubmitReady;

  var overlay = document.getElementById('q3-applet-overlay');
  if (overlay) overlay.classList.remove("open");

  updateNavButtons();
}

/* ── option selection ─────────────────────────────────── */
function selectQ3Option(val) {
  var screen = document.getElementById('screen-q3');
  if (!screen) return;
  var state = screen.dataset.q3State;
  if (state === 'correct' || state === 'incorrect') return;
  if (state === 'tryagain') retryQ3();

  q3State.selected = val;

  screen.querySelectorAll('.q2-option').forEach(function(opt) {
    opt.classList.remove('q2-opt-selected');
    if (parseInt(opt.dataset.value, 10) === val) {
      opt.classList.add('q2-opt-selected');
    }
  });

  var btn = screen.querySelector('.q3-submit-btn');
  if (btn) btn.disabled = false;
  screen.dataset.qSubmitReady = 'true';
}

/* ── help toggle ──────────────────────────────────────── */
function toggleQ3Help() {
  var screen = document.getElementById('screen-q3');
  if (!screen) return;
  screen.dataset.q3Help = (screen.dataset.q3Help === 'true') ? 'false' : 'true';
}

/* ── submit ───────────────────────────────────────────── */
function submitQ3() {
  var screen = document.getElementById('screen-q3');
  if (!screen || q3State.selected === null) return;

  q3State.attempts++;

  if (q3State.selected === Q3_CORRECT) {
    /* ✓ Correct */
    q3MarkOption(Q3_CORRECT, 'correct');
    screen.dataset.q3State = 'correct';
    screen.dataset.qDone   = 'true';
  } else if (q3State.attempts === 1) {
    /* ✗ First wrong → tryagain — option stays selected (no X yet, mirrors QUES2 behavior) */
    screen.dataset.q3State = 'tryagain';
  } else {
    /* ✗ Second wrong → incorrect — reveal correct answer */
    q3MarkOption(q3State.selected, 'wrong');
    q3MarkOption(Q3_CORRECT,       'correct');
    screen.dataset.q3State = 'incorrect';
    screen.dataset.qDone   = 'true';
  }

  updateNavButtons();
}

/* ── retry (נסו שוב) ──────────────────────────────────── */
function retryQ3() {
  var screen = document.getElementById('screen-q3');
  if (!screen) return;

  q3State.selected = null;
  screen.dataset.q3State = 'main';

  screen.querySelectorAll('.q2-option').forEach(function(opt) {
    opt.classList.remove('q2-opt-selected', 'q2-opt-wrong', 'q2-opt-correct');
  });

  var btn = screen.querySelector('.q3-submit-btn');
  if (btn) btn.disabled = true;
}

/* ── applet modal ─────────────────────────────────────── */
function openQ3Applet() {
  var overlay = document.getElementById('q3-applet-overlay');
  if (overlay) overlay.classList.add("open");
}

function closeQ3Applet() {
  var overlay = document.getElementById('q3-applet-overlay');
  if (overlay) overlay.classList.remove("open");
}

/* ── helpers ──────────────────────────────────────────── */
function q3MarkOption(val, type) {
  var screen = document.getElementById('screen-q3');
  if (!screen) return;
  screen.querySelectorAll('.q2-option').forEach(function(opt) {
    if (parseInt(opt.dataset.value, 10) === val) {
      opt.classList.add(type === 'correct' ? 'q2-opt-correct' : 'q2-opt-wrong');
    }
  });
}
