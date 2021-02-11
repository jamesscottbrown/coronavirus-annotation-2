import 'core-js/stable';
import 'regenerator-runtime/runtime';
import * as d3 from 'd3';

import { library, dom } from '@fortawesome/fontawesome-svg-core';
import { faCheck } from '@fortawesome/free-solid-svg-icons/faCheck';
import { fas } from '@fortawesome/free-solid-svg-icons';
import { far } from '@fortawesome/free-regular-svg-icons';
import { fab } from '@fortawesome/free-brands-svg-icons';
import { updateAnnotationSidebar } from './annotationDashboard/annotationBar';
import { formatVidPlayer, videoUpdates } from './annotationDashboard/video';
import { updateCommentSidebar } from './annotationDashboard/commentBar';
import { renderTimeline } from './annotationDashboard/timeline';
import { structureSelected } from './annotationDashboard/imageDataUtil';

const {
  renderUser, addCommentButton, toggleSort, renderIssueButton, addInfoBlurb,
} = require('./annotationDashboard/topbar');
const { formatAnnotationTime, annotationData } = require('./dataManager');
const { checkUser, loadConfig, fbConfig, loadFirebaseApp } = require('./firebaseUtil');

loadConfig();

library.add(faCheck, fas, far, fab);
dom.i2svg();
dom.watch();

d3.select('#wrapper').on('mousemove', (event, d)=>{
  let svg = document.getElementById('vid-svg');
  
  if(event.target != svg && structureSelected.selected === false){
    let tool = d3.select('.tooltip');
    tool.style('opacity', 0);
    tool.style('top', '-100px');
    tool.style('left', '-100px');
  }
})

let safariAgent = navigator.userAgent.indexOf("Safari") > -1; 
let chromeAgent = navigator.userAgent.indexOf("Chrome") === -1; 

if(safariAgent && chromeAgent){
  console.log("SAFAROOOOOO")
  window.alert("You are using Safari or Edge and this video may not load correctly. Please use Firefox or Chrome for best performance.");
}
  

init();

async function init() {
  const anno = formatAnnotationTime(await d3.csv('../static/assets/annotation_2.csv')).map((m, i) => {
    m.index = i;
    return m;
  });

  annotationData.push(anno);

  loadFirebaseApp();

  await checkUser([renderUser], [updateCommentSidebar, renderTimeline]);

  renderIssueButton(d3.select('#top-bar').select('#user'));
  updateAnnotationSidebar(anno, null, null);

  formatVidPlayer().then(()=> {
    d3.select('#loader').remove();
  });

  videoUpdates();

  d3.select('#about').on('mouseover', (event, d)=> {
    addInfoBlurb();
  }).on('mouseout', (event, d)=> {
    d3.select('body').select('.info-blurb').remove();
  });

  // // create a tooltip
  const tooltipTest = d3.select('#main').select('div.tooltip');
  const tooltip = tooltipTest.empty() ? d3.select('#main').append('div').classed('tooltip', true) : tooltipTest;

  tooltip.style('opacity', 0)
    .attr('class', 'tooltip')
    .style('background-color', 'white')
    .style('border', 'solid')
    .style('border-width', '2px')
    .style('border-radius', '5px')
    .style('padding', '5px');

  d3.select('#sort-by').select('input').on('click', (event) => toggleSort(event));
}
