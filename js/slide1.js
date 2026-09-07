'use strict';

function initSlide1() {
  var video     = document.getElementById('slide1-video');
  var playBtn   = document.getElementById('slide1-play-btn');
  var resumeBtn = document.getElementById('slide1-resume-btn');
  if (video)     { video.pause(); video.currentTime = 0; video.classList.add('slide1-video--hidden'); }
  if (playBtn)   playBtn.classList.remove('slide1-play-btn--hidden');
  if (resumeBtn) resumeBtn.classList.add('slide1-play-btn--hidden');
}

function startSlide1Video() {
  var video   = document.getElementById('slide1-video');
  var playBtn = document.getElementById('slide1-play-btn');
  if (playBtn) playBtn.classList.add('slide1-play-btn--hidden');
  if (video)   { video.classList.remove('slide1-video--hidden'); video.play().catch(function() {}); }
}

/* Click on the playing video itself — pause + show a resume button
   in its place (doesn't touch the initial play button/overlay). */
function pauseSlide1Video() {
  var video     = document.getElementById('slide1-video');
  var resumeBtn = document.getElementById('slide1-resume-btn');
  if (!video || video.classList.contains('slide1-video--hidden') || video.paused) return;
  video.pause();
  if (resumeBtn) resumeBtn.classList.remove('slide1-play-btn--hidden');
}

function resumeSlide1Video() {
  var video     = document.getElementById('slide1-video');
  var resumeBtn = document.getElementById('slide1-resume-btn');
  if (video) video.play().catch(function() {});
  if (resumeBtn) resumeBtn.classList.add('slide1-play-btn--hidden');
}

function onSlide1VideoEnded() {
  var video     = document.getElementById('slide1-video');
  var resumeBtn = document.getElementById('slide1-resume-btn');
  if (video)     video.classList.add('slide1-video--hidden');
  if (resumeBtn) resumeBtn.classList.add('slide1-play-btn--hidden');
  markVideoWatched('slide1-video');
}
