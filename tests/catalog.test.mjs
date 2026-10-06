import test from "node:test";
import assert from "node:assert/strict";
import { lessons } from "../lib/lessons.mjs";
import { filterLessons } from "../lib/catalog.mjs";

test("method search combines case-insensitive text and group filtering in both languages",()=>{
  assert.equal(filterLessons(lessons.python).length,25);
  assert.deepEqual(filterLessons(lessons.python," .POP() ").map(l=>l.id),["pop"]);
  assert.deepEqual(filterLessons(lessons.python,"sort","List methods").map(l=>l.id),["sort"]);
  assert.deepEqual(filterLessons(lessons.python,"reverse","Dictionary methods"),[]);
  assert.deepEqual(filterLessons(lessons.javascript,"Object.keys()").map(l=>l.id),["keys"]);
  assert.equal(filterLessons(lessons.python,"","Built-ins").length,8);
  assert.equal(filterLessons(lessons.python,"","List methods").length,7);
  assert.equal(filterLessons(lessons.python,"","String methods").length,6);
  assert.equal(filterLessons(lessons.python,"","Dictionary methods").length,4);
  assert.deepEqual(filterLessons(lessons.python,"zzzzzz"),[]);
});
