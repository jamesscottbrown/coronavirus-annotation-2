import * as d3 from 'd3';
import {
  clearBoard,
  clearRightSidebar, formatToComment, renderCommentDisplayStructure, renderStructureKnowns, updateCommentSidebar,
} from './commentBar';
import {
  cancelLogin,
  userLoggedIn, userLogin,
} from '../firebaseUtil';
import { annotationData, dataKeeper } from '../dataManager';
import { clearCanvas, drawFrameOnPause, parseArray, structureSelected, structureSelectedToggle } from './imageDataUtil';
import { updateAnnotationSidebar } from './annotationBar';
import { structureTooltip, togglePlay, videoUpdates } from './video';

require('regenerator-runtime/runtime');
require('firebase/auth');
require('firebase/database');

export const showDoodle = false;
export const showPush = false;

export function toggleSort(event) {
  if (event.target.checked) {
    const sortedStructureData = annotationData[annotationData.length - 1].filter((f) => f.has_unkown === 'TRUE').concat(annotationData[annotationData.length - 1].filter((f) => f.has_unkown === 'FALSE'));
    updateAnnotationSidebar(annotationData[annotationData.length - 1], sortedStructureData, null);

  } else {
    updateAnnotationSidebar(annotationData[annotationData.length - 1], null, null);
  }
}

export function toggleSortRef(event) {
  if (event.target.checked) {
    const sortedStructureData = annotationData[annotationData.length - 1].filter((f) => f.ref != '' && f.ref != 'na').concat(annotationData[annotationData.length - 1].filter((f) => f.ref === '' && f.ref === 'na'));
    updateAnnotationSidebar(annotationData[annotationData.length - 1], sortedStructureData, null);

  } else {
    updateAnnotationSidebar(annotationData[annotationData.length - 1], null, null);
  }
}


export function renderIssueButton(wrap) {
  const bugLink = wrap.append('a');
  bugLink.attr('href', 'https://github.com/visdesignlab/coronavirus-annotation-2/issues');
  bugLink.attr('target', '_blank');
  bugLink.append('span').classed('fas fa-bug', true);

  bugLink.on('mouseover', (event)=>{
  
    let tool = d3.select('#general-tooltip');
    tool.style('opacity', 1);
    tool.style('top', '5px');
    tool.style('left', '30px');
    tool.style('background', '#eaeaea');
    tool.style('font-size', '12px');
    tool.style('border-radius', '5px');
    tool.style('padding', '5px');
    tool.style('width', '100px')
    tool.html(`<span>click on me to report bugs in the tool</span>`)
  });
  bugLink.on('mouseout', ()=> {
    let tool = d3.select('#general-tooltip');
    tool.style('opacity', 0);
    tool.style('top', '-150px');
    tool.style('left', '-100px');
  })
}

export function renderUser(userData) {
  const displayName = userData.displayName != null ? userData.displayName : userData.isAnonymous == false ? userData.email : 'Guest';
  const div = d3.select('#top-bar').select('#user');
  div.selectAll('text.user_name').data([displayName]).join('text').classed('user_name', true)
    .text(`  ${displayName}`);
}

export function addStructureLabelFromButton(structure) {
  d3.select('#top-bar').select('.add-comment').select('button').text(`Add Comment for ${structure}`);
}

export function goBackButton() {
  const button = d3.select('#top-bar').select('.add-comment').select('button');
  button.text('Go back');

  if(d3.select('#right-sidebar').select('.top').select('.template-wrap').empty()){
    d3.select('#comment-wrap').style('margin-top', '170px');
  }else{
    d3.select('#comment-wrap').style('margin-top', '420px');
  }
  
  button.on('click', (event) => {
    if(userLoggedIn.loggedInBool === false){ //if user is not logged in 
     if(!d3.select('#right-sidebar').select('.top').select('.found-info').empty()){
      structureSelectedToggle(null, null, null);
      clearRightSidebar();
      renderCommentDisplayStructure();
      updateCommentSidebar(dataKeeper[dataKeeper.length - 1]);
      updateAnnotationSidebar(annotationData[annotationData.length - 1], null, null);
      clearCanvas();
      drawFrameOnPause(document.getElementById('video'));

      let tool = d3.select('.tooltip');
        tool.style('opacity', 0);
        tool.style('top', '-100px');
        tool.style('left', '-100px');

     }else{
      cancelLogin();
     }
     d3.select('#right-sidebar').select('#sign-in-wrap').selectAll('*').remove();
     d3.select('#comment-wrap').style('margin-top', '0px');
     
     addCommentButton();
    
    }else{//if user is logged in 

      if(!d3.select('#right-sidebar').select('.top').select('.template-wrap').empty()){//IS THE COMMENT BOX UP
       
        clearBoard();

        if(structureSelected.selected){//structure selected
          d3.select('#right-sidebar').select('.top').selectAll('*').remove();
          renderStructureKnowns(d3.select('#right-sidebar').select('.top'));
          d3.select('#comment-wrap').style('margin-top', '170px');
          parseArray(structureSelected.color);
          structureTooltip(structureSelected.annotations, structureSelected.coord, structureSelected.color, false);
        }else{

          clearRightSidebar();
          renderCommentDisplayStructure();
          updateCommentSidebar(dataKeeper[dataKeeper.length - 1]);
          updateAnnotationSidebar(annotationData[annotationData.length - 1], null, null);
          addCommentButton();
          clearCanvas();
          d3.select('.tooltip').style('opacity', 0);

        }

      }else{

         d3.select('.timeline-wrap').select('svg').select('.comm-group').selectAll('.comm-bin').classed('struct-present', false).select('rect').style('fill', 'rgb(105, 105, 105)');
        d3.select('.timeline-wrap').select('svg').select('.anno-group').selectAll('.anno').classed('struct-present', false).select('rect').style('fill', 'rgb(105, 105, 105)');
        structureSelectedToggle(null);
        clearRightSidebar();
        renderCommentDisplayStructure();
        updateCommentSidebar(dataKeeper[dataKeeper.length - 1]);
        updateAnnotationSidebar(annotationData[annotationData.length - 1], null, null);
        addCommentButton();
        clearCanvas();
        d3.select('.tooltip').style('opacity', 0);


      }
    }
  });
}

export function addInfoBlurb(){
  
}

export function addCommentButton() {
  const button = d3.select('#top-bar').select('.add-comment').select('button');

  if (userLoggedIn.loggedInBool === false) {
    button.text('Log in to comment');
    button.on('click', (event) => {
      userLogin();
     d3.select('#comment-wrap').style('margin-top', '230px');
    });

  } else {
    button.text('Add Comment');
    button.on('click', (event) => {
      if(document.getElementById('video').playing){
        togglePlay();
      }
      clearRightSidebar();
      renderCommentDisplayStructure();
      d3.select('#interaction').style('pointer-events', 'all');
      const wrap = d3.select('#right-sidebar').select('.top');
      formatToComment(wrap, []);
      goBackButton();
    });
  }
}
