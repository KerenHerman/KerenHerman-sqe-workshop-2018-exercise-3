import $ from 'jquery';
import {parseCode, createGraph, newDot, pathColoring} from './code-analyzer';
import Viz from 'viz.js';
import {Module, render} from 'viz.js/full.render.js';

$(document).ready(function () {
    $('#codeSubmissionButton').click(() => {
        let codeToParse = $('#codePlaceholder').val();
        let valforParams =  $('#valPlaceholder').val();
        let vals = valsToMap(valforParams);
        let parsedCode = parseCode(codeToParse);
        let cfg = createGraph(parsedCode);
        pathColoring(cfg,parsedCode, vals);
        makeDot(cfg, codeToParse);
    });
});

function makeDot(cfg, codeToParse) {
    let newCfg = [];
    newCfg[0] = cfg[0];
    newCfg[1] = cfg[cfg.length - 1];
    newCfg[2] = cfg;
    let dot = newDot(newCfg, codeToParse);
    var sample = 'digraph{' + dot + '}';
    var svg = new Viz({Module, render});
    var graph = document.getElementById('parsedCode');
    svg.renderSVGElement(sample).then(function (element) {
        graph.innerHTML = '';
        graph.append(element);
    });
}

//val of colors = (1|2|[1,2],...)
//params = {x:"1" y:"2" z:"[1,2]"}
function valsToMap(valforColors) {
    let ans = {};
    if  ((valforColors == '()') || (valforColors === '()')) {
        return ans;
    }
    else{
        let valsAsArray = (valforColors.substring(1, valforColors.length - 1)).split('|');
        for (let i = 0; i < valsAsArray.length; i++) {
            let pair = valsAsArray[i].split('=');

            ans[pair[0]] = pair[1];
        }
        return ans;
    }
}
