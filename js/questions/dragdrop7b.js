'use strict';
/* ============================================================
   dragdrop7b.js — QUES7B Drag & Drop question handler

   Correct answers: drop1="18" (ליטרים כחול: 6·3), drop2="12" (ליטרים צהוב: 6·2)
   States on #screen-q7b: data-q7b-state="main|tryagain|correct|incorrect"
   Help:                   data-q7b-help="closed|open"
   NEXT gate:              data-q-done="true"

   Two-attempt rule (identical to QUES7):
     attempt 1 wrong → per-drop green/red feedback + tryagain state
     attempt 2 wrong → show correct answers + incorrect state
     any attempt correct → correct state

   Public API:
     initQ7b()                 — called by onEnterScreen()
     q7bChipClick(e, word)     — click chip to place
     q7bDragStart(e, word)     — drag chip
     q7bDragEnd(e)             — drag end
     q7bDragOver(e)            — drag over drop zone
     q7bDropOnZone(e, dropNum) — drop on zone
     q7bDropZoneClick(dropNum) — click drop zone to return chip
     submitQ7b()               — צדקתי? button
     resetQ7bForRetry()        — נסו שוב button
     toggleQ7bHelp()           — עזרה button
   ============================================================ */

var Q7B_CORRECT = { 1: '18', 2: '12' };

var q7bState = { attempts: 0, drops: { 1: null, 2: null }, done: false };
var q7bDragWord = null;

/* ── Init ─────────────────────────────────────────────────── */
function initQ7b() {
  q7bState = { attempts: 0, drops: { 1: null, 2: null }, done: false };
  var screen = document.getElementById('screen-q7b');
  if (!screen) return;
  screen.dataset.q7bState = 'main';
  screen.dataset.q7bHelp  = 'closed';
  delete screen.dataset.qDone;
  delete screen.dataset.qScore;
  delete screen.dataset.qSubmitReady;

  document.querySelectorAll('#screen-q7b .q7b-chip').forEach(function(c) {
    c.classList.remove('q7b-chip-placed');
    delete c.dataset.placed;
  });
  q7bSetDropDisplay(1, null, false);
  q7bSetDropDisplay(2, null, false);
  updateNavButtons();
}

/* ── Submit visibility ────────────────────────────────────── */
function q7bUpdateSubmitVisibility() {
  var screen = document.getElementById('screen-q7b');
  if (!screen) return;
  var allFilled = q7bState.drops[1] && q7bState.drops[2];
  if (allFilled) {
    screen.dataset.qSubmitReady = 'true';
  } else {
    delete screen.dataset.qSubmitReady;
  }
}

/* ── Retry reset ──────────────────────────────────────────── */
function resetQ7bForRetry() {
  var screen = document.getElementById('screen-q7b');
  if (!screen) return;
  q7bState.drops = { 1: null, 2: null };
  q7bState.done  = false;

  screen.dataset.q7bState = 'main';
  screen.dataset.q7bHelp  = 'closed';
  delete screen.dataset.qDone;
  delete screen.dataset.qScore;
  delete screen.dataset.qSubmitReady;

  document.querySelectorAll('#screen-q7b .q7b-chip').forEach(function(c) {
    c.classList.remove('q7b-chip-placed');
    delete c.dataset.placed;
  });
  q7bSetDropDisplay(1, null, false);
  q7bSetDropDisplay(2, null, false);
}

/* ── Drop display helper ──────────────────────────────────── */
function q7bSetDropDisplay(dropNum, word, correctStyle, wrongStyle) {
  var drop = document.getElementById('q7b-drop-' + dropNum);
  if (!drop) return;
  var label = drop.querySelector('.q7b-drop-label');
  if (word) {
    drop.classList.add('q7b-drop-filled');
    drop.classList.remove('q7b-drop-correct-style', 'q7b-drop-wrong-style');
    if (correctStyle) {
      drop.classList.add('q7b-drop-correct-style');
    } else if (wrongStyle) {
      drop.classList.add('q7b-drop-wrong-style');
    }
    drop.dataset.word = word;
    if (label) label.textContent = word;
  } else {
    drop.classList.remove('q7b-drop-filled', 'q7b-drop-correct-style', 'q7b-drop-wrong-style');
    drop.dataset.word = '';
    if (label) label.textContent = '';
  }
}

/* ── Drag & Drop ──────────────────────────────────────────── */
function q7bDragStart(event, word) {
  if (q7bState.done) { event.preventDefault(); return; }
  q7bDragWord = word;
  event.dataTransfer.setData('text/plain', word);
  event.currentTarget.classList.add('q7b-chip-dragging');
  event.dataTransfer.setDragImage(event.currentTarget, event.offsetX, event.offsetY);
}

function q7bDragEnd(event) {
  event.currentTarget.classList.remove('q7b-chip-dragging');
  q7bDragWord = null;
}

function q7bDragOver(event) {
  if (!q7bState.done) event.preventDefault();
}

function q7bDropOnZone(event, dropNum) {
  if (q7bState.done) return;
  event.preventDefault();
  var word = event.dataTransfer.getData('text/plain') || q7bDragWord;
  q7bDragWord = null;
  if (!word) return;
  q7bPlaceWord(word, dropNum);
}

/* ── Click-to-place ───────────────────────────────────────── */
function q7bChipClick(event, word) {
  if (q7bState.done) return;
  var chip = event.currentTarget;
  if (chip.classList.contains('q7b-chip-placed')) return;
  var empty = q7bFindFirstEmpty();
  if (empty !== null) q7bPlaceWord(word, empty);
}

function q7bDropZoneClick(dropNum) {
  if (q7bState.done) return;
  var word = q7bState.drops[dropNum];
  if (word) q7bRemoveFromDrop(dropNum);
}

/* ── Placement logic ──────────────────────────────────────── */
function q7bPlaceWord(word, dropNum) {
  for (var i = 1; i <= 2; i++) {
    if (q7bState.drops[i] === word && i !== dropNum) {
      q7bRemoveFromDrop(i);
      break;
    }
  }
  if (q7bState.drops[dropNum] && q7bState.drops[dropNum] !== word) {
    q7bRemoveFromDrop(dropNum);
  }
  q7bState.drops[dropNum] = word;
  q7bSetDropDisplay(dropNum, word, false);
  var chip = document.querySelector('#screen-q7b .q7b-chip[data-word="' + word + '"]');
  if (chip) { chip.dataset.placed = String(dropNum); chip.classList.add('q7b-chip-placed'); }
  q7bUpdateSubmitVisibility();
}

function q7bRemoveFromDrop(dropNum) {
  var word = q7bState.drops[dropNum];
  if (!word) return;
  q7bState.drops[dropNum] = null;
  q7bSetDropDisplay(dropNum, null, false);
  var chip = document.querySelector('#screen-q7b .q7b-chip[data-word="' + word + '"]');
  if (chip) { delete chip.dataset.placed; chip.classList.remove('q7b-chip-placed'); }
  q7bUpdateSubmitVisibility();
}

function q7bFindFirstEmpty() {
  for (var i = 1; i <= 2; i++) { if (!q7bState.drops[i]) return i; }
  return null;
}

/* ── Submit ───────────────────────────────────────────────── */
function submitQ7b() {
  if (q7bState.done) return;
  if (!q7bState.drops[1] || !q7bState.drops[2]) return;

  q7bState.attempts++;

  var isCorrect = (q7bState.drops[1] === Q7B_CORRECT[1] && q7bState.drops[2] === Q7B_CORRECT[2]);

  if (isCorrect) {
    for (var i = 1; i <= 2; i++) { q7bSetDropDisplay(i, q7bState.drops[i], true); }
    q7bTransitionTo('correct');
    q7bMarkDone(10);

  } else if (q7bState.attempts >= 2) {
    var correctCount7b = 0;
    for (var k = 1; k <= 2; k++) {
      if (q7bState.drops[k] === Q7B_CORRECT[k]) correctCount7b++;
    }
    q7bShowCorrectAnswers();
    q7bTransitionTo('incorrect');
    q7bMarkDone(correctCount7b * 5);

  } else {
    for (var j = 1; j <= 2; j++) {
      var right = q7bState.drops[j] === Q7B_CORRECT[j];
      q7bSetDropDisplay(j, q7bState.drops[j], right, !right);
    }
    q7bTransitionTo('tryagain');
  }
}

function q7bShowCorrectAnswers() {
  for (var i = 1; i <= 2; i++) {
    var correctWord = Q7B_CORRECT[i];
    var existing    = q7bState.drops[i];
    if (existing && existing !== correctWord) {
      var prevChip = document.querySelector('#screen-q7b .q7b-chip[data-word="' + existing + '"]');
      if (prevChip) { prevChip.classList.remove('q7b-chip-placed'); delete prevChip.dataset.placed; }
    }
    var correctChip = document.querySelector('#screen-q7b .q7b-chip[data-word="' + correctWord + '"]');
    if (correctChip) { correctChip.dataset.placed = String(i); correctChip.classList.add('q7b-chip-placed'); }
    q7bState.drops[i] = correctWord;
    q7bSetDropDisplay(i, correctWord, true, false);
  }
}

function q7bTransitionTo(state) {
  var screen = document.getElementById('screen-q7b');
  if (screen) screen.dataset.q7bState = state;
  updateNavButtons();
}

function q7bMarkDone(score) {
  q7bState.done = true;
  var screen = document.getElementById('screen-q7b');
  if (screen) { screen.dataset.qDone = 'true'; screen.dataset.qScore = String(score); }
  updateNavButtons();
}

/* ── Help toggle ──────────────────────────────────────────── */
function toggleQ7bHelp() {
  var screen = document.getElementById('screen-q7b');
  if (!screen) return;
  screen.dataset.q7bHelp = (screen.dataset.q7bHelp === 'open') ? 'closed' : 'open';
}
