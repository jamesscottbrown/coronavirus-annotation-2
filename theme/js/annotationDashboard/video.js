import * as d3 from 'd3';
import { formatTime } from '../dataManager';

let canPlay;
const canvas = document.getElementById('canvas');

function resizeVideoElements(){
  let video = document.getElementById('video');
  document.getElementById('interaction').style.width = Math.round(video.videoWidth)+'px';
  document.getElementById('interaction').style.height = video.videoHeight+'px';

  d3.select('canvas').node().style.width = Math.round(video.videoWidth)+'px';
  d3.select('canvas').node().style.height = video.videoHeight+'px';

  document.getElementById('video-controls').style.top = (video.videoHeight + 7)+'px';

  d3.select('.progress-bar').node().style.width = Math.round(video.videoWidth)+'px';
}

function initializeVideo() {
  console.log('is this initializing?');
  const videoDuration = Math.round(document.getElementById('video').duration);
  const time = formatTime(videoDuration);
  let duration = document.getElementById('duration');
  duration.innerText = `${time.minutes}:${time.seconds}`;
  duration.setAttribute('datetime', `${time.minutes}m ${time.seconds}s`)
}

export function formatVidPlayer(div, isInteractive){

    let videoSelection = d3.select(div).select('video');
  
    let video = videoSelection.node();
    video.muted = true;

    Object.defineProperty(HTMLMediaElement.prototype, 'playing', {
      get: function(){
          return !!(this.currentTime > 0 && !this.paused && !this.ended && this.readyState > 2);
      }
    });
  
    video.oncanplay = function(){
      if (video.readyState >= 3) {
  
        canPlay = true;
  
        if(isInteractive){

          resizeVideoElements();
       
         // context = canvas.getContext('2d');
  
          //let imgOb = loadPngForFrame();

        }else{ resizeStuff(); }
    
      } else {
        video.addEventListener('canplay', canPlay = true);
      }

     // video.addEventListener('loadedmetadata', initializeVideo);
      //initializeVideo();

      
      // playButton.addEventListener('click', function () {
    
      //   if(togglePlay()) {
      //     video.pause();
      //    // drawFrameOnPause(d3.select('#context-map').node());
      //    drawFrameOnPause();
      //   }else{
      //     video.play();
  
      //     removeStructureLabelFromButton();
      //     context.clearRect(0, 0, canvas.width, canvas.height);
      //   }
    
      // });
    
      // customControls(video);
    
      // // create a tooltip
      // var tooltip = d3.select('#main-wrap').append('div');
      // tooltip.style("opacity", 0)
      //   .attr("class", "tooltip")
      //   .style("background-color", "white")
      //   .style("border", "solid")
      //   .style("border-width", "2px")
      //   .style("border-radius", "5px")
      //   .style("padding", "5px");
    
      // return playing;
    }

    video.addEventListener('timeupdate', updateTimeElapsed);
    video.addEventListener('loadedmetadata', initializeVideo);

    d3.select('#video-controls').select('.play-pause').on('click', ()=> togglePlay());
    d3.select('.progress-bar').on('click', progressClicked);


  }
function updateTimeElapsed() {
  let time = formatTime(Math.round(document.getElementById('video').currentTime));
  let timeElapsed = document.getElementById('time-elapsed');
  timeElapsed.innerText = `${time.minutes}:${time.seconds}`;
  timeElapsed.setAttribute('datetime', `${time.minutes}m ${time.seconds}s`);
  d3.select('.progress-bar-fill').style('width', scaleVideoTime(document.getElementById('video').currentTime)+'px');
}

function progressClicked(mouse){
  console.log(mouse);
  document.getElementById('video').currentTime = Math.round(scaleVideoTime(mouse.offsetX, true));
  updateTimeElapsed();
}

function scaleVideoTime(currentTime, invert){
  let duration = document.getElementById('video').duration;
  let scale = d3.scaleLinear().range([0, video.videoWidth]).domain([0, duration]);
  return invert ? scale.invert(currentTime) : scale(currentTime);
}

export function playButtonChange(){
  let div = d3.select('#video-controls').select('.play-pause');
  if(div.classed('play')){
    div.classed('play', false);
    div.classed('pause', true);
    div.selectAll('*').remove();
    let button = div.append('span');
    button.attr('class', 'fas fa-pause-circle fa-2x');
  }else{
    div.classed('play', true);
    div.classed('pause', false);
    div.selectAll('*').remove();
    let button = div.append('span');
    button.attr('class', 'fas fa-play-circle fa-2x');
  }
}

// togglePlay toggles the playback state of the video.
// If the video playback is paused or ended, the video is played
// otherwise, the video is paused
export function togglePlay() {
  playButtonChange();
  if (video.playing) {
    video.pause();
  } else {
    video.play();
  }
}