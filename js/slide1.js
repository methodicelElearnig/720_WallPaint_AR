'use strict';

function initSlide1() {
  var video   = document.getElementById('slide1-video');
  var playBtn = document.getElementById('slide1-play-btn');
  if (video)   { video.pause(); video.currentTime = 0; video.classList.add('slide1-video--hidden'); }
  if (playBtn) playBtn.classList.remove('slide1-play-btn--hidden');
}

function startSlide1Video() {
  var video   = document.getElementById('slide1-video');
  var playBtn = document.getElementById('slide1-play-btn');
  if (playBtn) playBtn.classList.add('slide1-play-btn--hidden');
  if (video)   { video.classList.remove('slide1-video--hidden'); video.play().catch(function() {}); }
}

function onSlide1VideoEnded() {
  var video = document.getElementById('slide1-video');
  if (video) video.classList.add('slide1-video--hidden');
  markVideoWatched('slide1-video');
}
