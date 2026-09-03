'use strict';
/* ============================================================
   radio5.js — QUES5 single-choice radio question handler

   Correct answer: option 2 ("בתערובת א', כיוון שבה הצבע הצהוב מהווה כמעט חצי...")
   States on #screen-q5: data-q5-state="main|tryagain|correct|incorrect"
   Help panel:           data-q5-help="true|false"
   NEXT gate:            data-q-done="true" (set on correct OR incorrect)
   Applet modal:         data-q5-applet-open on #q5-applet-overlay

   Two-attempt rule: identical to QUES2/3/4/4B/4C.

   Public API:
     initQ5()            — called by onEnterScreen() — resets to main
     selectQ5Option(n)   — click on option row
     toggleQ5Help()      — עזרה button click
     submitQ5()          — צדקתי? button click
     retryQ5()           — "נסו שוב" click
     openQ5Applet()      — ישומון button click
     closeQ5Applet()     — × inside modal
   ============================================================ */

var q5State = {
  selected: null,  // 1 | 2 | 3
  attempts: 0
};

var Q5_CORRECT = 2;

/* ── init ─────────────────────────────────────────────────── */
function initQ5() {
  var screen = document.getElementById('screen-q5');
  if (!screen) return;

  q5State.selected = null;
  q5State.attempts = 0;

  screen.dataset.q5State = 'main';
  screen.dataset.q5Help  = 'false';
  delete screen.dataset.qDone;

  screen.querySelectorAll('.q5-option').forEach(function(opt) {
    opt.classList.remove('q5-opt-selected', 'q5-opt-wrong', 'q5-opt-correct');
  });

  var btn = screen.querySelector('.q5-submit-btn');
  if (btn) btn.disabled = true;
  delete screen.dataset.qSubmitReady;

  var overlay = document.getElementById('q5-applet-overlay');
  if (overlay) overlay.classList.remove("open");

  updateNavButtons();
}

/* ── option selection ─────────────────────────────────────── */
function selectQ5Option(val) {
  var screen = document.getElementById('screen-q5');
  if (!screen) return;
  var state = screen.dataset.q5State;
  if (state === 'correct' || state === 'incorrect') return;
  if (state === 'tryagain') retryQ5();

  q5State.selected = val;

  screen.querySelectorAll('.q5-option').forEach(function(opt) {
    opt.classList.remove('q5-opt-selected');
    if (parseInt(opt.dataset.value, 10) === val) {
      opt.classList.add('q5-opt-selected');
    }
  });

  /* If user selects again after tryagain — restore main state so submit reappears */
  if (state === 'tryagain') {
    screen.dataset.q5State = 'main';
  }

  var btn = screen.querySelector('.q5-submit-btn');
  if (btn) btn.disabled = false;
  screen.dataset.qSubmitReady = 'true';
}

/* ── help toggle ──────────────────────────────────────────── */
function toggleQ5Help() {
  var screen = document.getElementById('screen-q5');
  if (!screen) return;
  screen.dataset.q5Help = (screen.dataset.q5Help === 'true') ? 'false' : 'true';
}

/* ── submit ───────────────────────────────────────────────── */
function submitQ5() {
  var screen = document.getElementById('screen-q5');
  if (!screen || q5State.selected === null) return;

  q5State.attempts++;

  if (q5State.selected === Q5_CORRECT) {
    /* ✓ Correct */
    q5MarkOption(Q5_CORRECT, 'correct');
    screen.dataset.q5State = 'correct';
    screen.dataset.qDone   = 'true';

  } else if (q5State.attempts === 1) {
    /* ✗ First wrong → tryagain */
    screen.dataset.q5State = 'tryagain';

  } else {
    /* ✗ Second wrong → incorrect */
    q5State.selected && q5MarkOption(q5State.selected, 'wrong');
    q5MarkOption(Q5_CORRECT, 'correct');
    screen.dataset.q5State = 'incorrect';
    screen.dataset.qDone   = 'true';
  }

  updateNavButtons();
}

/* ── retry (נסו שוב) ──────────────────────────────────────── */
function retryQ5() {
  var screen = document.getElementById('screen-q5');
  if (!screen) return;

  // Clear selection so user must pick again
  screen.querySelectorAll('.q5-option').forEach(function(opt) {
    opt.classList.remove('q5-opt-selected');
  });
  q5State.selected = null;
  screen.dataset.q5State = 'main';

  var btn = screen.querySelector('.q5-submit-btn');
  if (btn) btn.disabled = true;
}

/* ── applet modal ─────────────────────────────────────────── */
function openQ5Applet() {
  var overlay = document.getElementById('q5-applet-overlay');
  if (overlay) overlay.classList.add("open");
}

function closeQ5Applet() {
  var overlay = document.getElementById('q5-applet-overlay');
  if (overlay) overlay.classList.remove("open");
}

/* ── mark option helper ───────────────────────────────────── */
function q5MarkOption(val, type) {
  var screen = document.getElementById('screen-q5');
  if (!screen) return;
  screen.querySelectorAll('.q5-option').forEach(function(opt) {
    if (parseInt(opt.dataset.value, 10) === val) {
      opt.classList.add(type === 'correct' ? 'q5-opt-correct' : 'q5-opt-wrong');
    }
  });
}
