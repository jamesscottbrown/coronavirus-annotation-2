
export function renderLoader(div){
    let sliderDiv = div.append('div').classed('slider', true);
    sliderDiv.append('div').classed('line', true);
    sliderDiv.append('div').classed('subline inc', true);
    sliderDiv.append('div').classed('subline dec', true);
}