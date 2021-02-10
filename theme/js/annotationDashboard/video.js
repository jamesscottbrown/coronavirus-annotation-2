import * as d3 from 'd3';
import firebase from 'firebase/app';
import { annotationData, dataKeeper, formatTime, getRightDimension } from '../dataManager';
import { addCommentButton, goBackButton } from './topbar';
import {
  clearCanvas, colorDictionary, drawFrameOnPause, endDrawTime, getCoordColor, loadPngForFrame, makeNewImageData, parseArray, structureSelected, structureSelectedToggle, toggleQueue,
} from './imageDataUtil';
import {
  drawCommentBoxes, formatCommentData, updateCommentSidebar, clearRightSidebar, highlightCommentBoxes, renderCommentDisplayStructure, renderStructureKnowns,
} from './commentBar';
import { highlightAnnotationbar, updateAnnotationSidebar } from './annotationBar';
import { highlightTimelineBars, renderTimeline, colorTimeline } from './timeline';
import 'firebase/storage';
import { cancelLogin, userLoggedIn } from '../firebaseUtil';

export const currentColorCodes = [];

let canPlay;

const canvas = document.getElementById('canvas');
canvas.setAttribute('pointer-events', 'none');

function resizeVideoElements() {

  const video = document.getElementById('video');
  let dimension = getRightDimension();

  video.width = dimension.width;
  video.height = dimension.height;
  
  document.getElementById('interaction').style.width = `${Math.round(dimension.width)}px`;
  document.getElementById('interaction').style.height = `${dimension.height}px`;

  canvas.style.width = `${Math.round(dimension.width)}px`;
  canvas.style.height = `${dimension.height}px`;

  document.getElementById('video-controls').style.top = `${dimension.height + 7}px`;

  d3.select('.progress-bar').node().style.width = `${Math.round(dimension.width)}px`;

}

function initializeVideo() {

  const videoDuration = Math.round(document.getElementById('video').duration);
  const time = formatTime(videoDuration);
  const duration = document.getElementById('duration');
  duration.innerText = `${time.minutes}:${time.seconds}`;
  duration.setAttribute('datetime', `${time.minutes}m ${time.seconds}s`);
}

function addMouseEvents2Video(){

  d3.select('#interaction')
  .on('click', (event) => mouseClickVideo(d3.pointer(event), video))
  .on('mousemove', (event) => {
    toggleQueue(false);
    mouseMoveVideo(d3.pointer(event), video);
  });

  d3.select('#interaction')
    .on('mouseenter', ()=> {
      toggleQueue(false);
    })
    .on('mouseout', ()=> {
      if(!structureSelected.selected){
        let tool = d3.select('.tooltip');
        tool.style('opacity', 0);
        tool.style('top', '-100px');
        tool.style('left', '-100px');
        clearCanvas();
        drawFrameOnPause(video);
        toggleQueue(true);
      }
     
    });

}

export async function formatVidPlayer() {
  const video = document.getElementById('video');
  video.muted = true;
  video.controls = false;

  Object.defineProperty(HTMLMediaElement.prototype, 'playing', {
    get() {
      return !!(this.currentTime > 0 && !this.paused && !this.ended && this.readyState > 2);
    },
  });

  if(video.readyState >= 2) {
    
    canPlay = true;
    
     
    resizeVideoElements();
    drawFrameOnPause(video);

    addMouseEvents2Video();

    d3.select('#video-controls').select('.play-pause').on('click', () => {
      playButtonChange().then(()=> togglePlay());
    });
    d3.select('.progress-bar').on('click', progressClicked);


  }else{
    

    video.addEventListener('canplay', (event) => {
  
      canPlay = true;

  
       
      resizeVideoElements();
      drawFrameOnPause(video);
      addMouseEvents2Video();
  
      d3.select('#video-controls').select('.play-pause').on('click', () => {
        playButtonChange().then(()=> {
          togglePlay()});
      });
      d3.select('.progress-bar').on('click', progressClicked);
  
    });
  }

  //video.addEventListener('timeupdate', updateTimeElapsed);
  video.addEventListener('loadedmetadata', initializeVideo);
  window.addEventListener('resize', ()=> {
 
    resizeVideoElements();
    drawFrameOnPause(video);
    
    renderTimeline(dataKeeper[dataKeeper.length - 1]);

    const commentData = formatCommentData({...dataKeeper[dataKeeper.length - 1]});//Object.entries(dataKeeper[dataKeeper.length - 1].comments).map((m) => m[1]).filter((f) => f.replies === 'null');
    const timeRange = [video.currentTime < 1.5 ? 0 : Math.floor(video.currentTime - 1.5), video.currentTime + 1.5];
    const commentsInTimeframe = commentData.filter((f, i) => {
      const time = JSON.parse(f.videoTime);
      if (time.length > 1) {
        return time[0] <= video.currentTime && time[1] >= video.currentTime;
      }
      return time <= timeRange[1] && time >= timeRange[0];
    });
  
    const svgTest = d3.select('#interaction').select('svg');
    const svg = svgTest.empty() ? d3.select('#interaction').append('svg') : svgTest;

    if(d3.select('#show-push').select('input').node().checked){
      renderPushpinMarks(commentsInTimeframe, svg);
    }
    
  });
}
export function updateTimeElapsed() {

  d3.select('.progress-bar-fill').style('width', `${scaleVideoTime(document.getElementById('video').currentTime)}px`);
  const time = formatTime(Math.round(document.getElementById('video').currentTime));
  const timeElapsed = document.getElementById('time-elapsed');
  timeElapsed.innerText = `${time.minutes}:${time.seconds}`;
  timeElapsed.setAttribute('datetime', `${time.minutes}m ${time.seconds}s`);
 
  
  if(!d3.select('.template-wrap').empty()){
    d3.select('.template-wrap').select('h6').text(`Add a comment @ ${time.minutes} : ${time.seconds}`);
  }
}
function progressClicked(mouse) {

  const commentData = { ...dataKeeper[dataKeeper.length - 1] };

  const video = document.getElementById('video');
  
  video.currentTime = Math.round(scaleVideoTime(mouse.offsetX, true));
  updateTimeElapsed();

  unselectStructure(commentData, video);

  highlightAnnotationbar(document.getElementById('video').currentTime);

}
export function commentClicked(event, d) {
  document.getElementById('video').currentTime = d.videoTime;

  // d.clicked = true;

  if(d3.select('#show-push').select('input').node().checked){
    renderPushpinMarks(commentsInTimeframe, svg);
  }

  updateTimeElapsed();
  loadPngForFrame();
}
function scaleVideoTime(currentTime, invert) {
  const { duration } = document.getElementById('video');
  const scale = d3.scaleLinear().range([0, video.videoWidth]).domain([0, duration]);
  return invert ? scale.invert(currentTime) : scale(currentTime);
}
export async function playButtonChange() {
  const div = d3.select('#video-controls').select('.play-pause');

  if (video.playing) {
   
    div.select('.pause-span').style('opacity', 0);
    div.select('.play-span').style('opacity', 1);
  //  div.classed('play', true);
   // div.classed('pause', false);
   
  } else {
    div.select('.pause-span').style('opacity', 1);
    div.select('.play-span').style('opacity', 0);
  //  div.classed('play', false);
   // div.classed('pause', true);
 
  }
}

// togglePlay toggles the playback state of the video.
// If the video playback is paused or ended, the video is played
// otherwise, the video is paused
export function togglePlay() {
 
  if (video.playing) {
    video.pause();
    d3.selectAll('.anno').classed('de-em', false);
    d3.selectAll('.memo').classed('de-em', false);
    drawFrameOnPause(video);

  } else {
    video.play();
    d3.selectAll('.anno').classed('de-em', true);
    clearCanvas();
    structureSelectedToggle(null, null, null);
    clearRightSidebar();
    renderCommentDisplayStructure();
    updateCommentSidebar({ ...dataKeeper[dataKeeper.length - 1] });
    addCommentButton();
  }
}

export async function mouseMoveVideo(coord, video) {

    if(!video.playing && (structureSelected.selected === false && video.currentTime <= endDrawTime)){
    const snip = getCoordColor(coord);

    if (snip != currentColorCodes[currentColorCodes.length - 1] && !video.playing && snip != 'black' && snip != 'unknown') {

      currentColorCodes.push(snip);
      parseArray(snip);
      const structFromDict = (snip === 'orange' && video.currentTime > 16) ? colorDictionary[snip].structure[1].toUpperCase() : colorDictionary[snip].structure[0].toUpperCase();
     
      const structureData = annotationData[annotationData.length - 1].filter((f) => {
        return f.associated_structures.split(', ').map((m) => m.toUpperCase()).indexOf(structFromDict) > -1});
      structureTooltip(structureData, coord, snip, true);
      
      if(!structureSelected.selected){
        d3.select('.timeline-wrap').select('svg').select('.comm-group').selectAll('.comm-bin').classed('struct-present', false).select('rect').style('fill', 'rgb(105, 105, 105)');
        d3.select('.timeline-wrap').select('svg').select('.anno-group').selectAll('.anno').classed('struct-present', false).select('rect').style('fill', 'rgb(105, 105, 105)');
        colorTimeline(snip);
      }

    } else if (snip === 'black') {

      if(!structureSelected.selected){
        d3.select('.timeline-wrap').select('svg').select('.comm-group').selectAll('.comm-bin').classed('struct-present', false).select('rect').style('fill', 'rgb(105, 105, 105)');
        d3.select('.timeline-wrap').select('svg').select('.anno-group').selectAll('.anno').classed('struct-present', false).select('rect').style('fill', 'rgb(105, 105, 105)');
      
        let tool = d3.select('.tooltip');
        tool.style('opacity', 0);
        tool.style('top', '-100px');
        tool.style('left', '-100px');
  
        makeNewImageData();
      
      }
    }
  }
}

export function unselectStructure(commentData, video){
  addCommentButton();
  clearRightSidebar();

  structureSelectedToggle(null, null, null);
  colorTimeline(null);

  renderCommentDisplayStructure();
  
  updateCommentSidebar(commentData);
  updateAnnotationSidebar(annotationData[annotationData.length - 1], null, null);

  let tool = d3.select('.tooltip');
  tool.style('opacity', 0);
  tool.style('top', '-100px');
  tool.style('left', '-100px');

  drawFrameOnPause(video);
}

export async function mouseClickVideo(coord, video) {
  const commentData = { ...dataKeeper[dataKeeper.length - 1] };

  if (video.playing) {
    structureSelectedToggle(null);
    togglePlay();

    d3.select('.timeline-wrap').select('svg').select('.comm-group').selectAll('.comm-bin').classed('struct-present', false).select('rect').style('fill', 'rgb(105, 105, 105)');
    d3.select('.timeline-wrap').select('svg').select('.anno-group').selectAll('.anno').classed('struct-present', false).select('rect').style('fill', 'rgb(105, 105, 105)');
    const timeRange = [video.currentTime < .5 ? 0 : Math.floor(video.currentTime - .2), video.currentTime + .2];
    highlightTimelineBars(timeRange);

  } else {
    /**
     * VIDEO PAUSED - CLICKED NOT ON STRUCTURE
     */
    const snip = getCoordColor(coord);

    if (snip === 'black' || snip === 'unknown') {
     

      d3.select('.timeline-wrap').select('svg').select('.comm-group').selectAll('.comm-bin').classed('struct-present', false).select('rect').style('fill', 'rgb(105, 105, 105)');
      d3.select('.timeline-wrap').select('svg').select('.anno-group').selectAll('.anno').classed('struct-present', false).select('rect').style('fill', 'rgb(105, 105, 105)');

      const timeRange = [video.currentTime < .5 ? 0 : Math.floor(video.currentTime - .2), video.currentTime + .2];
      highlightTimelineBars(timeRange);
     
      if(!structureSelected.selected){
        togglePlay();
      }
      
     unselectStructure(commentData, video);

    }else if(snip === structureSelected.color){
    
        unselectStructure(commentData, video);

    } else {
      /**
       * VIDEO PAUSED - CLICKED ON STRUCTURE
       */
      if(userLoggedIn.loggedInBool === false){
        d3.select('#sign-in-wrap').selectAll('*').remove();
         cancelLogin();
      }
    
      let structure = (snip === 'orange' && video.currentTime > 16) ? colorDictionary[snip].structure[1] : colorDictionary[snip].structure[0];
      
      structureSelectedToggle(structure, coord, snip);
      colorTimeline(snip);
      let structureAnnotations = updateWithSelectedStructure(snip, commentData);
      structureTooltip(structureAnnotations, coord, snip, false);
    }
  }
}

export function updateWithSelectedStructure(snip, commentData){
  
  parseArray(snip);

  const nestReplies = formatCommentData({ ...commentData });
  let structure = (snip === "orange" && video.currentTime > 15) ? colorDictionary[snip].structure[1] : colorDictionary[snip].structure[0];

  structureSelected.comments = nestReplies.filter((f) => {
    if(snip  === 'orange'){
      let reply = f.replyKeeper.filter(r=> {
        return r.comment.toUpperCase().includes(structure.toUpperCase());
      });
      return f.comment.toUpperCase().includes(structure.toUpperCase()) || reply.length > 0;
    }else{
      let tags = f.tags.split(',').filter(m=> {
        return colorDictionary[snip].other_names.map(on=> on.toUpperCase()).indexOf(m.toUpperCase()) > -1;
      });
      let test = colorDictionary[snip].other_names.filter(n=> f.comment.toUpperCase().includes(n.toUpperCase()));
        let reply = f.replyKeeper.filter(r=> {
          let rTest = colorDictionary[snip].other_names.filter(n=> r.comment.toUpperCase().includes(n.toUpperCase()));
          return rTest.length > 0;
        });
      return test.length > 0 || reply.length > 0 || tags.length > 0;
    }
  });

  const structureAnnotations = annotationData[annotationData.length - 1].filter((f) => {
    let structure = (snip === "orange" && video.currentTime > 15) ? colorDictionary[snip].structure[1] : colorDictionary[snip].structure[0];
    if(snip === "orange"){
      let structsAnno = f.associated_structures.split(', ').filter((m) => {
        return structure.toUpperCase() === m.toUpperCase();
      });
      return structsAnno.length > 0;
    }else{
      let structsAnno = f.associated_structures.split(', ').filter((m) => {
        let otherNames = colorDictionary[snip].other_names.map(on=> on.toUpperCase()).indexOf(m.toUpperCase());
        return otherNames > -1;
      });
      return structsAnno.length > 0;
    }
  });

  let otherAnno = annotationData[annotationData.length - 1].filter((f) => {
    let structure = (snip === "orange" && video.currentTime > 15) ? colorDictionary[snip].structure[1] : colorDictionary[snip].structure[0];
    if(snip === "orange"){
      let structsAnno = f.associated_structures.split(', ').filter((m) => {
        return structure.toUpperCase() === m.toUpperCase();
      });
      return structsAnno.length === 0;
    }else{
      let structsAnno = f.associated_structures.split(', ').filter((m) => {
        let otherNames = colorDictionary[snip].other_names.map(on=> on.toUpperCase()).indexOf(m.toUpperCase());
        return otherNames > -1;
      });
      return structsAnno.length === 0;
    }
    
  });

  structureSelected.annotations = structureAnnotations.filter((f) => f.has_unkown === 'TRUE').concat(structureAnnotations.filter((f) => f.has_unkown === 'FALSE'));

  const annoWrap = d3.select('#left-sidebar');

  goBackButton();
  renderCommentDisplayStructure();

  const topCommentWrap = d3.select('#right-sidebar').select('.top');
  const genComWrap = d3.select('#comment-wrap').select('.general-comm-wrap');
  const selectedComWrap = d3.select('#comment-wrap').select('.selected-comm-wrap');
  
  // NEED TO CLEAR THIS UP - LOOKS LIKE YOU ARE REPEATING WORK IN UPDATE COMMENT SIDEBAR AND DRAW COMMETN BOXES
  updateCommentSidebar(commentData, structureSelected.comments);
  updateAnnotationSidebar(otherAnno, structureSelected.annotations, false);

  renderStructureKnowns(topCommentWrap);

  const stackedData = structureSelected.annotations.filter((f) => f.has_unkown == 'TRUE').concat(structureSelected.annotations.filter((f) => f.has_unkown == 'FALSE'));
  const annos = topCommentWrap.selectAll('.anno').data(stackedData).join('div').classed('anno', true);

  const unknowns = annos.filter((f) => f.has_unkown === 'TRUE');
  unknowns.classed('unknown', true);

  // MIGHT BE REPEATING WORK - ALREADY HAVE UPDATE COMMENT SIDEBAR ABOVE
  drawCommentBoxes(structureSelected.comments, selectedComWrap);
  //drawCommentBoxes(nestReplies, genComWrap);
  genComWrap.selectAll('.memo').style('opacity', 0.3);

  d3.select('#left-sidebar').select('#annotation-wrap').node().scrollTop = 0;
  d3.select('#right-sidebar').select('#comment-wrap').node().scrollTop = 0;
  
  //MAKE THESE SCROLL TO TOP.

  return structureAnnotations;
}
export function structureTooltip(structureData, coord, snip, hoverBool) {

  const commentData = { ...dataKeeper[dataKeeper.length - 1] };

  const nestReplies = formatCommentData({ ...commentData });
  let structure = (snip === "orange" && video.currentTime > 15) ? colorDictionary[snip].structure[1] : colorDictionary[snip].structure[0];
  let structureComments = nestReplies.filter((f) => {
    if(snip  === 'orange'){
      let reply = f.replyKeeper.filter(r=> {
        return r.comment.toUpperCase().includes(structure.toUpperCase());
      });
      return f.comment.toUpperCase().includes(structure.toUpperCase()) || reply.length > 0;
    }else{
      let tags = f.tags.split(',').filter(m=> {
        return colorDictionary[snip].other_names.map(on=> on.toUpperCase()).indexOf(m.toUpperCase()) > -1;
      });
      let test = colorDictionary[snip].other_names.filter(n=> f.comment.toUpperCase().includes(n.toUpperCase()));
        let reply = f.replyKeeper.filter(r=> {
          let rTest = colorDictionary[snip].other_names.filter(n=> r.comment.toUpperCase().includes(n.toUpperCase()));
          return rTest.length > 0;
        });
      return test.length > 0 || reply.length > 0 || tags.length > 0;
    }
  });

  //let structure = (snip === "orange" && video.currentTime > 16) ? colorDictionary[snip].structure[1].toUpperCase() : colorDictionary[snip].structure[0].toUpperCase();

  if (hoverBool) {
    const question = structureData.filter((f) => f.has_unkown === 'TRUE').length + structureComments.filter((f) => f.comment.includes('?')).length;
    const refs = structureData.filter((f) => f.url != '').length + structureComments.filter((f) => f.comment.includes('http')).length;

    d3.select('.tooltip')
      .style('position', 'absolute')
      .style('opacity', 1)
      .html(`<h4>${structure}</h4>
      <span class="badge badge-pill bg-dark">${structureData.length}</span> annotations for this structure. <br>
      <span class="badge badge-pill bg-dark">${structureComments.length}</span> comments for this structure. <br>
      <span class="badge badge-pill bg-danger">${question}</span> Questions. <br>
      <span class="badge badge-pill bg-primary">${refs}</span> Refs. <br>
      <br>
      <h7>Click Structure for more Info</h7>
      `).style('left', `${coord[0]+5}px`)
        .style('top', `${coord[1]+5}px`);

  } else {
    d3.select('.tooltip')
      .style('position', 'absolute')
      .style('opacity', 1)
      .html(`<h4>${structure}</h4>
    `)
      .style('left', `${coord[0]}px`)
      .style('top', `${coord[1]}px`);
  }
}
export function renderPushpinMarks(commentsInTimeframe, svg) {
  
  const pushes = commentsInTimeframe.filter((f) => f.commentMark === 'push');
  const pushedG = svg.selectAll('g.pushed').data(pushes).join('g').classed('pushed', true);
  let dimension = getRightDimension();
  pushedG.attr('transform', (d) => `translate(${(dimension.width * d.posLeft)}, ${(dimension.height * d.posTop)})`);

  const circ = pushedG.selectAll('circle').data((d) => [d]).join('circle');
  circ.attr('r', 10);

  circ.attr('cx', (d) => 0);
  circ.attr('cy', (d) => 0);

  circ.on('mouseover', (d) => {
    const wrap = d3.select('#right-sidebar').select('#comment-wrap');
    const memoDivs = wrap.selectAll('.memo').filter((f) => {
  
      return f.key === d.key});
    memoDivs.classed('selected', true);
    d3.select('#right-sidebar').select('#comment-wrap').node().scrollTop = memoDivs.nodes()[0].offsetTop;

  }).on('mouseout', (d) => {
    const wrap = d3.select('#right-sidebar').select('#annotation-wrap');
    const memoDivs = wrap.selectAll('.memo').classed('selected', false);
  });

  const annotationGroup = pushedG.selectAll('g.annotations').data((d) => [d]).join('g').classed('annotations', true);
  
  const labelRect = annotationGroup.selectAll('rect').data((d) => [d]).join('rect')
    .attr('x', 17)
    .attr('y', -20)
    .attr('width', (d)=> {
      return (d.displayName.split('').length * 9);
    })
    .attr('height', 30)
    .attr('fill', '#fff')
    .attr('fill-opacity', .9)
    .style('border-radius', '4px')


  const annotationText = annotationGroup.selectAll('text').data((d) => [d]).join('text')
    .text((d) => d.displayName)
    .classed('annotation-label', true)
    .attr('x', (d) => 22)
    .attr('y', (d) => 0);
}
export async function renderDoodles(commentsInTimeframe, div) {
  const storageRef = firebase.storage().ref();

  const doods = await storageRef.child('images/').listAll();

  d3.select('#interaction').selectAll('.doodles').remove();

  const doodles = commentsInTimeframe.filter((f) => f.commentMark === 'doodle');

  const doodFromStorage = doodles.map(async (dood) => {
    const urlDood = await doods.items.filter((f) => f._delegate._location.path_ === `images/${dood.doodleName}`)[0].getDownloadURL();
    return urlDood;
  });

  let dimension = getRightDimension();
  const images = d3.select('#interaction').selectAll('.doodles').data(await Promise.all(doodFromStorage)).join('img').classed('doodles', true);
  images.attr('src', (d) => d);
  images.attr('width', dimension.width);
  images.attr('height', dimension.height);

}
export function videoUpdates(data, annoType) {
  const svgTest = d3.select('#interaction').select('svg');
  const svg = svgTest.empty() ? d3.select('#interaction').append('svg') : svgTest;
  svg.attr('id', 'vid-svg');

  const video = document.querySelector('video');

  const interDIV = d3.select('#interaction');

  d3.select('#show-doodle').select('input').on('click', (event, d) => {
    if (!event.target.checked) {
      d3.select('#interaction').selectAll('.doodles').remove();
    } else {
      const commentData = formatCommentData({...dataKeeper[dataKeeper.length - 1]});//Object.entries(dataKeeper[dataKeeper.length - 1].comments).map((m) => m[1]).filter((f) => f.replies === 'null');

      const timeRange = [video.currentTime < 1.5 ? 0 : Math.floor(video.currentTime - 1.5), video.currentTime + 1.5];
      const commentsInTimeframe = commentData.filter((f, i) => {
        const time = JSON.parse(f.videoTime);
        if (time.length > 1) {
          return time[0] <= video.currentTime && time[1] >= video.currentTime;
        }
        return time <= timeRange[1] && time >= timeRange[0];
      });
      renderDoodles(commentsInTimeframe, interDIV);
    }
  });

  d3.select('#show-push').select('input').on('click', (event, d) => {
    if (!event.target.checked) {
      d3.select('#interaction').selectAll('.pushed').remove();
    } else {
      const commentData = formatCommentData({...dataKeeper[dataKeeper.length - 1]});//Object.entries(dataKeeper[dataKeeper.length - 1].comments).map((m) => m[1]).filter((f) => f.replies === 'null');
      const timeRange = [video.currentTime < 1.5 ? 0 : Math.floor(video.currentTime - 1.5), video.currentTime + 1.5];
      const commentsInTimeframe = commentData.filter((f, i) => {
        const time = JSON.parse(f.videoTime);
        if (time.length > 1) {
          return time[0] <= video.currentTime && time[1] >= video.currentTime;
        }
        return time <= timeRange[1] && time >= timeRange[0];
      });

      const svgTest = d3.select('#interaction').select('svg');
      const svg = svgTest.empty() ? d3.select('#interaction').append('svg') : svgTest;

      renderPushpinMarks(commentsInTimeframe, svg);
    }
  });

  video.ontimeupdate = async (event) => {
    const timeRange = [video.currentTime < .5 ? 0 : Math.floor(video.currentTime - .2), video.currentTime + .2];
   
    updateTimeElapsed();
    highlightTimelineBars(timeRange);

    const filteredAnnotations = annotationData[annotationData.length - 1]
      .filter((f) => f.seconds[0] <= timeRange[0] && f.seconds[0] <= timeRange[1]) || (f.seconds[1] <= timeRange[1] && f.seconds[1] >= timeRange[0]);

    /**
     * UPDATE AND HIGHLGIHT ANNOTATION BAR
     */
    updateAnnotationSidebar(filteredAnnotations, null, false);
    if(video.playing){
      d3.selectAll('.anno').classed('de-em', true);
      d3.selectAll('.memo').classed('de-em', true);
    }
   
    highlightAnnotationbar(video.currentTime);

    /*
    COMMENT MANIPULATION HERE
   */

    highlightCommentBoxes(timeRange);

    const commentData = formatCommentData({...dataKeeper[dataKeeper.length - 1]});//Object.entries(dataKeeper[dataKeeper.length - 1].comments).map((m) => m[1]).filter((f) => f.replies === 'null');

    const commentsInTimeframe = commentData.filter((f, i) => {
      const time = JSON.parse(f.videoTime);
      if (time.length > 1) {
        return time[0] <= video.currentTime && time[1] >= video.currentTime;
      }
      return time <= timeRange[1] && time >= timeRange[0];
    });

    if (d3.select('#show-doodle').select('input').node().checked) {
      renderDoodles(commentsInTimeframe, interDIV);
    }

    if (d3.select('#show-push').select('input').node().checked) {
      renderPushpinMarks(commentsInTimeframe, svg);
    }
  };
}
