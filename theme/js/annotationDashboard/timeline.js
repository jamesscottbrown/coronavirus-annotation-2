import * as d3 from 'd3';
import { annotationData, dataKeeper, formatTime, getRightDimension } from '../dataManager';
import { updateAnnotationSidebar } from './annotationBar';
import { formatCommentData } from './commentBar';
import { colorDictionary, structureSelected } from './imageDataUtil';
import {togglePlay, unselectStructure} from './video';

export function hoverEmphasis(d, type){
  if(type === "comment"){
    d3.select('.timeline-wrap').select('svg').select('.comm-group').selectAll('.comm-bin').filter(f=> f.key === d.key).classed('hover-em', true);
    
  }else{
    d3.select('.timeline-wrap').select('svg').select('.anno-group').selectAll('.anno').filter(f=> f.key === d.key).classed('hover-em', true);
    d3.selectAll('#annotation-wrap').selectAll('.anno').filter(f=> f.key === d.key).classed('hover-em', true);
  }
}

export function colorTimeline(snip){

  let video = document.getElementById('video');
  d3.select('.timeline-wrap').select('svg').select('.comm-group').selectAll('.comm-bin').classed('struct-present', false).select('rect').style('fill', 'rgb(105, 105, 105)');
  d3.select('.timeline-wrap').select('svg').select('.anno-group').selectAll('.anno').classed('struct-present', false).select('rect').style('fill', 'rgb(105, 105, 105)');

  if(snip != null){
    if(snip === "orange"){
      let structure = (snip === "orange" && video.currentTime > 16) ? colorDictionary[snip].structure[1].toUpperCase() : colorDictionary[snip].structure[0].toUpperCase();
      let color = colorDictionary[snip].code;
      let comm = d3.select('.timeline-wrap').select('svg').select('.comm-group').selectAll('.comm-bin').filter(c=> {
        let rep = c.replyKeeper.filter(r=> r.comment.toUpperCase().includes(structure));
        return c.comment.toUpperCase().includes(structure) || rep.length > 0;
      });
      comm.classed('struct-present', true).select('rect').style('fill', `rgb(${color[0]}, ${color[1]}, ${color[2]})`);
  
      d3.select('.timeline-wrap').select('svg').select('.anno-group').selectAll('.anno').filter(a => {
        return a.associated_structures.toUpperCase().includes(structure);
      }).classed('struct-present', true).select('rect').style('fill', `rgb(${color[0]}, ${color[1]}, ${color[2]})`);
  
  
    }else{
  
      colorDictionary[snip].other_names.map(f=> {
        let name = f.toUpperCase();
        let color = colorDictionary[snip].code;
        let comm = d3.select('.timeline-wrap').select('svg').select('.comm-group').selectAll('.comm-bin').filter(c=> {
          let rep = c.replyKeeper.filter(r=> r.comment.toUpperCase().includes(name));
          return c.comment.toUpperCase().includes(name) || rep.length > 0;
        });
        comm.classed('struct-present', true).select('rect').style('fill', `rgb(${color[0]}, ${color[1]}, ${color[2]})`);
    
        d3.select('.timeline-wrap').select('svg').select('.anno-group').selectAll('.anno').filter(a => {
          return a.associated_structures.toUpperCase().includes(name);
        }).classed('struct-present', true).select('rect').style('fill', `rgb(${color[0]}, ${color[1]}, ${color[2]})`);
    
      });
  
    }
  }

}

function structureTooltip(coord, d, type) {
  let dim = getRightDimension();
  const xScale = d3.scaleLinear().domain([0, 89]).range([0, dim.width]);
  if (type === 'comments') {
    let formatedTime = formatTime(d.videoTime);

    let blurb = d.comment.split(' ').filter((f, i)=> i < 8);
    function addS(a, stri){
      return a + " " + stri;
    }
    let stringB = blurb.reduce(addS, "")
    
    d3.select('#timeline-tooltip')
      .style('position', 'absolute') 
      .style('pointer-events', 'all')
      .style('opacity', 1)
      .html(`
        <h7 style="color:gray">${formatedTime.minutes}:${formatedTime.seconds}  - </h7>
        <h7 style="color:gray">${d.displayName}</h7><br>
        <h7>${stringB + (blurb.length > 8 ? '...' : ' ')}</h7><br>
        <h7>${d.replyKeeper.length} replies</h7>
        `)
      .style('left', `${xScale(d.videoTime)}px`)
      .style('top', '-60px');
  } else {
    
    let blurb = d.text_description.split(' ').filter((f, i)=> i < 8);
    function addS(a, stri){
      return a + " " + stri;
    }
    let stringB = blurb.reduce(addS, "")
 
    d3.select('#timeline-tooltip')
      .style('position', 'absolute')
      .style('opacity', 1)
      .html(`
      <h7 style="color:gray">${d.video_time}</h7><br>
      <h7>${stringB + "..."}</h7>
        `)
      .style('left', `${coord[0]}px`)
      .style('top', `${coord[1]}px`);
  }
}

export function renderTimeline(commentData) {

  let dim = getRightDimension();

  const xScale = d3.scaleLinear().domain([0, 89]).range([0, dim.width]);
 
  const div = d3.select('#main');

  let comms = formatCommentData(commentData);
  const binScale = d3.scaleLinear().range([.1, 1]).domain([0, comms.map(m=> Math.max(m.replyKeeper.length))]);
  

  let masterData = [{comments: {data: comms, label: "comments"}, annotations: {data:annotationData[annotationData.length - 1], label: "annotations"}}];

  const timelineWrap = div.select('.timeline-wrap');
  timelineWrap.style('position', 'relative');
  timelineWrap.style('top', `${(dim.height + dim.margin)}px`);
  const timeSVG = timelineWrap.selectAll('svg').data(masterData).join('svg');
  timeSVG.style('width', `${dim.width+20}px`);

  const commentGroup = timeSVG.selectAll('g.comm-group').data(d=> [d.comments]).join('g').classed('comm-group', true);
  commentGroup.attr('transform', 'translate(3, 0)')
  commentGroup.selectAll('text').data(d => [d.label]).join('text').text(d=> d).style('font-size', '11px').style('fill', 'gray').attr('transform', 'translate(-2, 10)');
  const comBins = commentGroup.selectAll('g.comm-bin').data(d=> d.data).join('g').classed('comm-bin', true);
 comBins.attr('transform', (d, i) => `translate(${xScale(d.videoTime)} 15)`);
  const commentBinRect = comBins.selectAll('rect').data((d) => [d]).join('rect');
  commentBinRect.attr('height', 10).attr('width', 2);
  commentBinRect.style('fill-opacity', (d, i) => binScale(d.replyKeeper.length));

  comBins.on('mouseover', (event, d) => commentBinTimelineMouseover(event, d));
  comBins.on('mouseout', (event, d) => commentBinTimelineMouseout(event, d));
  comBins.on('click', (event, d)=> {
    if(document.getElementById('video').playing){
      togglePlay();
    }
    document.getElementById('video').currentTime = d.videoTime;
 
    const comments = d3.select('#right-sidebar').select('#comment-wrap').selectAll('.memo');
    const filComm = comments.filter((f) => d.key === f.key);
    filComm.classed('selected', true);
    if(filComm.nodes().length > 0){
      console.log(filCom)
      d3.select('#right-sidebar').select('#comment-wrap').node().scrollTop = filComm.nodes()[0].offsetTop;  
    }
      
   // });
    if(structureSelected.selected){
      unselectStructure({ ...dataKeeper[dataKeeper.length - 1] }, document.getElementById('video'));
    }
  
    
  })


  const annoGroup = timeSVG.selectAll('g.anno-group').data(d => {
    return [d.annotations]}).join('g').classed('anno-group', true);
  annoGroup.selectAll('text').data(d => [d.label]).join('text').text(d=> d).style('font-size', '11px').style('fill', 'gray').attr('transform', 'translate(0, -4)');
  annoGroup.attr('transform', 'translate(0, 42)');
  
  const annos = annoGroup.selectAll('g.anno').data(d => d.data).join('g').classed('anno', true);
  const rects = annos.selectAll('rect').data((d) => [d]).join('rect');
  rects.attr('height', 6).attr('width', (d) => (xScale(d.seconds[1]) - xScale(d.seconds[0])));

  annos.attr('transform', (d, i, n) => {
    if (i > 0) {
      const chosen = d3.selectAll(n).data().filter((f, j) => j < i && f.seconds[1] > d.seconds[0]);
      return `translate(${xScale(d.seconds[0])} ${(7 * chosen.length)})`;
    }
    return `translate(${xScale(d.seconds[0])} 0)`;
  });

  annos.on('mouseover', (event, d) => {
    timelineMouseover(event, d);
    hoverEmphasis(d, 'annotation');
  })
  .on('mouseout', (event, d) => {
    timelineMouseout(event, d);
    d3.selectAll('.hover-em').classed('hover-em', false);
  });
  annos.on('click', (event, d)=> { 
    if(document.getElementById('video').playing){
      togglePlay();
    }
    document.getElementById('video').currentTime = d.seconds[0];

    if(structureSelected.selected){
      unselectStructure({ ...dataKeeper[dataKeeper.length - 1] }, document.getElementById('video'));
    }
    
  })
}

export function highlightTimelineBars(timeRange) {

  let time = document.getElementById('video').currentTime;

  d3.select('.timeline-wrap').selectAll('.anno')
    .filter((f) => {
      return time >= f.seconds[0] && time <= f.seconds[1];
    })
    .classed('current', true);

  d3.select('.timeline-wrap').selectAll('.anno')
    .filter((f) => time < f.seconds[0] || time > f.seconds[1])
    .classed('current', false);
}

export function commentBinTimelineMouseover(event, d) {
  d3.select(event.target.parentNode).classed('current-hover', true);

  d3.select('.progress-bar').append('div');
  if (d) {
    
    const comments = d3.select('#right-sidebar').select('#comment-wrap').selectAll('.memo');
    const filComm = comments.filter((f) => d.key === f.key);
    filComm.classed('selected', true);
    if(filComm.nodes().length > 0){
      d3.select('#right-sidebar').select('#comment-wrap').node().scrollTop = filComm.nodes()[0].offsetTop;
    }
    
    let rectNodes = d3.selectAll('.comm-bin').select('rect').nodes();
    let jump  = 960  / rectNodes.length;

    let measuereLeft = (jump * rectNodes.indexOf(event.target))

    structureTooltip([measuereLeft + (jump+5)], d, 'comments');
  }
}

export function commentBinTimelineMouseout(event, d) {
  d3.select('#progress-highlight').remove();
  d3.select(event.target.parentNode).classed('current-hover', false);
  const comments = d3.select('#right-sidebar').select('#comment-wrap').selectAll('.memo');
 comments.filter((f) => f.key === d.key).classed('selected', false);
  d3.select('#timeline-tooltip').style('opacity', 0).style('left', "-200px").style('top', "-200px");
}

export function timelineMouseover(event, d) {
  let dim = getRightDimension();
  const xScale = d3.scaleLinear().domain([0, 89]).range([0, dim.width]);
  let hoverRectWidth  =  xScale(d.seconds[1]) - xScale(d.seconds[0]);

  d3.select('.progress-bar').append('div').attr('id', 'progress-highlight')
  .style('position', 'absolute')
  .style('left', `${xScale(d.seconds[0])}px`).style('opacity', '.2')
  .style('background-color', 'orange')
  .style('border-radius', 0)
  .style('width', `${hoverRectWidth}px`);

  d3.select(event.target.parentNode).classed('current-hover', true);
  
  const filAnn = d3.select('#left-sidebar').selectAll('.anno').filter((f) => f.index === d.index).classed('selected', true);
  if(!filAnn.empty()){
     //filAnn.nodes()[0].scrollIntoView({behavior: 'smooth', block: 'nearest'});//.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'start' });
     let scroll = filAnn.nodes()[0].offsetTop;
     d3.select('#left-sidebar').select('#annotation-wrap').node().scrollTop = scroll;
  }else{
    updateAnnotationSidebar([d], null, true);
  
    d3.select('#annotation-wrap')
    .style('top', `${d3.select('#left-sidebar').select('.mouse-over-wrap').select('.anno').node().getBoundingClientRect().height + 100}px`);

  }
  
  const coord = d3.pointer(event);
  structureTooltip([(event.target.getBoundingClientRect().x - 300) + coord[0], coord[1]], d, 'anno');
}

export function timelineMouseout(event, d) {
  d3.select('#progress-highlight').remove();
  d3.select(event.target.parentNode).classed('current-hover', false);
  d3.select('#left-sidebar').selectAll('.anno').filter((f) => f.index === d.index).classed('selected', false);

  d3.select('#timeline-tooltip').style('opacity', 0).style('left', "-200px").style('top', "-200px").style('pointer-events', 'none');
  d3.select('#left-sidebar').select('.mouse-over-wrap').selectAll('*').remove();
  d3.select('#annotation-wrap').style('top', '50px');
}
