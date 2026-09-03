'use strict';
/* ============================================================
   numeric4c.js — QUES4C numeric-input question handler

   Part 3 of Question 4. Architecture mirrors radio4b.js exactly.

   Correct answer: 24  (ratio 3:2, yellow grows ×8 → blue = 3×8 = 24)
   States on #screen-q4c: data-q4c-state="main|tryagain|correct|incorrect"
   Help panel:             data-q4c-help="true|false"
   NEXT gate:              data-q-done="true" (set on correct OR incorrect)
   Applet modal:           data-q4c-applet-open on #q4c-applet-overlay

   Two-attempt rule: identical to QUES2 / QUES3 / QUES4A / QUES4B.

   Public API:
     initQ4c()          — called by onEnterScreen() — resets to main
     onQ4cInput()       — oninput on the <input> field
     toggleQ4cHelp()    — עזרה button click
     submitQ4c()        — צדקתי? button click
     retryQ4c()         — "נסו שוב" click
     openQ4cApplet()    — ישומון button click
     closeQ4cApplet()   — × inside modal
   ============================================================ */

var q4cState = { attempts: 0 };

var Q4C_CORRECT = 24;

/* ── init ─────────────────────────────────────────────────── */
function initQ4c() {
  var screen = document.getElementById('screen-q4c');
  if (!screen) return;

  q4cState.attempts = 0;

  screen.dataset.q4cState = 'main';
  screen.dataset.q4cHelp  = 'false';
  delete screen.dataset.qDone;

  var input = screen.querySelector('.q4c-input');
  if (input) {
    input.value = '';
    input.disabled = false;
  }

  var btn = screen.querySelector('.q4c-submit-btn');
  if (btn) btn.disabled = true;
  delete screen.dataset.qSubmitReady;

  var overlay = document.getElementById('q4c-applet-overlay');
  if (overlay) overlay.classList.remove("open");

  updateNavButtons();
}

/* ── input handler — enable/disable submit ────────────────── */
function onQ4cInput() {
  var screen = document.getElementById('screen-q4c');
  if (!screen) return;
  var state = screen.dataset.q4cState;
  if (state === 'correct' || state === 'incorrect') return;

  var input = screen.querySelector('.q4c-input');
  var btn   = screen.querySelector('.q4c-submit-btn');
  var hasValue = input && input.value.trim() !== '';
  if (btn) btn.disabled = !hasValue;
  if (hasValue) {
    screen.dataset.qSubmitReady = 'true';
  } else {
    delete screen.dataset.qSubmitReady;
  }

  /* If user starts typing again after tryagain — return to main so
     submit btn visibility rule (which hides it in tryagain) clears */
  if (state === 'tryagain' && hasValue) {
    screen.dataset.q4cState = 'main';
  }
}

/* ── help toggle ──────────────────────────────────────────── */
function toggleQ4cHelp() {
  var screen = document.getElementById('screen-q4c');
  if (!screen) return;
  screen.dataset.q4cHelp = (screen.dataset.q4cHelp === 'true') ? 'false' : 'true';
}

/* ── submit ───────────────────────────────────────────────── */
function submitQ4c() {
  var screen = document.getElementById('screen-q4c');
  if (!screen) return;

  var input = screen.querySelector('.q4c-input');
  if (!input || input.value.trim() === '') return;

  var answer = parseInt(input.value, 10);
  q4cState.attempts++;

  if (answer === Q4C_CORRECT) {
    /* ✓ Correct */
    if (input) input.disabled = true;
    screen.dataset.q4cState = 'correct';
    screen.dataset.qDone    = 'true';

  } else if (q4cState.attempts === 1) {
    /* ✗ First wrong → tryagain */
    if (input) { input.value = ''; input.disabled = false; }
    screen.dataset.q4cState = 'tryagain';
    var btn = screen.querySelector('.q4c-submit-btn');
    if (btn) btn.disabled = true;

  } else {
    /* ✗ Second wrong → incorrect — disable input, show panel */
    if (input) input.disabled = true;
    screen.dataset.q4cState = 'incorrect';
    screen.dataset.qDone    = 'true';
  }

  updateNavButtons();
}

/* ── retry (נסו שוב) ──────────────────────────────────────── */
function retryQ4c() {
  var screen = document.getElementById('screen-q4c');
  if (!screen) return;

  var input = screen.querySelector('.q4c-input');
  if (input) { input.value = ''; input.disabled = false; input.focus(); }

  screen.dataset.q4cState = 'main';

  var btn = screen.querySelector('.q4c-submit-btn');
  if (btn) btn.disabled = true;
}

/* ── applet modal ─────────────────────────────────────────── */
function openQ4cApplet() {
  var overlay = document.getElementById('q4c-applet-overlay');
  if (overlay) overlay.classList.add("open");
}

function closeQ4cApplet() {
  var overlay = document.getElementById('q4c-applet-overlay');
  if (overlay) overlay.classList.remove("open");
}
