'use strict';

function initSlide10() {
  var video   = document.getElementById('slide10-video');
  var playBtn = document.getElementById('slide10-play-btn');
  var bubbles = document.getElementById('slide10-bubbles');

  if (video)   { video.pause(); video.currentTime = 0; video.classList.add('slide10-video--hidden'); }
  if (playBtn) playBtn.classList.remove('slide10-play-btn--hidden');
  if (bubbles) bubbles.classList.add('slide10-bubbles--hidden');
}

function startSlide10Video() {
  var video   = document.getElementById('slide10-video');
  var playBtn = document.getElementById('slide10-play-btn');
  if (playBtn) playBtn.classList.add('slide10-play-btn--hidden');
  if (video)   { video.classList.remove('slide10-video--hidden'); video.play().catch(function() {}); }
}

function onSlide10VideoEnded() {
  var video   = document.getElementById('slide10-video');
  var bubbles = document.getElementById('slide10-bubbles');
  if (video)   video.classList.add('slide10-video--hidden');
  if (bubbles) bubbles.classList.remove('slide10-bubbles--hidden');
  markVideoWatched('slide10-video');
}
