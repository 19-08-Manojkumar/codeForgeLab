import test from "node:test";
import assert from "node:assert/strict";
import vm from "node:vm";
import { curricula, getPracticeEntries } from "../lib/curriculum.mjs";
import { languages, practicePaths, filterPracticeEntries, normalizeExpression, checkGuidedExpression, normalizeOutput } from "../lib/practice.mjs";
import { format } from "../lib/engine.mjs";

test("all four language paths have complete, linked curriculum content",()=>{
  assert.deepEqual(Object.keys(languages),["javascript","python","java","c"]);
  assert.equal(practicePaths.length,4);
  for(const [language,curriculum] of Object.entries(curricula)) {
    assert.equal(curriculum.topics.length,8,language);
    assert.equal(curriculum.interviews.length,16,language);
    assert.ok(curriculum.problems.length>=6,language);
    const topics=new Set(curriculum.topics.map(entry=>entry.id));assert.equal(topics.size,8);
    for(const entry of curriculum.topics) {assert.ok(entry.summary);assert.ok(entry.example);assert.ok(entry.steps.length>=2);assert.ok(String(entry.output).length);assert.match(entry.source,/^https:\/\//u);}
    for(const entry of curriculum.interviews) {assert.ok(topics.has(entry.topicId));assert.ok(entry.question&&entry.answer);assert.ok(entry.keyPoints.length>=2);}
    for(const entry of curriculum.problems) {
      assert.ok(topics.has(entry.topicId));assert.equal(entry.starter.split("___").length,2,entry.id);assert.ok(!entry.starter.includes("____"));assert.ok(!entry.solution.includes("___"));assert.ok(entry.hint&&entry.explanation);assert.ok(entry.cases.length>=3);
      for(const answer of entry.answers)assert.equal(checkGuidedExpression(entry,answer).correct,true,entry.id);
      assert.equal(checkGuidedExpression(entry,"arbitrary_unrecognized_expression").correct,false);assert.equal(checkGuidedExpression(entry,"").correct,false);
    }
    if(["java","c"].includes(language)){assert.equal(curriculum.references.length,25);for(const entry of curriculum.references){assert.ok(entry.example&&entry.output&&entry.syntax&&entry.returns&&entry.mutation);assert.ok(entry.steps.length>=2);}}
    for(const path of ["basics","interviews","problems"]) {const entries=getPracticeEntries(language,path);assert.equal(new Set(entries.map(entry=>entry.id)).size,entries.length);assert.ok(entries.every(entry=>entry.title&&entry.group));}
  }
});
test("JavaScript teaching examples print the documented output",()=>{
  for(const topic of curricula.javascript.topics){const lines=[];vm.runInNewContext(topic.example,{console:{log:(...values)=>lines.push(values.map(value=>String(value)).join(" "))}},{timeout:100});assert.equal(normalizeOutput(lines.join("\n")),normalizeOutput(topic.output),topic.id);}
});
test("every accepted JavaScript problem expression produces the documented cases",()=>{
  for(const problem of curricula.javascript.problems)for(const answer of problem.answers)for(const example of problem.cases){const actual=vm.runInNewContext(`${problem.starter.replace("___",answer)}\n${example.input}`,{}, {timeout:100});assert.equal(format(actual),example.output,`${problem.id}: ${answer}`);}
});
test("guided expression checks preserve literal spaces and tolerate outer formatting",()=>{
  assert.equal(normalizeExpression(" ( a + b ) ; "),"a+b");
  assert.notEqual(normalizeExpression('"a b"'),normalizeExpression('"ab"'));
  assert.notEqual(normalizeExpression("f(a)+g(b)"),normalizeExpression("(f(a)+g)(b)"));
  const problem=curricula.javascript.problems[0];assert.equal(checkGuidedExpression(problem," ( n * 2 ) ; ").correct,true);
  assert.equal(checkGuidedExpression(problem,"n*2;alert(1)").correct,false);
  assert.equal(normalizeOutput("3\r\n4\r\n"),"3\n4");
});
test("practice search and group filters work for references, questions, and exercises",()=>{
  const entries=getPracticeEntries("java","methods");assert.equal(entries.length,25);assert.ok(filterPracticeEntries(entries,"LENGTH").length>0);
  assert.deepEqual(filterPracticeEntries(entries,"zzzzzz"),[]);
  const interviews=getPracticeEntries("c","interviews"),group=interviews[0].group;assert.equal(filterPracticeEntries(interviews,"",group).length,2);
  const problems=getPracticeEntries("python","problems");assert.deepEqual(filterPracticeEntries(problems,"age").map(entry=>entry.id),["py-adult-check"]);
});
test("C string-loop examples use a single-character null escape",()=>{
  const problem=curricula.c.problems.find(entry=>entry.id==="count-string");
  assert.ok(problem.solution.includes("'\\0'"));assert.ok(!problem.solution.includes("'\\\\0'"));
});
