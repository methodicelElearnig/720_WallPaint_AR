'use strict';
/* ============================================================
   dragdrop.js — QUES1 Drag & Drop question handler
   מחולל: ציור קיר — תכנית 720

   מנגנון:
     • 6 chips ב-word bank → 3 drop zones
     • גרירה (HTML5 DnD) + לחיצה להנחה (click-to-place)
     • לחיצה על drop מלא → החזרת chip ל-bank
     • 2 ניסיונות: שגוי → tryagain → שגוי שני → incorrect + unlock
     •             נכון (כל ניסיון) → correct + unlock
   ============================================================ */

const Q1_CORRECT_ANSWERS = { 1: '5', 2: 'الأزرق', 3: 'البارد والغامق' };
/* AR build: these values are the chips' visible Arabic labels — they must
   stay byte-identical to data-word / q1DragStart / q1ChipClick in index.html. */

let q1State  = { attempts: 0, drops: { 1: null, 2: null, 3: null }, done: false };
let q1DragWord = null;

/* ── Init / Reset ─────────────────────────────────────────────── */
function initQ1() {
  q1State = { attempts: 0, drops: { 1: null, 2: null, 3: null }, done: false };
  var screen = document.getElementById('screen-q1');
  if (!screen) return;
  screen.dataset.qState = 'main';
  screen.dataset.qHelp  = 'closed';
  delete screen.dataset.qDone;
  delete screen.dataset.qScore;
  delete screen.dataset.qSubmitReady;   // Fix 3: hide submit on reset

  // Restore all chips to word bank
  document.querySelectorAll('#screen-q1 .q1-chip').forEach(function(c) {
    c.classList.remove('q1-chip-placed');
    delete c.dataset.placed;
  });

  // Clear all drop zones
  for (var i = 1; i <= 3; i++) { q1SetDropDisplay(i, null, false); }
}

/* ── Submit visibility gating ────────────────────────────────── */
/* Fix 3: show submit only when all 3 drop zones are filled */
function q1UpdateSubmitVisibility() {
  var screen = document.getElementById('screen-q1');
  if (!screen) return;
  var allFilled = q1State.drops[1] && q1State.drops[2] && q1State.drops[3];
  if (allFilled) {
    screen.dataset.qSubmitReady = 'true';
  } else {
    delete screen.dataset.qSubmitReady;
  }
}

/* ── Try Again reset ─────────────────────────────────────────── */
/* Fix 2: "נסו שוב" button — visual reset only.
   attempts is PRESERVED so the next wrong submit → incorrect (not tryagain again).
   Score: correct after retry = 1pt (attempts will be 2 when scored). */
function resetQ1ForRetry() {
  var screen = document.getElementById('screen-q1');
  if (!screen) return;
  // Keep q1State.attempts — do NOT reset to 0
  q1State.drops = { 1: null, 2: null, 3: null };
  q1State.done  = false;

  screen.dataset.qState = 'main';
  screen.dataset.qHelp  = 'closed';
  delete screen.dataset.qDone;
  delete screen.dataset.qScore;
  delete screen.dataset.qSubmitReady;

  // Return all chips to word bank — cancel CSS entry animation so they appear immediately
  document.querySelectorAll('#screen-q1 .q1-chip').forEach(function(c) {
    c.classList.remove('q1-chip-placed');
    delete c.dataset.placed;
    c.style.animation = 'none';
    c.style.opacity   = '1';
    c.style.transform = 'translateY(0)';
  });
  // Clear all drop zone displays
  for (var i = 1; i <= 3; i++) { q1SetDropDisplay(i, null, false); }
}

/* ── Drop display helper ─────────────────────────────────────── */
/* correctStyle=true → green border; wrongStyle=true → red border */
function q1SetDropDisplay(dropNum, word, correctStyle, wrongStyle) {
  var drop = document.getElementById('q1-drop-' + dropNum);
  if (!drop) return;
  var label = drop.querySelector('.q1-drop-label');
  if (word) {
    drop.classList.add('q1-drop-filled');
    if (correctStyle) {
      drop.classList.add('q1-drop-correct-style');
      drop.classList.remove('q1-drop-wrong-style');
    } else if (wrongStyle) {
      drop.classList.add('q1-drop-wrong-style');
      drop.classList.remove('q1-drop-correct-style');
    } else {
      drop.classList.remove('q1-drop-correct-style', 'q1-drop-wrong-style');
    }
    drop.dataset.word = word;
    if (label) label.textContent = word;
  } else {
    drop.classList.remove('q1-drop-filled', 'q1-drop-correct-style', 'q1-drop-wrong-style');
    drop.dataset.word = '';
    if (label) label.textContent = '';
  }
}

/* ── Drag & Drop ─────────────────────────────────────────────── */
function q1DragStart(event, word) {
  if (q1State.done) { event.preventDefault(); return; }
  q1DragWord = word;
  event.dataTransfer.setData('text/plain', word);
  event.currentTarget.classList.add('q1-chip-dragging');
  // Fix 1: pin drag ghost to the element itself at cursor position
  // — prevents browser from upscaling the ghost image
  event.dataTransfer.setDragImage(event.currentTarget, event.offsetX, event.offsetY);
}

function q1DragEnd(event) {
  event.currentTarget.classList.remove('q1-chip-dragging');
  q1DragWord = null;
}

function q1DragOver(event) {
  if (!q1State.done) event.preventDefault();
}

function q1DropOnZone(event, dropNum) {
  if (q1State.done) return;
  event.preventDefault();
  var word = event.dataTransfer.getData('text/plain') || q1DragWord;
  q1DragWord = null;
  if (!word) return;
  q1PlaceWord(word, dropNum);
}

/* ── Click-to-place ─────────────────────────────────────────── */
function q1ChipClick(event, word) {
  if (q1State.done) return;
  var chip = event.currentTarget;
  if (chip.classList.contains('q1-chip-placed')) return;
  var empty = q1FindFirstEmpty();
  if (empty !== null) q1PlaceWord(word, empty);
}

function q1DropZoneClick(dropNum) {
  if (q1State.done) return;
  var word = q1State.drops[dropNum];
  if (word) q1RemoveFromDrop(dropNum);
}

/* ── Placement logic ─────────────────────────────────────────── */
function q1PlaceWord(word, dropNum) {
  // If word is already in another drop, remove from there first
  for (var i = 1; i <= 3; i++) {
    if (q1State.drops[i] === word && i !== dropNum) {
      q1RemoveFromDrop(i);
      break;
    }
  }
  // If target drop already occupied by a different word, return it first
  if (q1State.drops[dropNum] && q1State.drops[dropNum] !== word) {
    q1RemoveFromDrop(dropNum);
  }
  // Place
  q1State.drops[dropNum] = word;
  q1SetDropDisplay(dropNum, word, false);
  // Hide chip from word bank
  var chip = document.querySelector('#screen-q1 .q1-chip[data-word="' + word + '"]');
  if (chip) {
    chip.dataset.placed = String(dropNum);
    chip.classList.add('q1-chip-placed');
  }
  q1UpdateSubmitVisibility();  // Fix 3
}

function q1RemoveFromDrop(dropNum) {
  var word = q1State.drops[dropNum];
  if (!word) return;
  q1State.drops[dropNum] = null;
  q1SetDropDisplay(dropNum, null, false);
  // Return chip to word bank
  var chip = document.querySelector('#screen-q1 .q1-chip[data-word="' + word + '"]');
  if (chip) {
    delete chip.dataset.placed;
    chip.classList.remove('q1-chip-placed');
  }
  q1UpdateSubmitVisibility();  // Fix 3
}

function q1FindFirstEmpty() {
  for (var i = 1; i <= 3; i++) {
    if (!q1State.drops[i]) return i;
  }
  return null;
}

/* ── Submit ──────────────────────────────────────────────────── */
function submitQ1() {
  if (q1State.done) return;
  // All drops must be filled
  if (!q1State.drops[1] || !q1State.drops[2] || !q1State.drops[3]) return;

  q1State.attempts++;

  var isCorrect = (
    q1State.drops[1] === Q1_CORRECT_ANSWERS[1] &&
    q1State.drops[2] === Q1_CORRECT_ANSWERS[2] &&
    q1State.drops[3] === Q1_CORRECT_ANSWERS[3]
  );

  if (isCorrect) {
    // Apply green style to all placed chips
    for (var i = 1; i <= 3; i++) {
      q1SetDropDisplay(i, q1State.drops[i], true);
    }
    q1TransitionTo('correct');
    q1MarkDone(10);
  } else if (q1State.attempts >= 2) {
    // Second wrong attempt — count correct drops for partial credit before overwriting state
    var correctCount1 = 0;
    for (var k = 1; k <= 3; k++) {
      if (q1State.drops[k] === Q1_CORRECT_ANSWERS[k]) correctCount1++;
    }
    q1ShowCorrectAnswers();
    q1TransitionTo('incorrect');
    q1MarkDone(correctCount1 * (10 / 3));
  } else {
    // First wrong attempt — show per-drop green/red feedback, then tryagain
    for (var j = 1; j <= 3; j++) {
      var isDropRight = q1State.drops[j] === Q1_CORRECT_ANSWERS[j];
      q1SetDropDisplay(j, q1State.drops[j], isDropRight, !isDropRight);
    }
    q1TransitionTo('tryagain');
  }
}

function q1ShowCorrectAnswers() {
  for (var i = 1; i <= 3; i++) {
    var correctWord = Q1_CORRECT_ANSWERS[i];
    var existing    = q1State.drops[i];
    // Return wrong chip to bank
    if (existing && existing !== correctWord) {
      var prevChip = document.querySelector('#screen-q1 .q1-chip[data-word="' + existing + '"]');
      if (prevChip) { prevChip.classList.remove('q1-chip-placed'); delete prevChip.dataset.placed; }
    }
    // Mark correct chip as placed (hides it from bank)
    var correctChip = document.querySelector('#screen-q1 .q1-chip[data-word="' + correctWord + '"]');
    if (correctChip) { correctChip.dataset.placed = String(i); correctChip.classList.add('q1-chip-placed'); }
    // Update state + display — show green border (all displayed answers are correct)
    q1State.drops[i] = correctWord;
    q1SetDropDisplay(i, correctWord, true, false);
  }
}

function q1TransitionTo(state) {
  var screen = document.getElementById('screen-q1');
  if (screen) screen.dataset.qState = state;
  updateNavButtons();
}

function q1MarkDone(score) {
  q1State.done = true;
  var screen = document.getElementById('screen-q1');
  if (screen) {
    screen.dataset.qDone  = 'true';
    screen.dataset.qScore = String(score);
  }
  updateNavButtons();
}

/* ── Help toggle ────────────────────────────────────────────── */
function toggleQ1Help() {
  var screen = document.getElementById('screen-q1');
  if (!screen) return;
  screen.dataset.qHelp = (screen.dataset.qHelp === 'open') ? 'closed' : 'open';
}
