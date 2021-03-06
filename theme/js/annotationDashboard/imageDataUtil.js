export const endDrawTime = 87;
import * as d3 from 'd3';
import { getRightDimension } from '../dataManager';

export const structureSelected = {
  selected: false,
  structure: null,
  annotations: null,
  comments: null,
  coord: null,
  color: null
};

export function structureSelectedToggle(datum, coords, color) {
  structureSelected.structure = datum;

  if (datum === null) {
    structureSelected.annotations = null;
    structureSelected.comments = null;
    structureSelected.selected = false;
    structureSelected.coord = null;
    structureSelected.color = null;
    d3.selectAll('.memo').classed('disabled', false);
  } else {
    structureSelected.selected = true;
    structureSelected.coord = coords;
    structureSelected.color = color;
    d3.selectAll('.memo').classed('disabled', true);
  }
}

export const doodleKeeper = [];

export const colorDictionary = {//(60,179,113)
  blue: { code: [0, 0, 255], color: 'blue', structure: ['Cell Membrane'], other_names:['Cell Membrane', 'plasma membrane'] },
  purple: { code: [102, 0, 204], color: 'purple', structure: ['ACE2'], other_names:['ACE2'] },
  magenta: { code: [255, 0, 255], color: 'magenta', structure: ['ACE2'], other_names:['ACE2'] },
  red: { code: [255, 0, 0], color: 'red', structure: ['Envelope protein'], other_names:['Envelope protein', 'e protein'] },
  green: { code: [60, 179, 113], color: 'green', structure: ['Spike Protein'], other_names:['Spike Protein', 's protein', 'spike', 'spikes'] },
  orange: { code: [255, 128, 0], color: 'orange', structure: ['RNA', 'TMPRSS2'], other_names:[] },
  yellow: { code: [255, 255, 0],color: 'yellow',  structure: ['Membrane Protein'], other_names:['Membrane Protein','membrane'] },
  aqua: { code: [255,215,0], color: 'aqua', structure: ['Furin'], other_names:['Furin'] },
  teal: { code: [10, 160, 140], color: 'teal', structure: ['Spike Protein'], other_names:['Spike Protein', 's protein', 'spike', 'spikes'] },
  'light gray': { code: [200, 200, 200], color: 'light gray', structure: ['Sugars'], other_names:['Sugars'] },
  white: { code: [250, 250, 250], color: 'white', structure: ['Virus Membrane'], other_names:['Virus Membrane']},
  'dark gray': { code: [200, 200, 200], color: 'dark gray', structure: ['Nucleocapsid Protein'], other_names:['Nucleocapsid Protein', 'n protein'] },
  unknown: { code: [200, 200, 200], color: 'white', structure: ['Spike Protein'], other_names:['Spike Protein', 's protein', 'spike', 'spikes'] },
};

export const structureDictionary = {
  'CELL MEMBRANE': {code:[250, 250, 210]},
  'ACE2': {code:[138, 43, 226]},
  'ENVELOPE PROTEIN': {code:[255, 0, 0]},
  'SPIKE PROTEIN': {code:[60, 175, 113]},
  'RNA': {code:[255, 140, 0]},
  'TMPRSS2': {code:[255, 140, 0]},
  'MEMBRANE PROTEIN': {code:[255, 255, 0]},
  'FURIN': {code:[255, 255, 0]},
  'SUGARS': {code:[119, 136, 153]},
  'VIRUS MEMBRANE': {code:[250, 250, 210]},
  'NUCLEOCAPSID PROTEIN': {code:[119, 136, 153]},
}

export const getColorIndicesForCoord = (x, y, width) => {
  const red = y * (width * 4) + (x * 4);
  return [red, red + 1, red + 2, red + 3];
};

export const currentImageData = {};

const canvas = document.getElementById('canvas');

function check(pull) {
  if (pull < 10) {
    return `000${pull}`;
  }else if (pull < 100) {
    return `00${pull}`;
  }else if (pull < 1000) {
    return `0${pull}`;
  }
  return pull;
}

export function clearCanvas() {
  const cxt = canvas.getContext('2d');
  cxt.clearRect(0, 0, canvas.width, canvas.height);
  d3.select('#video-wrap').select('.tooltip').style('opacity', 0).style('position', '-300px')
}
export async function loadPngForFrame() {
  const video = document.getElementById('video');
  //const pullFrame = (Math.floor((video.currentTime) * 30.25));
  const pullFrame = (Math.floor((video.currentTime) * 30));

  const pathImg = '../static/assets/stills/120120_entry_flat/entry_flat';
  // The path to the image that we want to add
  const imgPath = `${pathImg + (check(pullFrame))}.png`;
  // Create a new Image object.
  const imgObj = new Image();
  // Set the src of this Image object.
  imgObj.src = imgPath;


  imgObj.onload = function () {
    let dimension = getRightDimension();

    canvas.width = dimension.width;
    canvas.height = dimension.height;
    imgObj.width =  dimension.width;
    imgObj.height = dimension.height;
   
    const cxt = canvas.getContext('2d');
    cxt.drawImage(imgObj, 0, 0, canvas.width, canvas.height);

    const _data = cxt.getImageData(0, 0, canvas.width, canvas.height);

    currentImageData.data = _data.data.map((m, i) => {
      if ((i + 1) % 4 === 0) m = 0;
      return m;
    });
    currentImageData.width = _data.width;
    currentImageData.height = _data.height;

    cxt.putImageData(new ImageData(new Uint8ClampedArray(currentImageData.data), canvas.width, canvas.height), 0, 0);
  };
}

export function toggleQueue(offVideo){
  if(offVideo){
    let hoverQ = d3.select('#interaction').selectAll('div.hover-queue').data(['Hover over video to interact']).join('div').classed('hover-queue', true);
    hoverQ.selectAll('text').data(d=> [d]).join('text').text(d=> d);
  }else{
    d3.select('#interaction').selectAll('div.hover-queue').remove();
  }
  
}

export async function drawFrameOnPause(video) {

  if (video.currentTime < endDrawTime) {
    const imgObj = loadPngForFrame();
    toggleQueue(true);
    
  } else {
    console.log('credits are playing');
  }
}

export function colorChecker(code){

    if((code[0] + code[1] + code[2]) === 0){
      return 'black';
    }else if(code[0] < code[1] && code[1] > 196 && code[2] < code[1]){
      return 'green';
    }else if(code[0] > 250 && code[1] > 200 && code[2] < 100){
        return 'yellow';
    }else if(code[0] > 250 && code[1] > 250 && code[2] > 250){
      return 'white';
    }else if((code[0] < 160 && code[0] > 50 && (Math.abs(code[0] - code[1]) < 5) ) && code[1] < 160 && code[2] < 160){
      return 'dark gray';
    }else if(code[0] < 250 && code[0] > 185 && code[1] < 250 && code[1] > 185 && code[2] < 250 &&  code[2] > 185){
      return 'light gray';
    }else if(code[2] < 70 && code[0] > 200 && code[2] < code[0] && code[1] < code[0] && code[1] < 80){
        return 'red';
    }else if(code[0] > 250 && code[1] < 10 && code[2] > 250){
      return 'magenta';
    }else if(code[2] < 70 && code[0] > 50 && code[2] < code[0] && code[1] < code[0] && code[1] > 80){
      return 'orange';
    }else if(code[0] < 10 && code[1] > 250 && code[2] > 250){
      return 'aqua';
    }else if(code[2] > 70 && code[0] < 100 && code[2] > code[0] && code[2] > code[1]){
      return 'blue';
    }else{
      return "unknown";
    }
      
    
  
  }

export function parseArray(hoverColor) {

  
  const newData = { ...currentImageData };
  newData.data = Uint8ClampedArray.from([...currentImageData.data]);

  for (let i = 0; i < newData.data.length; i += 4) {
    const end = i + 4;
    const snip = newData.data.slice(i, end);
    const color = colorChecker(snip);

    if (color != hoverColor) {
      newData.data[i] = 255;
      newData.data[i + 1] = 255;
      newData.data[i + 2] = 255;
      newData.data[i + 3] = 150;
    } else if (color === hoverColor) {
      if (!colorDictionary[color].code) {
        console.log('not found', color, colorDictionary);
      }
      newData.data[i] = colorDictionary[color].code[0];
      newData.data[i + 1] = colorDictionary[color].code[1];
      newData.data[i + 2] = colorDictionary[color].code[2];
      newData.data[i + 3] = 0;
    }
  }
  const cxt = canvas.getContext('2d');
  const myimg = new ImageData(newData.data, currentImageData.width, currentImageData.height);
  cxt.putImageData(myimg, 0, 0);
}

export function makeNewImageData() {
  const cxt = canvas.getContext('2d');
  const myimg = new ImageData(currentImageData.data, currentImageData.width, currentImageData.height);
  cxt.putImageData(myimg, 0, 0);
}

export function getCoordColor(coord) {
  const colorIndices = getColorIndicesForCoord(Math.round(coord[0]), (coord[1]), currentImageData.width);
  const [redIndex, greenIndex, blueIndex, alphaIndex] = colorIndices;

  const redForCoord = currentImageData.data[redIndex];
  const greenForCoord = currentImageData.data[greenIndex];
  const blueForCoord = currentImageData.data[blueIndex];
  const alphaForCoord = currentImageData.data[alphaIndex];
  const new_rgb = `rgba(${redForCoord},${greenForCoord},${blueForCoord}, 1.0)`;

  const snip = colorChecker([redForCoord, greenForCoord, blueForCoord, alphaForCoord]);

  return snip;
}
