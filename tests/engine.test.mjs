import test from "node:test";
import assert from "node:assert/strict";
import { lessons, defaultConfig } from "../lib/lessons.mjs";
import { buildTrace, format } from "../lib/engine.mjs";
const trace = (language,id,config={}) => {const lesson=lessons[language].find(l=>l.id===id);return buildTrace(lesson,{...defaultConfig(lesson),...config});};

test("all 25 JavaScript and 8 Python lessons produce complete traces and usable quizzes",()=>{
  assert.equal(lessons.javascript.length,25);
  assert.equal(lessons.python.length,8);
  assert.equal(new Set(lessons.javascript.map(l=>l.id)).size,25);
  assert.equal(Object.values(lessons).flat().length,33);
  for(const lesson of Object.values(lessons).flat()){
    const t=buildTrace(lesson,defaultConfig(lesson));
    assert.deepEqual(t.frames.at(-1).output,t.result);
    assert.ok(t.frames.length>=2);
    for(const q of lesson.quiz){assert.equal(q.choices.length,4);assert.ok(q.answer>=0&&q.answer<4);assert.ok(q.explanation.length>20);}
  }
});
test("forEach visits every item, records effects, and returns undefined",()=>{
  const t=trace("javascript","forEach",{input:"[2,4,6]",operation:"multiply",parameter:"3"});
  const expected=[]; const returned=[2,4,6].forEach(n=>expected.push(n*3));
  assert.equal(t.result,returned);assert.equal(t.result,undefined);
  assert.deepEqual(t.sideEffects,expected);assert.deepEqual(t.input,[2,4,6]);assert.equal(t.mutated,null);
  assert.deepEqual(t.frames.map(f=>f.sideEffects),[[],[6],[6,12],[6,12,18]]);
  assert.ok(t.frames.every(f=>f.output===undefined));
  const empty=trace("javascript","forEach",{input:"[]"});assert.equal(empty.result,undefined);assert.deepEqual(empty.sideEffects,[]);
  assert.deepEqual(trace("javascript","forEach",{input:'["a", "ß"]',operation:"uppercase"}).sideEffects,["A","SS"]);
});
test("Object methods match native own-property order, value types, and entry pairs",()=>{
  const object={"10":"ten","2":"two",name:"Ada",active:true,score:null,nested:{ok:1}};
  const input=JSON.stringify(object);
  for(const id of ["keys","values","entries"]){
    const t=trace("javascript",id,{input});
    assert.deepEqual(t.result,Object[id](object));assert.deepEqual(t.input,object);assert.equal(t.mutated,null);
    assert.deepEqual(trace("javascript",id,{input:"{}"}).result,[]);
    const ownProto=JSON.parse('{"__proto__":"own","constructor":"own too"}');
    assert.deepEqual(trace("javascript",id,{input:JSON.stringify(ownProto)}).result,Object[id](ownProto));
  }
  assert.deepEqual(trace("javascript","keys",{input}).result.slice(0,2),["2","10"]);
});
test("slice matches native negative bounds, omitted end, clamping, and reversed intervals",()=>{
  const source=["a","b","c","d","e"];
  for(const [start,end] of [[0,3],[-3,-1],[-100,100],[4,1],[2,undefined],[9,undefined],[-2,undefined],[0,0]]){
    const t=trace("javascript","slice",{input:JSON.stringify(source),parameter:String(start),extra:end===undefined?"":String(end)});
    assert.deepEqual(t.result,source.slice(start,end));assert.deepEqual(t.input,source);assert.equal(t.mutated,null);
  }
  assert.deepEqual(trace("javascript","slice",{input:"[]",parameter:"-2",extra:""}).result,[]);
});
test("splice returns removed items separately from its mutated original",()=>{
  const source=["a","b","c","d"];
  const cases=[[1,2,["new"]],[1,0,["x","y"]],[-2,1,[]],[-100,2,[]],[99,3,["end"]],[1,-2,["x"]],[2,undefined,[]],[0,99,[]]];
  for(const [start,count,additions] of cases){
    const expected=[...source]; const removed=count===undefined?expected.splice(start):expected.splice(start,count,...additions);
    const t=trace("javascript","splice",{input:JSON.stringify(source),parameter:String(start),extra:count===undefined?"":String(count),additions:JSON.stringify(additions)});
    assert.deepEqual(t.result,removed);assert.deepEqual(t.mutated,expected);assert.deepEqual(t.input,source);
    assert.deepEqual(t.frames.at(-1).working,expected);assert.equal(t.normalizedIndices.deleteCount,removed.length);
  }
  const t=trace("javascript","splice",{input:"[]",parameter:"0",extra:"0",additions:'[1,"two",null]'});
  assert.deepEqual(t.result,[]);assert.deepEqual(t.mutated,[1,"two",null]);
  const rest=trace("javascript","splice",{input:'["a","b","c"]',parameter:"1",extra:"",additions:'["new"]'});
  assert.deepEqual(rest.result,["b","c"]);assert.deepEqual(rest.mutated,["a","new"]);
  assert.match(rest.code,/splice\(1, 2, "new"\)/);
});
test("push, unshift, pop, and shift preserve native return values and mutations",()=>{
  for(const id of ["push","unshift","pop","shift"]){
    for(const source of [[],[1],[1,2,3]]){
      const expected=[...source], adds=["push","unshift"].includes(id);
      const returned=adds?expected[id]("new"):expected[id]();
      const t=trace("javascript",id,{input:JSON.stringify(source),parameter:'"new"'});
      assert.deepEqual(t.result,returned);assert.deepEqual(t.mutated,expected);assert.deepEqual(t.input,source);
    }
  }
  assert.equal(trace("javascript","push",{input:"[1,2]",parameter:"null"}).result,3);
  assert.deepEqual(trace("javascript","unshift",{input:"[1]",parameter:"false"}).mutated,[false,1]);
});
test("findIndex returns the first index, short-circuits, and uses -1 for no match",()=>{
  const source=[1,3,4,6], t=trace("javascript","findIndex",{input:JSON.stringify(source),operation:"even"});
  assert.equal(t.result,source.findIndex(n=>n%2===0));assert.equal(t.frames.length,4);
  assert.equal(trace("javascript","findIndex",{input:"[2,4]",operation:"even"}).result,0);
  assert.equal(trace("javascript","findIndex",{input:"[1,3]",operation:"even"}).result,-1);
  assert.equal(trace("javascript","findIndex",{input:"[]"}).result,-1);
});
test("JavaScript split preserves empty pieces, supports empty separators and optional limit",()=>{
  for(const [input,separator,limit] of [["a,,b,",",",undefined],["",",",undefined],["","",undefined],["A😀B","",undefined],["a b"," ",1],["a b"," ",0],["abc",",",undefined]]){
    const t=trace("javascript","split",{input,parameter:separator,extra:limit===undefined?"":String(limit)});
    assert.deepEqual(t.result,input.split(separator,limit));assert.equal(t.input,input);assert.equal(t.mutated,null);
  }
  assert.deepEqual(trace("javascript","split",{input:" a  b ",parameter:" ",extra:""}).result,["","a","","b",""]);
  assert.deepEqual(trace("python","split",{input:" a  b ",operation:"whitespace"}).result,["a","b"]);
});
test("replace handles only the first literal match and native replacement patterns",()=>{
  const cases=[["red red","red","blue"],["hello","missing","x"],["abc","","start-"],["a.b.a",".","!"],["hello","ell","[$&]"],["abc","b","$$:$`:$'"],["","","x"]];
  for(const [input,search,replacement] of cases){
    const t=trace("javascript","replace",{input,parameter:search,extra:replacement});
    assert.equal(t.result,input.replace(search,replacement));assert.equal(t.input,input);assert.equal(t.mutated,null);
  }
});
test("trim and case conversion retain Unicode and context-sensitive native behavior",()=>{
  for(const input of ["  Hello  World \t","\u00a0\ufeffhello\u2003","","straße","ΟΣ","İstanbul","😀 hey"]){
    for(const id of ["trim","toLowerCase","toUpperCase"]){
      const t=trace("javascript",id,{input});assert.equal(t.result,input[id]());assert.equal(t.input,input);assert.equal(t.mutated,null);
    }
  }
  assert.equal(trace("javascript","toLowerCase",{input:"ΟΣ"}).result,"ος");
  assert.equal(trace("javascript","toUpperCase",{input:"ß"}).result,"SS");
});
test("substring clamps negative indices, swaps reversed bounds, and counts UTF-16 units",()=>{
  for(const input of ["MethodLab","A😀B",""]){
    for(const [start,end] of [[1,4],[4,1],[-3,3],[3,-3],[100,200],[1,undefined],[1,2],[0,0]]){
      const t=trace("javascript","substring",{input,parameter:String(start),extra:end===undefined?"":String(end)});
      assert.equal(t.result,input.substring(start,end));assert.equal(t.input,input);
    }
  }
});
test("new fields reject invalid types, unsafe-sized examples, and malformed insertion lists",()=>{
  assert.throws(()=>trace("javascript","keys",{input:"[]"}),/curly braces/);
  assert.throws(()=>trace("javascript","values",{input:'{"x":1e999}'}),/numbers between/);
  assert.throws(()=>trace("javascript","slice",{parameter:"1.5"}),/integer/);
  assert.throws(()=>trace("javascript","substring",{extra:"Infinity"}),/integer/);
  assert.throws(()=>trace("javascript","splice",{additions:'{"x":1}'}),/square brackets/);
  assert.throws(()=>trace("javascript","splice",{additions:'[[1]]'}),/supports numbers/);
  assert.throws(()=>trace("javascript","push",{parameter:'  {"x":1}'}),/quoted string/);
  assert.throws(()=>trace("javascript","push",{parameter:"1e999"}),/numbers between/);
  assert.throws(()=>trace("javascript","trim",{input:"a".repeat(101)}),/up to 100/);
  assert.throws(()=>trace("javascript","replace",{parameter:"a".repeat(501)}),/parameter fields/);
  assert.throws(()=>trace("javascript","split",{extra:"-1"}),/Limit must/);
  assert.throws(()=>trace("javascript","split",{input:"abcdefghijklmn",parameter:"",extra:""}),/at most 12 pieces/);
  assert.throws(()=>trace("javascript","splice",{additions:3}),/parameter fields/);
});
test("map transforms one item to one output and filter drops failed items",()=>{
  const m=trace("javascript","map",{input:"[2, 4, 6]",parameter:"3"});assert.deepEqual(m.result,[6,12,18]);assert.deepEqual(m.input,[2,4,6]);assert.deepEqual(m.frames[1].output,[6]);
  const f=trace("javascript","filter",{input:"[1, 2, 3, 4]",operation:"even"});assert.deepEqual(f.result,[2,4]);assert.deepEqual(f.frames[1].output,[]);assert.deepEqual(f.frames[2].output,[2]);
});
test("includes respects primitive types and short-circuits",()=>{
  assert.equal(trace("javascript","includes",{input:"[1,2,3]",parameter:'"2"'}).result,false);
  const found=trace("javascript","includes",{input:"[1,2,3]",parameter:"2"});assert.equal(found.result,true);assert.equal(found.frames.length,3);
  assert.equal(trace("javascript","includes",{input:"[null]",parameter:"null"}).result,true);
  for(const from of [-10,-2,1,3,10]){
    const source=[1,2,3];
    assert.equal(trace("javascript","includes",{input:JSON.stringify(source),parameter:"1",extra:String(from)}).result,source.includes(1,from));
  }
});
test("find, some, and every stop at the decisive element",()=>{
  const f=trace("javascript","find",{input:"[3,7,9]",parameter:"5"});assert.equal(f.result,7);assert.equal(f.frames.length,3);
  assert.equal(trace("javascript","find",{input:"[1,2]",parameter:"5"}).result,undefined);
  const s=trace("javascript","some",{input:"[1,3,4,6]",operation:"even"});assert.equal(s.result,true);assert.equal(s.frames.length,4);
  const e=trace("javascript","every",{input:"[2,4,7,8]",operation:"even"});assert.equal(e.result,false);assert.equal(e.frames.length,4);
});
test("empty arrays preserve correct edge behavior",()=>{
  assert.deepEqual(trace("javascript","map",{input:"[]"}).result,[]);
  assert.deepEqual(trace("javascript","filter",{input:"[]"}).result,[]);
  assert.equal(trace("javascript","every",{input:"[]"}).result,true);
  assert.equal(trace("javascript","some",{input:"[]"}).result,false);
  assert.equal(trace("javascript","includes",{input:"[]"}).result,false);
  assert.equal(trace("javascript","reduce",{input:"[]",parameter:"10"}).result,10);
  assert.equal(trace("python","sum",{input:"[]",parameter:"0"}).result,0);
  assert.equal(trace("python","join",{input:"[]"}).result,"");
});
test("reduce and sum carry the explicit accumulator",()=>{
  const r=trace("javascript","reduce",{input:"[2,3,4]",parameter:"10"});assert.equal(r.result,19);assert.equal(r.frames[1].output,12);assert.equal(r.frames[2].output,15);
  assert.equal(trace("javascript","reduce",{input:"[2,3,4]",operation:"product",parameter:"1"}).result,24);
  assert.equal(trace("python","sum",{input:"[2,3,4]",parameter:"10"}).result,19);
  assert.equal(trace("python","sum",{input:"[0.1,0.2,0.3]",parameter:"0"}).result,0.6);
});
test("JavaScript sort has lexical default and Python sorted is numerical for numbers",()=>{
  const js=trace("javascript","sort",{input:"[10,2,1]",operation:"lexical"});assert.deepEqual(js.result,[1,10,2]);assert.deepEqual(js.mutated,[1,10,2]);
  assert.equal(js.result,js.mutated);
  assert.deepEqual(trace("javascript","sort",{input:"[10,2,1]",operation:"ascending"}).result,[1,2,10]);
  const py=trace("python","sorted",{input:"[10,2,1]"});assert.deepEqual(py.result,[1,2,10]);assert.deepEqual(py.input,[10,2,1]);assert.equal(py.mutated,null);
  assert.deepEqual(trace("python","sorted",{input:'["z", "A", "a"]',operation:"text"}).result,["A","a","z"]);
});
test("Python len counts Unicode codepoints and dictionary keys",()=>{
  assert.equal(trace("python","len",{input:"a😀b",operation:"text"}).result,3);
  assert.equal(trace("python","len",{input:'{"a":1,"b":2}',operation:"dict"}).result,2);
});
test("Python append mutates its list and returns None",()=>{
  const a=trace("python","append",{input:"[1,2]",parameter:"3"});assert.deepEqual(a.mutated,[1,2,3]);assert.equal(a.result,null);assert.equal(format(a.result,"python"),"None");
});
test("Python split distinguishes explicit separators from whitespace",()=>{
  assert.deepEqual(trace("python","split",{input:" a  b\t ",operation:"whitespace"}).result,["a","b"]);
  assert.deepEqual(trace("python","split",{input:"a,,b",operation:"separator",parameter:","}).result,["a","","b"]);
  assert.deepEqual(trace("python","split",{input:"",operation:"whitespace"}).result,[]);
  assert.deepEqual(trace("python","split",{input:"",operation:"separator",parameter:","}).result,[""]);
  assert.deepEqual(trace("python","split",{input:"a\u001cb\ufeff",operation:"whitespace"}).result,["a","b\ufeff"]);
});
test("range handles positive and negative steps, exclusive stops and empty ranges",()=>{
  assert.deepEqual(trace("python","range",{input:"6",parameter:"1",extra:"2"}).result,[1,3,5]);
  assert.deepEqual(trace("python","range",{input:"0",parameter:"5",extra:"-2"}).result,[5,3,1]);
  assert.deepEqual(trace("python","range",{input:"5",parameter:"0",extra:"-1"}).result,[]);
  assert.throws(()=>trace("python","range",{extra:"0"}),/cannot be 0/);
});
test("dict get uses fallback only for a missing key, including own __proto__ keys",()=>{
  assert.equal(trace("python","get",{input:'{"age":null}',parameter:"age",extra:"18"}).result,null);
  assert.equal(trace("python","get",{input:'{"name":"Ada"}',parameter:"age",extra:"0"}).result,0);
  assert.equal(trace("python","get",{input:'{"name":"Ada"}',parameter:"toString",extra:'"missing"'}).result,"missing");
  assert.equal(trace("python","get",{input:'{"__proto__": "value"}',parameter:"__proto__"}).result,"value");
});
test("invalid examples fail intentionally rather than executing arbitrary code",()=>{
  assert.throws(()=>trace("javascript","map",{input:"alert(1)"}),/valid JSON array/);
  assert.throws(()=>trace("javascript","map",{input:'["hello"]'}),/only numbers/);
  assert.throws(()=>trace("python","join",{input:"[1,2]"}),/only strings/);
  assert.throws(()=>trace("javascript","map",{operation:"eval"}),/available operations/);
  assert.throws(()=>trace("python","range",{input:"100"}),/at most 12/);
  assert.throws(()=>trace("python","split",{operation:"separator",parameter:""}),/cannot be empty/);
  assert.throws(()=>trace("python","get",{input:"[]"}),/curly braces/);
});
