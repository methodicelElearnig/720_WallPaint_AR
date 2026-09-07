'use strict';

function initSlide10() {
  var video     = document.getElementById('slide10-video');
  var playBtn   = document.getElementById('slide10-play-btn');
  var resumeBtn = document.getElementById('slide10-resume-btn');
  var bubbles   = document.getElementById('slide10-bubbles');

  if (video)     { video.pause(); video.currentTime = 0; video.classList.add('slide10-video--hidden'); }
  if (playBtn)   playBtn.classList.remove('slide10-play-btn--hidden');
  if (resumeBtn) resumeBtn.classList.add('slide10-play-btn--hidden');
  if (bubbles)   bubbles.classList.add('slide10-bubbles--hidden');
}

function startSlide10Video() {
  var video   = document.getElementById('slide10-video');
  var playBtn = document.getElementById('slide10-play-btn');
  if (playBtn) playBtn.classList.add('slide10-play-btn--hidden');
  if (video)   { video.classList.remove('slide10-video--hidden'); video.play().catch(function() {}); }
}

/* Click on the playing video itself — pause + show a resume button
   in its place (doesn't touch the initial play button/overlay). */
function pauseSlide10Video() {
  var video     = document.getElementById('slide10-video');
  var resumeBtn = document.getElementById('slide10-resume-btn');
  if (!video || video.classList.contains('slide10-video--hidden') || video.paused) return;
  video.pause();
  if (resumeBtn) resumeBtn.classList.remove('slide10-play-btn--hidden');
}

function resumeSlide10Video() {
  var video     = document.getElementById('slide10-video');
  var resumeBtn = document.getElementById('slide10-resume-btn');
  if (video) video.play().catch(function() {});
  if (resumeBtn) resumeBtn.classList.add('slide10-play-btn--hidden');
}

function onSlide10VideoEnded() {
  var video     = document.getElementById('slide10-video');
  var resumeBtn = document.getElementById('slide10-resume-btn');
  var bubbles   = document.getElementById('slide10-bubbles');
  if (video)     video.classList.add('slide10-video--hidden');
  if (resumeBtn) resumeBtn.classList.add('slide10-play-btn--hidden');
  if (bubbles)   bubbles.classList.remove('slide10-bubbles--hidden');
  markVideoWatched('slide10-video');
}
