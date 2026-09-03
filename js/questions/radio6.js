'use strict';
/* ============================================================
   radio6.js — QUES6 single-choice radio question handler

   Correct answer: option 3 ("3 מטרים")
   States on #screen-q6: data-q6-state="main|tryagain|correct|incorrect"
   Help panel:           data-q6-help="true|false"
   NEXT gate:            data-q-done="true" (set on correct OR incorrect)

   Two-attempt rule: identical to QUES2/3/4/5.

   Public API:
     initQ6()            — called by onEnterScreen() — resets to main
     selectQ6Option(n)   — click on option row
     toggleQ6Help()      — עזרה button click
     submitQ6()          — צדקתי? button click
   ============================================================ */

var q6State = {
  selected: null,   // 1 | 2 | 3 | 4
  attempts: 0
};

var Q6_CORRECT = 3;

/* ── init ─────────────────────────────────────────────────── */
function initQ6() {
  var screen = document.getElementById('screen-q6');
  if (!screen) return;

  q6State.selected = null;
  q6State.attempts = 0;

  screen.dataset.q6State = 'main';
  screen.dataset.q6Help  = 'false';
  delete screen.dataset.qDone;

  screen.querySelectorAll('.q6-option').forEach(function(opt) {
    opt.classList.remove('q6-opt-selected', 'q6-opt-wrong', 'q6-opt-correct');
  });

  var btn = screen.querySelector('.q6-submit-btn');
  if (btn) btn.disabled = true;
  delete screen.dataset.qSubmitReady;

  updateNavButtons();
}

/* ── option selection ─────────────────────────────────────── */
function selectQ6Option(val) {
  var screen = document.getElementById('screen-q6');
  if (!screen) return;
  var state = screen.dataset.q6State;
  if (state === 'correct' || state === 'incorrect') return;
  if (state === 'tryagain') retryQ6();

  q6State.selected = val;

  screen.querySelectorAll('.q6-option').forEach(function(opt) {
    opt.classList.remove('q6-opt-selected');
    if (parseInt(opt.dataset.value, 10) === val) {
      opt.classList.add('q6-opt-selected');
    }
  });

  /* If user selects again after tryagain — restore main state so submit reappears */
  if (state === 'tryagain') {
    screen.dataset.q6State = 'main';
  }

  var btn = screen.querySelector('.q6-submit-btn');
  if (btn) btn.disabled = false;
  screen.dataset.qSubmitReady = 'true';
}

/* ── help toggle ──────────────────────────────────────────── */
function toggleQ6Help() {
  var screen = document.getElementById('screen-q6');
  if (!screen) return;
  screen.dataset.q6Help = (screen.dataset.q6Help === 'true') ? 'false' : 'true';
}

/* ── submit ───────────────────────────────────────────────── */
function submitQ6() {
  var screen = document.getElementById('screen-q6');
  if (!screen || q6State.selected === null) return;

  q6State.attempts++;

  if (q6State.selected === Q6_CORRECT) {
    /* ✓ Correct */
    q6MarkOption(Q6_CORRECT, 'correct');
    screen.dataset.q6State = 'correct';
    screen.dataset.qDone   = 'true';

  } else if (q6State.attempts === 1) {
    /* ✗ First wrong → tryagain */
    screen.dataset.q6State = 'tryagain';

  } else {
    /* ✗ Second wrong → incorrect */
    q6State.selected && q6MarkOption(q6State.selected, 'wrong');
    q6MarkOption(Q6_CORRECT, 'correct');
    screen.dataset.q6State = 'incorrect';
    screen.dataset.qDone   = 'true';
  }

  updateNavButtons();
}

/* ── retry ────────────────────────────────────────────────── */
function retryQ6() {
  var screen = document.getElementById('screen-q6');
  if (!screen) return;
  screen.querySelectorAll('.q6-option').forEach(function(opt) {
    opt.classList.remove('q6-opt-selected');
  });
  q6State.selected = null;
  screen.dataset.q6State = 'main';
  var btn = screen.querySelector('.q6-submit-btn');
  if (btn) btn.disabled = true;
}

/* ── mark option helper ───────────────────────────────────── */
function q6MarkOption(val, type) {
  var screen = document.getElementById('screen-q6');
  if (!screen) return;
  screen.querySelectorAll('.q6-option').forEach(function(opt) {
    if (parseInt(opt.dataset.value, 10) === val) {
      opt.classList.add(type === 'correct' ? 'q6-opt-correct' : 'q6-opt-wrong');
    }
  });
}
