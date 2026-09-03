'use strict';
/* ============================================================
   dragdrop7.js — QUES7 Drag & Drop question handler

   Correct answers: drop1="5" (ליטרים per batch), drop2="6" (מנות)
   States on #screen-q7: data-q7-state="main|tryagain|correct|incorrect"
   Help:                  data-q7-help="closed|open"
   NEXT gate:             data-q-done="true"

   Two-attempt rule (identical to QUES1):
     attempt 1 wrong → per-drop green/red feedback + tryagain state
     attempt 2 wrong → show correct answers + incorrect state
     any attempt correct → correct state

   Public API:
     initQ7()                — called by onEnterScreen()
     q7ChipClick(e, word)    — click chip to place
     q7DragStart(e, word)    — drag chip
     q7DragEnd(e)            — drag end
     q7DragOver(e)           — drag over drop zone
     q7DropOnZone(e, dropNum)— drop on zone
     q7DropZoneClick(dropNum)— click drop zone to return chip
     submitQ7()              — צדקתי? button
     resetQ7ForRetry()       — נסו שוב button
     toggleQ7Help()          — עזרה button
   ============================================================ */

var Q7_CORRECT = { 1: '5', 2: '6' };

var q7State = { attempts: 0, drops: { 1: null, 2: null }, done: false };
var q7DragWord = null;

/* ── Init ─────────────────────────────────────────────────── */
function initQ7() {
  q7State = { attempts: 0, drops: { 1: null, 2: null }, done: false };
  var screen = document.getElementById('screen-q7');
  if (!screen) return;
  screen.dataset.q7State = 'main';
  screen.dataset.q7Help  = 'closed';
  delete screen.dataset.qDone;
  delete screen.dataset.qScore;
  delete screen.dataset.qSubmitReady;

  document.querySelectorAll('#screen-q7 .q7-chip').forEach(function(c) {
    c.classList.remove('q7-chip-placed');
    delete c.dataset.placed;
  });
  q7SetDropDisplay(1, null, false);
  q7SetDropDisplay(2, null, false);
  updateNavButtons();
}

/* ── Submit visibility ────────────────────────────────────── */
function q7UpdateSubmitVisibility() {
  var screen = document.getElementById('screen-q7');
  if (!screen) return;
  var allFilled = q7State.drops[1] && q7State.drops[2];
  if (allFilled) {
    screen.dataset.qSubmitReady = 'true';
  } else {
    delete screen.dataset.qSubmitReady;
  }
}

/* ── Retry reset ──────────────────────────────────────────── */
function resetQ7ForRetry() {
  var screen = document.getElementById('screen-q7');
  if (!screen) return;
  // Keep attempts count — next wrong submit → incorrect
  q7State.drops = { 1: null, 2: null };
  q7State.done  = false;

  screen.dataset.q7State = 'main';
  screen.dataset.q7Help  = 'closed';
  delete screen.dataset.qDone;
  delete screen.dataset.qScore;
  delete screen.dataset.qSubmitReady;

  document.querySelectorAll('#screen-q7 .q7-chip').forEach(function(c) {
    c.classList.remove('q7-chip-placed');
    delete c.dataset.placed;
  });
  q7SetDropDisplay(1, null, false);
  q7SetDropDisplay(2, null, false);
}

/* ── Drop display helper ──────────────────────────────────── */
function q7SetDropDisplay(dropNum, word, correctStyle, wrongStyle) {
  var drop = document.getElementById('q7-drop-' + dropNum);
  if (!drop) return;
  var label = drop.querySelector('.q7-drop-label');
  if (word) {
    drop.classList.add('q7-drop-filled');
    drop.classList.remove('q7-drop-correct-style', 'q7-drop-wrong-style');
    if (correctStyle) {
      drop.classList.add('q7-drop-correct-style');
    } else if (wrongStyle) {
      drop.classList.add('q7-drop-wrong-style');
    }
    drop.dataset.word = word;
    if (label) label.textContent = word;
  } else {
    drop.classList.remove('q7-drop-filled', 'q7-drop-correct-style', 'q7-drop-wrong-style');
    drop.dataset.word = '';
    if (label) label.textContent = '';
  }
}

/* ── Drag & Drop ──────────────────────────────────────────── */
function q7DragStart(event, word) {
  if (q7State.done) { event.preventDefault(); return; }
  q7DragWord = word;
  event.dataTransfer.setData('text/plain', word);
  event.currentTarget.classList.add('q7-chip-dragging');
  event.dataTransfer.setDragImage(event.currentTarget, event.offsetX, event.offsetY);
}

function q7DragEnd(event) {
  event.currentTarget.classList.remove('q7-chip-dragging');
  q7DragWord = null;
}

function q7DragOver(event) {
  if (!q7State.done) event.preventDefault();
}

function q7DropOnZone(event, dropNum) {
  if (q7State.done) return;
  event.preventDefault();
  var word = event.dataTransfer.getData('text/plain') || q7DragWord;
  q7DragWord = null;
  if (!word) return;
  q7PlaceWord(word, dropNum);
}

/* ── Click-to-place ───────────────────────────────────────── */
function q7ChipClick(event, word) {
  if (q7State.done) return;
  var chip = event.currentTarget;
  if (chip.classList.contains('q7-chip-placed')) return;
  var empty = q7FindFirstEmpty();
  if (empty !== null) q7PlaceWord(word, empty);
}

function q7DropZoneClick(dropNum) {
  if (q7State.done) return;
  var word = q7State.drops[dropNum];
  if (word) q7RemoveFromDrop(dropNum);
}

/* ── Placement logic ──────────────────────────────────────── */
function q7PlaceWord(word, dropNum) {
  // If word is already in another drop, remove it first
  for (var i = 1; i <= 2; i++) {
    if (q7State.drops[i] === word && i !== dropNum) {
      q7RemoveFromDrop(i);
      break;
    }
  }
  // If target drop already occupied, return previous chip
  if (q7State.drops[dropNum] && q7State.drops[dropNum] !== word) {
    q7RemoveFromDrop(dropNum);
  }
  // Place
  q7State.drops[dropNum] = word;
  q7SetDropDisplay(dropNum, word, false);
  var chip = document.querySelector('#screen-q7 .q7-chip[data-word="' + word + '"]');
  if (chip) { chip.dataset.placed = String(dropNum); chip.classList.add('q7-chip-placed'); }
  q7UpdateSubmitVisibility();
}

function q7RemoveFromDrop(dropNum) {
  var word = q7State.drops[dropNum];
  if (!word) return;
  q7State.drops[dropNum] = null;
  q7SetDropDisplay(dropNum, null, false);
  var chip = document.querySelector('#screen-q7 .q7-chip[data-word="' + word + '"]');
  if (chip) { delete chip.dataset.placed; chip.classList.remove('q7-chip-placed'); }
  q7UpdateSubmitVisibility();
}

function q7FindFirstEmpty() {
  for (var i = 1; i <= 2; i++) { if (!q7State.drops[i]) return i; }
  return null;
}

/* ── Submit ───────────────────────────────────────────────── */
function submitQ7() {
  if (q7State.done) return;
  if (!q7State.drops[1] || !q7State.drops[2]) return;

  q7State.attempts++;

  var isCorrect = (q7State.drops[1] === Q7_CORRECT[1] && q7State.drops[2] === Q7_CORRECT[2]);

  if (isCorrect) {
    for (var i = 1; i <= 2; i++) { q7SetDropDisplay(i, q7State.drops[i], true); }
    q7TransitionTo('correct');
    q7MarkDone(10);

  } else if (q7State.attempts >= 2) {
    var correctCount7 = 0;
    for (var k = 1; k <= 2; k++) {
      if (q7State.drops[k] === Q7_CORRECT[k]) correctCount7++;
    }
    q7ShowCorrectAnswers();
    q7TransitionTo('incorrect');
    q7MarkDone(correctCount7 * 5);

  } else {
    // First wrong → per-drop green/red feedback + tryagain
    for (var j = 1; j <= 2; j++) {
      var right = q7State.drops[j] === Q7_CORRECT[j];
      q7SetDropDisplay(j, q7State.drops[j], right, !right);
    }
    q7TransitionTo('tryagain');
  }
}

function q7ShowCorrectAnswers() {
  for (var i = 1; i <= 2; i++) {
    var correctWord = Q7_CORRECT[i];
    var existing    = q7State.drops[i];
    if (existing && existing !== correctWord) {
      var prevChip = document.querySelector('#screen-q7 .q7-chip[data-word="' + existing + '"]');
      if (prevChip) { prevChip.classList.remove('q7-chip-placed'); delete prevChip.dataset.placed; }
    }
    var correctChip = document.querySelector('#screen-q7 .q7-chip[data-word="' + correctWord + '"]');
    if (correctChip) { correctChip.dataset.placed = String(i); correctChip.classList.add('q7-chip-placed'); }
    q7State.drops[i] = correctWord;
    q7SetDropDisplay(i, correctWord, true, false);
  }
}

function q7TransitionTo(state) {
  var screen = document.getElementById('screen-q7');
  if (screen) screen.dataset.q7State = state;
  updateNavButtons();
}

function q7MarkDone(score) {
  q7State.done = true;
  var screen = document.getElementById('screen-q7');
  if (screen) { screen.dataset.qDone = 'true'; screen.dataset.qScore = String(score); }
  updateNavButtons();
}

/* ── Help toggle ──────────────────────────────────────────── */
function toggleQ7Help() {
  var screen = document.getElementById('screen-q7');
  if (!screen) return;
  screen.dataset.q7Help = (screen.dataset.q7Help === 'open') ? 'closed' : 'open';
}
