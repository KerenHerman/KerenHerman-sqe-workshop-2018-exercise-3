import assert from 'assert';
import {parseCode, createGraph, newDot, pathColoring} from '../src/js/code-analyzer';

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
describe('The javascript parser', () => {
    //BUILD GRAPH
    emptyFunc();
    emptyFuncMergeStmt();
    emptyFuncWithIf();
    emptyFuncWithWhile();
    //COLOR
    colorEmptyFunc();
    colorFuncWithIf();
    colorFuncWithWhile();
    colorArray();
    //DOT
    dotEmptyFunc();
    dotFuncWithIf();
    //Basics
    logicExp();
    assignmentExp();
    logiExp();
});

function emptyFunc(){
    it('is parsing an empty function', () => {
        let code = 'function foo(){return 1;}';
        let cfg = createGraph(parseCode(code));
        assert.equal(cfg.length, 1);
        assert.equal(cfg[0].astNode.type, 'ReturnStatement');
        assert.equal(cfg[0].label, 'return 1;');
    });
}

function emptyFuncMergeStmt() {
    it('is parsing an empty function with merge stmt', () => {
        let code =
            'function foo(){\n' +
            '   let x = 0;\n' +
            '   let y = 0;\n' +
            '   return 1;\n' +
            '}';
        let cfg = createGraph(parseCode(code));
        assert.equal(cfg.length, 2);
        assert.equal(cfg[0].label, 'let x = 0;\nlet y = 0;');
        assert.equal(cfg[1].label, 'return 1;');
    });
}
function emptyFuncWithIf(){
    it('is parsing an empty function with if', () => {
        let code =
            'function foo(){\n' + '   let ans = 0;\n' + '   let x = 1;\n' + '   if (x < 2){\n' + '       ans = 1;\n' +
            '   } else\n' + '       ans = 2;\n' + '   return ans;\n' + '}';
        let cfg = createGraph(parseCode(code));
        assert.equal(cfg.length, 5);
        assert.equal(cfg[0].label, 'let ans = 0;\nlet x = 1;');
        assert.equal(cfg[1].label, 'x < 2');
        assert.equal(cfg[2].label, 'ans = 1');
        assert.equal(cfg[4].label, 'ans = 2');
        assert.equal(cfg[3].label, 'return ans;');
        assert.equal(cfg[0].normal, cfg[1]);
        assert.equal(cfg[1].true, cfg[2]);
        assert.equal(cfg[1].false, cfg[4]);
    });
}

function emptyFuncWithWhile() {
    it('is parsing an empty function with while', () => {
        let code = 'function foo(){\n' + '   let x = 1;\n' + '   while (x > 1){\n' + '       x = 1;\n' +
            '   }\n' + '   return 1;\n' + '}';
        let cfg = createGraph(parseCode(code));
        assert.equal(cfg.length, 4);
        assert.equal(cfg[0].label, 'let x = 1;');
        assert.equal(cfg[1].label, 'x > 1');
        assert.equal(cfg[2].label, 'x = 1');
        assert.equal(cfg[3].label, 'return 1;');
        assert.equal(cfg[0].normal, cfg[1]);
        assert.equal(cfg[1].true, cfg[2]);
        assert.equal(cfg[1].false, cfg[3]);
    });
}

function colorEmptyFunc() {
    it('coloring path of empty function', () => {
        let code = 'function foo(){return 1;}';
        let params = {};
        let parsedCode = parseCode(code);
        let cfg = createGraph(parseCode(code));
        pathColoring(cfg, parsedCode, params);
        assert.equal(cfg.length, 1);
        assert.equal(cfg[0].color, true);
    });
}

function colorFuncWithIf() {
    it('coloring path of function with if', () => {
        let code = 'function foo(x, y, z){\n' + '    let a = x + 1;\n' + '    let b = a + y;\n' + '    let c = 0;\n' + '    \n' +
            '    if (b < z) {\n' + '        c = c + 5;\n' + '    } else if (b < z * 2) {\n' + '        c = c + x + 5;\n' +
            '    } else {\n' + '        c = c + z + 5;\n' + '    }\n' + '    \n' + '    return c;\n' + '}';
        let params = valsToMap('(x=1|y=2|z=3)');
        let parsedCode = parseCode(code);
        let cfg = createGraph(parseCode(code));
        pathColoring(cfg, parsedCode, params);
        assert.equal(cfg.length, 7);
        assert.equal(cfg[0].color, true);
        assert.equal(cfg[1].color, true);
        assert.equal(cfg[3].color, true);
        assert.equal(cfg[4].color, true);
        assert.equal(cfg[6].color, true);
    });
}

function colorFuncWithWhile() {
    it('coloring path of function with if', () => {
        let code = 'function foo(x, y){\n' +
            '    while (x < y) {\n' +
            '        x = x + 5;\n' +
            '    }\n' +
            '    return x;\n' +
            '}';
        let params = valsToMap('x=1|y=2');
        let parsedCode = parseCode(code);
        let cfg = createGraph(parseCode(code));
        pathColoring(cfg, parsedCode, params);
        assert.equal(cfg.length, 3);
        assert.equal(cfg[0].color, true);
        assert.equal(cfg[2].color, true);
    });
}

function dotEmptyFunc(){
    it('dot empty function', () => {
        let code = 'function foo(){return 1;}';
        let parsedCode = parseCode(code);
        let cfg = createGraph(parsedCode);
        let params = {};
        pathColoring(cfg, parsedCode, params);
        let newCfg = [];
        newCfg[0] = cfg[0];
        newCfg[1] = cfg[cfg.length - 1];
        newCfg[2] = cfg;
        let dot = newDot(newCfg, code);
        let ans =
            'n0 [label="return 1;" xlabel=1 ,style = filled fillcolor = darkolivegreen3 ,shape="box"]\n';
        assert.equal(dot, ans);
    });
}

function dotFuncWithIf() {
    it('dot empty function with if', () => {
        let code = 'function foo(){\n' + '   let ans = 1;\n' + '   if (ans > 2){\n' + '       ans = 1;\n' +
            '   } else\n' + '       ans = 2;\n' + '   return ans;\n' + '}';
        let parsedCode = parseCode(code);let cfg = createGraph(parsedCode);let params = {};pathColoring(cfg, parsedCode, params);
        let newCfg = [];newCfg[0] = cfg[0];newCfg[1] = cfg[cfg.length - 1];newCfg[2] = cfg;
        let dot = newDot(newCfg, code);
        let ans =
            'n0 [label="let ans = 1;" xlabel=1 ,style = filled fillcolor = darkolivegreen3 ,shape="box"]\n' +
            'n1 [label="ans > 2" xlabel=2 ,style = filled fillcolor = darkolivegreen3 ,shape="diamond"]\n' +
            'n2 [label="ans = 1" xlabel=3 ,shape="box"]\n' +
            'n3 [label="return ans;" xlabel=4 ,style = filled fillcolor = darkolivegreen3 ,shape="box"]\n' +
            'n4 [label="ans = 2" xlabel=5 ,style = filled fillcolor = darkolivegreen3 ,shape="box"]\n' +
            'n0 -> n1 []\n' + 'n1 -> n2 [label="true"]\n' + 'n1 -> n4 [label="false"]\n' + 'n2 -> n3 []\n' + 'n4 -> n3 []\n';
        assert.equal(dot, ans);
    });
}


function logicExp() {
    it('coloring path of function with if', () => {
        let code = 'function foo(x, y, z){\n' + '    let a = 1 & 1;\n' + '    let b = a + y;\n' + '    let c = 0;\n' + '    \n' +
            '    if (1 & 1 ) {\n' + '        c = c + 5;\n' + '    } else if (b < z * 2) {\n' + '        c = c + x + 5;\n' +
            '    } else {\n' + '        c = c + z + 5;\n' + '    }\n' + '    \n' + '    return c;\n' + '}';
        let params = valsToMap('x=1|y=2|z=3');
        let parsedCode = parseCode(code);
        let cfg = createGraph(parseCode(code));
        pathColoring(cfg, parsedCode, params);
        assert.equal(cfg.length, 7);

    });
}

function colorArray() {
    it('is correctly coloring a function with arrays and while', () => {
        let code =
            'function foo(x){\n' +
            //'   let a = [3,4];\n' +
            '   while (x[0] = 3){\n' +
            '       x[0] = x[0];\n' +
            '   }\n' +
            '   return x;\n' +
            '}';

        let params = valsToMap('(x=[1,2])');
        let parsedCode = parseCode(code);
        let cfg = createGraph(parsedCode);
        pathColoring(cfg, parsedCode, params);

        assert.equal(cfg.length, 3);
    });
}

function assignmentExp() {
    it('is correctly coloring a function with assignment and while', () => {
        let code =
            'function foo(x){\n' +
            '   while (x = 3){\n' +
            '       x = 2;\n' +
            '   }\n' +
            '   return x;\n' +
            '}';

        let params = valsToMap('(x=3)');
        let parsedCode = parseCode(code);
        let cfg = createGraph(parsedCode);
        pathColoring(cfg, parsedCode, params);

        assert.equal(cfg.length, 3);
    });
}


function logiExp() {
    it('is correctly coloring a function with assignment and while', () => {
        let code =
            'function foo(x){\n' +
            '   while (x && 3){\n' +
            '       x && 2;\n' +
            '   }\n' +
            '   return x;\n' +
            '}';

        let params = valsToMap('(x=3)');
        let parsedCode = parseCode(code);
        let cfg = createGraph(parsedCode);
        pathColoring(cfg, parsedCode, params);

        assert.equal(cfg.length, 3);
    });
}
