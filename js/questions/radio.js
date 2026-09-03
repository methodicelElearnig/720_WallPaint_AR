'use strict';
/* ============================================================
   radio.js — QUES2 single-choice radio question handler

   Correct answer: option 3 ("אלון טועה, צריך להוסיף רק 8 כוסות")
   States on #screen-q2: data-q2-state="main|tryagain|correct|incorrect"
   Help panel:           data-q2-help="true|false"
   NEXT gate:            data-q-done="true" (set on correct OR incorrect)
   Applet modal:         data-q2-applet-open on #q2-applet-overlay

   Public API:
     initQ2()            — called by onEnterScreen() — resets to main
     selectQ2Option(n)   — click on option row
     toggleQ2Help()      — עזרה button click
     submitQ2()          — צדקתי? button click
     retryQ2()           — "נסו שוב" click
     openQ2Applet()      — ישומון button click
     closeQ2Applet()     — × inside modal
   ============================================================ */

var q2State = {
  selected: null,  // 1 | 2 | 3
  attempts: 0      // 0 → first submit; 1 → second submit
};

var Q2_CORRECT = 3;  // option 3 = "אלון טועה, 8 כוסות"

/* ── init ─────────────────────────────────────────────── */
function initQ2() {
  var screen = document.getElementById('screen-q2');
  if (!screen) return;

  q2State.selected = null;
  q2State.attempts = 0;

  screen.dataset.q2State = 'main';
  screen.dataset.q2Help  = 'false';
  delete screen.dataset.qDone;

  // Clear option classes
  screen.querySelectorAll('.q2-option').forEach(function(opt) {
    opt.classList.remove('q2-opt-selected', 'q2-opt-wrong', 'q2-opt-correct');
  });

  // Disable submit + hide
  var btn = screen.querySelector('.q2-submit-btn');
  if (btn) btn.disabled = true;
  delete screen.dataset.qSubmitReady;

  // Close applet if open
  var overlay = document.getElementById('q2-applet-overlay');
  if (overlay) overlay.classList.remove("open");

  updateNavButtons();
}

/* ── option selection ─────────────────────────────────── */
function selectQ2Option(val) {
  var screen = document.getElementById('screen-q2');
  if (!screen) return;
  var state = screen.dataset.q2State;
  if (state === 'correct' || state === 'incorrect') return; // locked
  if (state === 'tryagain') retryQ2();

  q2State.selected = val;

  screen.querySelectorAll('.q2-option').forEach(function(opt) {
    opt.classList.remove('q2-opt-selected');
    if (parseInt(opt.dataset.value, 10) === val) {
      opt.classList.add('q2-opt-selected');
    }
  });

  var btn = screen.querySelector('.q2-submit-btn');
  if (btn) btn.disabled = false;
  screen.dataset.qSubmitReady = 'true';
}

/* ── help toggle ──────────────────────────────────────── */
function toggleQ2Help() {
  var screen = document.getElementById('screen-q2');
  if (!screen) return;
  screen.dataset.q2Help = (screen.dataset.q2Help === 'true') ? 'false' : 'true';
}

/* ── submit ───────────────────────────────────────────── */
function submitQ2() {
  var screen = document.getElementById('screen-q2');
  if (!screen || q2State.selected === null) return;

  q2State.attempts++;

  if (q2State.selected === Q2_CORRECT) {
    /* ✓ Correct */
    q2MarkOption(Q2_CORRECT, 'correct');
    screen.dataset.q2State = 'correct';
    screen.dataset.qDone   = 'true';
  } else if (q2State.attempts === 1) {
    /* ✗ First wrong → tryagain — option stays selected (no red X yet) */
    screen.dataset.q2State = 'tryagain';
  } else {
    /* ✗ Second wrong → incorrect — reveal correct answer */
    q2MarkOption(q2State.selected, 'wrong');
    q2MarkOption(Q2_CORRECT,       'correct');
    screen.dataset.q2State = 'incorrect';
    screen.dataset.qDone   = 'true';
  }

  updateNavButtons();
}

/* ── retry (נסו שוב) ──────────────────────────────────── */
function retryQ2() {
  var screen = document.getElementById('screen-q2');
  if (!screen) return;

  q2State.selected = null;
  screen.dataset.q2State = 'main';

  screen.querySelectorAll('.q2-option').forEach(function(opt) {
    opt.classList.remove('q2-opt-selected', 'q2-opt-wrong', 'q2-opt-correct');
  });

  var btn = screen.querySelector('.q2-submit-btn');
  if (btn) btn.disabled = true;
}

/* ── applet modal ─────────────────────────────────────── */
function openQ2Applet() {
  var overlay = document.getElementById('q2-applet-overlay');
  if (overlay) overlay.classList.add("open");
}

function closeQ2Applet() {
  var overlay = document.getElementById('q2-applet-overlay');
  if (overlay) overlay.classList.remove("open");
}

/* ── helpers ──────────────────────────────────────────── */
function q2MarkOption(val, type) {
  var screen = document.getElementById('screen-q2');
  if (!screen) return;
  screen.querySelectorAll('.q2-option').forEach(function(opt) {
    if (parseInt(opt.dataset.value, 10) === val) {
      opt.classList.add(type === 'correct' ? 'q2-opt-correct' : 'q2-opt-wrong');
    }
  });
}
