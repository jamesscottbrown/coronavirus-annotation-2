import * as d3 from 'd3';
require("regenerator-runtime/runtime");

export function renderIssueButton(wrap){
    let bugLink = wrap.append('a');
    bugLink.attr('href', 'https://github.com/jrogerthat/coronavirus_flask/issues');
    bugLink.attr('target', "_blank");
    bugLink.append('span').classed("fas fa-bug", true);
}

export function renderUser(userData){
    let displayName = userData.displayName != null ? userData.displayName : userData.isAnonymous == false ? userData.email : "Guest";
    let div = d3.select('#top-bar').select('#user');
    div.selectAll('text.user_name').data([displayName]).join('text').classed('user_name', true).text(displayName);
    renderIssueButton(div);
}