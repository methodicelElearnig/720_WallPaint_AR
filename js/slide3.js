'use strict';

/*
 * SLIDE 3 — Video-driven sequence (video/hot_cold_colors2.mp4)
 *
 * Phase 1: screen active → header slides in (CSS animation)
 * Phase 2: +2s → video starts playing
 * Phase 3: video t≥20.9s → left tubes appear (dark-green side)   — narration: "בתערובת יש יותר כחול"
 * Phase 4: video t≥26.2s → right tubes appear (light-green side) — narration: "בתערובת יש יותר צהוב"
 * Phase 5: video ended → unlock ► + freeze on last frame
 *
 * חזרה למסך אחרי שהסרטון כבר נצפה: קופאים על הפריים האחרון (לא שחור) +
 * מציגים כפתור "נגן שוב" שמריץ את כל הרצף מחדש.
 */

var _s3Timers = [];

/* הכותרת ("לפני שיתחילו בתכנון...") מונפשת פנימה רק בכניסה הראשונה למסך —
   בחזרה אליו (אחורה/קדימה שוב) היא נשארת קבועה במקום, בלי לחזור על האנימציה */
var _s3HeaderShown = false;

/* הסרטון מכיל פריים שחור טכני בעשירית השנייה האחרונה (חיתוך export) —
   קופאים קצת לפניו כדי שהסצנה האחרונה שנראית תהיה תוכן, לא שחור */
var S3_END_FRAME_OFFSET = 0.2;

function _s3FreezeOnLastFrame(video) {
  if (!video || !isFinite(video.duration)) return;
  video.currentTime = Math.max(0, video.duration - S3_END_FRAME_OFFSET);
}

var S3_ANIM_ELS = [
  '.slide3-mix-right-text',
  '.slide3-mix-left-text',
  '.slide3-tube-full-yellow',
  '.slide3-icon-plus-r',
  '.slide3-tube-little-blue',
  '.slide3-icon-equal-r',
  '.slide3-tube-light-green',
  '.slide3-tube-little-yellow',
  '.slide3-icon-plus-l',
  '.slide3-tube-full-blue',
  '.slide3-icon-equal-l',
  '.slide3-tube-dark-green',
];

function initSlide3() {
  _s3Timers.forEach(clearTimeout);
  _s3Timers = [];

  var scr       = document.getElementById('screen-slide3');
  var video     = document.getElementById('slide3-video');
  var replayBtn = document.getElementById('slide3-replay-btn');

  /* Header — animate only on the very first entry into this screen */
  if (_s3HeaderShown) {
    var header     = scr.querySelector('.slide3-header');
    var headerText = scr.querySelector('.slide3-header-text');
    if (header)     header.classList.add('s3-header-settled');
    if (headerText) headerText.classList.add('s3-header-settled');
  } else {
    _s3HeaderShown = true;
  }

  /* Reset all tube/text elements */
  S3_ANIM_ELS.forEach(function(sel) {
    var el = scr.querySelector(sel);
    if (!el) return;
    el.classList.remove('s3-rev-fadeup', 's3-rev-fadein', 's3-rev-pour', 's3-rev-fill');
    el.classList.add('s3-hidden');
    el.style.opacity = '';
  });

  /* Reset video */
  if (video) {
    video.pause();
    video.onended     = null;
    video.ontimeupdate = null;
  }
  if (replayBtn) replayBtn.classList.add('s3-hidden-btn');

  /* Already watched — freeze on last frame + show all elements, offer replay */
  if (video && video.dataset.watched === 'true') {
    _s3FreezeOnLastFrame(video);
    S3_ANIM_ELS.forEach(function(sel) {
      var el = scr.querySelector(sel);
      if (!el) return;
      el.classList.remove('s3-hidden');
      el.style.opacity = '1';
    });
    if (replayBtn) replayBtn.classList.remove('s3-hidden-btn');
    return;
  }

  if (!video) return;
  video.currentTime = 0;
  _playSlide3Sequence(scr, video);
}

function replaySlide3Video() {
  var scr       = document.getElementById('screen-slide3');
  var video     = document.getElementById('slide3-video');
  var replayBtn = document.getElementById('slide3-replay-btn');

  _s3Timers.forEach(clearTimeout);
  _s3Timers = [];

  if (replayBtn) replayBtn.classList.add('s3-hidden-btn');

  S3_ANIM_ELS.forEach(function(sel) {
    var el = scr.querySelector(sel);
    if (!el) return;
    el.classList.remove('s3-rev-fadeup', 's3-rev-fadein', 's3-rev-pour', 's3-rev-fill');
    el.classList.add('s3-hidden');
    el.style.opacity = '';
  });

  if (!video) return;
  video.pause();
  video.currentTime = 0;
  _playSlide3Sequence(scr, video);
}

/* _playSlide3Sequence — מריץ וידאו + תזמוני החשיפה (פאזות 2-5) */
function _playSlide3Sequence(scr, video) {
  var rightShown = false;
  var leftShown  = false;

  /* Show + lock helper */
  function show(sel, cls) {
    var el = scr.querySelector(sel);
    if (!el) return;
    el.classList.remove('s3-hidden');
    el.classList.add(cls);
    var lockMs = (cls === 's3-rev-pour' || cls === 's3-rev-fill') ? 1100 : 400;
    _s3Timers.push(setTimeout(function() {
      el.classList.remove(cls);
      el.style.opacity = '1';
    }, lockMs));
  }

  function at(ms, fn) { _s3Timers.push(setTimeout(fn, ms)); }

  /* Phase 2: start video after 2s */
  at(2000, function() {
    video.play().catch(function() {});
  });

  /* Phases 3 & 4: driven by video time */
  video.ontimeupdate = function() {
    var t = video.currentTime;

    if (!leftShown && t >= 20.9) {
      leftShown = true;
      show('.slide3-tube-little-yellow', 's3-rev-pour');
      show('.slide3-icon-plus-l',        's3-rev-fadein');
      show('.slide3-tube-full-blue',     's3-rev-fadein');
      at(1500, function() {
        show('.slide3-icon-equal-l',   's3-rev-fadein');
        show('.slide3-tube-dark-green','s3-rev-fill');
      });
    }

    if (!rightShown && t >= 26.2) {
      rightShown = true;
      show('.slide3-tube-full-yellow','s3-rev-pour');
      show('.slide3-icon-plus-r',     's3-rev-fadein');
      show('.slide3-tube-little-blue','s3-rev-fadein');
      at(1500, function() {
        show('.slide3-icon-equal-r',    's3-rev-fadein');
        show('.slide3-tube-light-green','s3-rev-fill');
      });
    }
  };

  /* Phase 5: unlock ► when video ends, freeze on last frame, offer replay */
  video.onended = function() {
    _s3FreezeOnLastFrame(video);
    markVideoWatched('slide3-video');
    var replayBtn = document.getElementById('slide3-replay-btn');
    if (replayBtn) replayBtn.classList.remove('s3-hidden-btn');
  };
}
