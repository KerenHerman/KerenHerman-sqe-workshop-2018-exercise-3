import * as esprima from 'esprima';
import * as escodegen from 'escodegen';

const parseCode = (codeToParse) => {
    return esprima.parse(codeToParse, { range: true });
};

export {parseCode};

//////////////////////////////////////////// CFG ////////////////////////////////////////////////////////////////////

function createGraph(parsedCode){
    const esgraph = require('esgraph');
    let cfg = esgraph(parsedCode.body[0].body)[2];
    removeExceptions(cfg);
    removeStartExit(cfg);
    mergeStmt(cfg);
    return cfg;
}

export {createGraph};

function removeExceptions(cfg){
    cfg.forEach(function (node) {
        delete node.exception;
    });
}

function removeStartExit(cfg){
    cfg.splice(0,1);
    cfg.splice(cfg.length-1, 1);
    for(let i=0; i<cfg.length; i++){
        if(cfg[i].next[0].type === 'exit')
            cfg[i].next.splice(0,1);
        if(cfg[i].normal != undefined){
            if(cfg[i].normal.type === 'exit')
                delete cfg[i].normal;
        }
    }
}

function mergeStmt(cfg) {
    cfg.forEach(function (node) {
        node.label = escodegen.generate(node.astNode);
    });
    for(let i=0; i<cfg.length; i++){
        if(cfg[i].normal && cfg[i].normal.normal) {
            let next = cfg[i].normal;
            cfg[i].next = next.next;
            cfg[i].normal = next.normal;
            cfg[i].label += '\n' + next.label;
            cfg.splice(i+1, 1);
            i--;
        }
    }
}

////////////////////////////////////// DOT ///////////////////////////////////////////////////////////////////

//rewriting dot.js
function newDot(cfg, options) {
    //options = options || {};
    const { counter = 0 } = options;
    const output = [];
    const nodes = cfg[2];
    printNodes(nodes, output, counter);
    printEdges(nodes, output, counter);
    //if (options.counter !== undefined) options.counter += nodes.length;
    return output.join('');
}

function printNodes(nodes, output, counter) {
    for (const [i, node] of nodes.entries()) {
        output.push(`n${counter + i} [label="${node.label}" xlabel=${i+1}`);
        if (node.color)
            output.push(' ,style = filled fillcolor = darkolivegreen3');
        let shape = 'box';
        if (node.true || node.false)
            shape = 'diamond';
        output.push(` ,shape="${shape}"`);
        output.push(']\n');
    }
}

function printEdges(nodes, output, counter) {
    for (const [i, node] of nodes.entries()) {
        for (const type of ['normal', 'true', 'false']) {
            const next = node[type];
            if (!next) continue;
            output.push(`n${counter + i} -> n${counter + nodes.indexOf(next)} [`);
            if (['true', 'false'].includes(type)) output.push(`label="${type}"`);
            output.push(']\n');
        }
    }
}
export {newDot};

//////////////////////////////////////////// COLOR ////////////////////////////////////////////////////////////////////

//params = {x:"1" y:"2" z:"[1,2]"}
function pathColoring (cfg, parsedCode, params) {
    let node = cfg[0];
    analyzeExp(parsedCode, params);
    while (node.astNode.type !== 'ReturnStatement'){
        node.color = true;
        if (node.normal){
            analyzeExp(parseCode(node.label), params);
            node = node.normal;
        }
        // else if (analyzeExp(parseCode(node.label).body[0], params)) node = node.true;
        else {
            analyzeExp(parseCode(node.label).body[0], params);
            node = node.false;
        }
    }
    node.color = true;
}

export {pathColoring};

function analyzeExp(exp, params) {
    switch (exp.type) {
    case 'Program': exp.body.forEach(function (x) {analyzeExp(x, params);});break;
    //case 'FunctionDeclaration':functionDeclarationCase(exp, params);break;
    //case 'BlockStatement': exp.body.forEach(function (x) {analyzeExp(x, params);});break;//return??
    //case 'VariableDeclaration':variableDeclarationCase(exp, params);break;//return??
    default: analyzeExpCon(exp, params); break;
    }
}

function analyzeExpCon(exp, params) {
    switch (exp.type) {
    case 'AssignmentExpression':assignmentExpressionCase(exp, params); break;
    case 'ExpressionStatement': return analyzeExp(exp.expression, params);
    case 'BinaryExpression':binaryExpressionCase(exp, params); break;
    case 'LogicalExpression': binaryExpressionCase(exp, params); break;//return??
    default: analyzeExpCon1(exp, params); break;
    }
}

function analyzeExpCon1(exp, params) {
    switch (exp.type) {
    case 'Literal': return exp.raw;
    case 'Identifier':  return params[exp.name];
    //case 'MemberExpression': memberExpressionCase(exp, params); break;//return?
    //case 'ArrayExpression':  return '[' + exp.elements.map(e => analyzeExp(e, params)).join(',') + ']';//return??
    }
}


function assignmentExpressionCase(exp, params) {
    let rightExp = analyzeExp(exp.right, params);
    let leftExp = exp.left;
    if (leftExp.type === 'Identifier')
        params[exp.left.name] = rightExp;
    //array
    else {
        let val = params[leftExp.object.name];
        let members = val.substring(1,val.length - 2).split(',');
        // val.slice(1, val.length - 1).split(',');
        members[leftExp.property.value] = rightExp;
        params[leftExp.object.name] = '[' + members.join(',') + ']';
    }
    return true;
}

/*
function functionDeclarationCase(exp, params) {
    exp.params.forEach(function (p, i) {
        params[p.name] = params[i];
        delete params[i];
    });
}*/
/*
function variableDeclarationCase(exp, params) {
    exp.declarations.forEach(function (x) {
        params[x.id.name] = analyzeExp(x.init, params);
    });
    return true;
}
*/
function binaryExpressionCase(exp, params) {
    let leftExp = analyzeExp(exp.left, params);
    let rightExp = analyzeExp(exp.right, params);
    return eval(leftExp + exp.operator + rightExp);
}
/*
function memberExpressionCase(exp, params) {
    let object = analyzeExp(exp.object, params);
    let property = analyzeExp(exp.property, params);
    return eval(object + '[' + property + ']');
}
*/