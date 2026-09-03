'use strict';
/* ============================================================
   slide5.js — SLIDE5 phone applet state handler

   States: data-s5-state="closed" | "open" (on #screen-slide5)
   Completion gate: data-applet-opened="true" → unlocks NEXT arrow
   Persistence: sessionStorage key 's5-applet-opened'

   Functions:
     initS5()        — called on screen enter; restores sessionStorage
     openS5Applet()  — phone click → open applet + mark complete
     closeS5Applet() — × button → close visually (completion kept)
   ============================================================ */

function initS5() {
  var screen = document.getElementById('screen-slide5');
  if (!screen) return;

  // Always start in closed visual state when entering screen
  screen.dataset.s5State = 'closed';

  // Restore completion from sessionStorage (NEXT stays unlocked)
  var opened = sessionStorage.getItem('s5-applet-opened');
  if (opened === 'true') {
    screen.dataset.appletOpened = 'true';
  } else {
    delete screen.dataset.appletOpened;
  }

  updateNavButtons();
}

function openS5Applet() {
  var screen = document.getElementById('screen-slide5');
  if (!screen) return;

  screen.dataset.s5State = 'open';

  // Mark as opened — unlocks NEXT (persists across nav)
  screen.dataset.appletOpened = 'true';
  sessionStorage.setItem('s5-applet-opened', 'true');

  updateNavButtons();
}

function closeS5Applet() {
  var screen = document.getElementById('screen-slide5');
  if (!screen) return;

  screen.dataset.s5State = 'closed';
  // appletOpened stays true — NEXT remains unlocked

  // Close zoom too if open
  closeS5Zoom();

  updateNavButtons();
}

/* selectS5YN — בחירת כן/לא עבור היגד בסעיף ב; מציג ✔ ליד התשובה הנכונה */
function selectS5YN(rowId, value) {
  var row = document.querySelector('.s5-yn-row[data-s5-yn="' + rowId + '"]');
  if (!row) return;
  row.dataset.s5YnAnswer = value;
}

/* openS5Zoom / closeS5Zoom — תצוגה מוגדלת של היישומון */
function openS5Zoom() {
  var overlay = document.getElementById('s5-zoom-overlay');
  if (!overlay) return;
  overlay.classList.add('open');
  overlay.setAttribute('aria-hidden', 'false');
}

function closeS5Zoom() {
  var overlay = document.getElementById('s5-zoom-overlay');
  if (!overlay) return;
  overlay.classList.remove('open');
  overlay.setAttribute('aria-hidden', 'true');
}
