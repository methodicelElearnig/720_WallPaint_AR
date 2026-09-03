'use strict';
/* ============================================================
   radio4b.js — QUES4B multi-select question handler

   Part 2 of Question 4. Architecture mirrors radio4.js exactly.

   Correct answers: options 2 (3/2 = 3·8/2·8) and 3 (3/2 = X/16)
   States on #screen-q4b: data-q4b-state="main|tryagain|correct|incorrect"
   Help panel:             data-q4b-help="true|false"
   NEXT gate:              data-q-done="true" (set on correct OR incorrect)
   Applet modal:           data-q4b-applet-open on #q4b-applet-overlay

   Two-attempt rule: identical to QUES2 / QUES3 / QUES4A.
   Multi-select: learner picks exactly 2 of 3 options.

   Public API:
     initQ4b()              — called by onEnterScreen() — resets to main
     selectQ4bOption(n)     — click on option (toggles selection)
     toggleQ4bHelp()        — עזרה button click
     submitQ4b()            — צדקתי? button click
     retryQ4b()             — "נסו שוב" click
     openQ4bApplet()        — ישומון button click
     closeQ4bApplet()       — × inside modal
   ============================================================ */

var q4bState = {
  selected: [],   /* array of currently-selected values */
  attempts: 0
};

var Q4B_CORRECT = [2, 3];   /* correct answer values (option data-value attrs) */

/* ── helpers ──────────────────────────────────────────────── */
function q4bSetsMatch(arr) {
  if (arr.length !== Q4B_CORRECT.length) return false;
  var sorted = arr.slice().sort(function(a, b) { return a - b; });
  for (var i = 0; i < sorted.length; i++) {
    if (sorted[i] !== Q4B_CORRECT[i]) return false;
  }
  return true;
}

/* ── init ─────────────────────────────────────────────────── */
function initQ4b() {
  var screen = document.getElementById('screen-q4b');
  if (!screen) return;

  q4bState.selected = [];
  q4bState.attempts = 0;

  screen.dataset.q4bState = 'main';
  screen.dataset.q4bHelp  = 'false';
  delete screen.dataset.qDone;

  screen.querySelectorAll('.q4b-option').forEach(function(opt) {
    opt.classList.remove('q4b-opt-selected', 'q4b-opt-wrong', 'q4b-opt-correct');
  });

  var btn = screen.querySelector('.q4b-submit-btn');
  if (btn) btn.disabled = true;
  delete screen.dataset.qSubmitReady;

  var overlay = document.getElementById('q4b-applet-overlay');
  if (overlay) overlay.classList.remove("open");

  updateNavButtons();
}

/* ── option selection (toggle) ────────────────────────────── */
function selectQ4bOption(val) {
  var screen = document.getElementById('screen-q4b');
  if (!screen) return;
  var state = screen.dataset.q4bState;
  if (state === 'correct' || state === 'incorrect') return;
  if (state === 'tryagain') retryQ4b();

  var idx = q4bState.selected.indexOf(val);
  if (idx === -1) {
    q4bState.selected.push(val);
  } else {
    q4bState.selected.splice(idx, 1);
  }

  screen.querySelectorAll('.q4b-option').forEach(function(opt) {
    var v = parseInt(opt.dataset.value, 10);
    opt.classList.toggle('q4b-opt-selected', q4bState.selected.indexOf(v) !== -1);
  });

  var btn = screen.querySelector('.q4b-submit-btn');
  if (btn) btn.disabled = (q4bState.selected.length === 0);
  if (q4bState.selected.length > 0) {
    screen.dataset.qSubmitReady = 'true';
  } else {
    delete screen.dataset.qSubmitReady;
  }
}

/* ── help toggle ──────────────────────────────────────────── */
function toggleQ4bHelp() {
  var screen = document.getElementById('screen-q4b');
  if (!screen) return;
  screen.dataset.q4bHelp = (screen.dataset.q4bHelp === 'true') ? 'false' : 'true';
}

/* ── submit ───────────────────────────────────────────────── */
function submitQ4b() {
  var screen = document.getElementById('screen-q4b');
  if (!screen || q4bState.selected.length === 0) return;

  q4bState.attempts++;

  if (q4bSetsMatch(q4bState.selected)) {
    /* ✓ Correct */
    Q4B_CORRECT.forEach(function(v) { q4bMarkOption(v, 'correct'); });
    screen.dataset.q4bState = 'correct';
    screen.dataset.qDone    = 'true';

  } else if (q4bState.attempts === 1) {
    /* ✗ First wrong → tryagain (no marks, mirrors QUES2/3/4A behaviour) */
    screen.dataset.q4bState = 'tryagain';

  } else {
    /* ✗ Second wrong → incorrect — reveal correct + mark wrong selections */
    q4bState.selected.forEach(function(v) {
      if (Q4B_CORRECT.indexOf(v) === -1) q4bMarkOption(v, 'wrong');
    });
    Q4B_CORRECT.forEach(function(v) { q4bMarkOption(v, 'correct'); });
    screen.dataset.q4bState = 'incorrect';
    screen.dataset.qDone    = 'true';
  }

  updateNavButtons();
}

/* ── retry (נסו שוב) ──────────────────────────────────────── */
function retryQ4b() {
  var screen = document.getElementById('screen-q4b');
  if (!screen) return;

  q4bState.selected = [];
  screen.dataset.q4bState = 'main';

  screen.querySelectorAll('.q4b-option').forEach(function(opt) {
    opt.classList.remove('q4b-opt-selected', 'q4b-opt-wrong', 'q4b-opt-correct');
  });

  var btn = screen.querySelector('.q4b-submit-btn');
  if (btn) btn.disabled = true;
}

/* ── applet modal ─────────────────────────────────────────── */
function openQ4bApplet() {
  var overlay = document.getElementById('q4b-applet-overlay');
  if (overlay) overlay.classList.add("open");
}

function closeQ4bApplet() {
  var overlay = document.getElementById('q4b-applet-overlay');
  if (overlay) overlay.classList.remove("open");
}

/* ── mark option ──────────────────────────────────────────── */
function q4bMarkOption(val, type) {
  var screen = document.getElementById('screen-q4b');
  if (!screen) return;
  screen.querySelectorAll('.q4b-option').forEach(function(opt) {
    if (parseInt(opt.dataset.value, 10) === val) {
      opt.classList.add(type === 'correct' ? 'q4b-opt-correct' : 'q4b-opt-wrong');
    }
  });
}
