import { validateProfile } from "./learner.mjs";
import { getWebPracticeEntry } from "./web-practice.mjs";
import { mergeLearningSnapshot } from "./learning-snapshot.mjs";

const learnerLanguages = new Set(["javascript", "python", "java", "c"]);
const learnerPaths = new Set(["methods", "basics", "interviews", "problems"]);
const learningModes = new Set(["teach", "learn", "test", "practice"]);
const webLanguages = new Set(["html", "css"]);
const webModes = new Set(["teach", "learn", "practice"]);
export const webEditorLimit = 12000;
const boundedText = (value, max = 3000) => typeof value === "string" ? value.slice(0, max) : "";
export function localDay(date = new Date()) { return `${date.getFullYear()}-${String(date.getMonth()+1).padStart(2,"0")}-${String(date.getDate()).padStart(2,"0")}`; }
export function addDays(day, amount) { const date = new Date(`${day}T12:00:00Z`); date.setUTCDate(date.getUTCDate()+amount); return date.toISOString().slice(0,10); }
const validDay = day => typeof day === "string" && /^\d{4}-\d{2}-\d{2}$/.test(day) && !Number.isNaN(Date.parse(day+"T12:00:00Z")) && new Date(day+"T12:00:00Z").toISOString().slice(0,10) === day;
function location(value) {
  if (!value || !/^[\w-]{1,100}$/.test(value.entryId || "")) throw new TypeError("Choose an available learning topic.");
  const available = webLanguages.has(value.language)
    ? getWebPracticeEntry(value.language, value.path, value.entryId)
    : learnerLanguages.has(value.language) && learnerPaths.has(value.path);
  if (!available) throw new TypeError("Choose an available learning topic.");
  return { language:value.language, path:value.path, entryId:value.entryId, title:boundedText(value.title,180) };
}
function cleanConfig(config) { if (!config || typeof config !== "object") return null; return Object.fromEntries(["input","operation","parameter","extra","additions"].filter(key=>typeof config[key]==="string").map(key=>[key,config[key].slice(0,3000)])); }
function draftValue(item, value) {
  if (!webLanguages.has(item.language)) return boundedText(value,3000);
  let source;
  try { source = JSON.parse(value); } catch { throw new TypeError("Save HTML and CSS together as a browser exercise."); }
  if (!source || typeof source.html !== "string" || typeof source.css !== "string") throw new TypeError("Save HTML and CSS together as a browser exercise.");
  const draft={html:source.html.slice(0,webEditorLimit),css:source.css.slice(0,webEditorLimit)};
  if(item.path==="interviews"&&typeof source.answer==="string")draft.answer=boundedText(source.answer,3000);
  const explorerLesson=item.path==="render"&&item.entryId===(item.language==="html"?"tag-explorer":"style-explorer");
  if(explorerLesson&&typeof source.explorerId==="string"&&/^[\w-]{1,100}$/.test(source.explorerId))draft.explorerId=source.explorerId;
  return JSON.stringify(draft);
}
export const learningKey = value => `${value.language}:${value.path}:${value.entryId}`;
export function questionKey(answer) {
  const text = `${learningKey(answer)}:${answer.kind}:${answer.code}:${answer.expectedAnswer}`;
  let a=2166136261,b=5381; for (const c of text) { a=Math.imul(a^c.charCodeAt(0),16777619);b=Math.imul(b,33)^c.charCodeAt(0); }
  return `${learningKey(answer)}:${(a>>>0).toString(16)}${(b>>>0).toString(16)}`;
}
export function emptyLearningState() { return { version:1, profile:null, handled:false, completed:{}, lastVisited:null, stats:{attempts:0,correct:0}, attempts:[], quizzes:[], mistakes:[], daily:{}, bookmarks:[], drafts:{}, eventIds:[] }; }
export function normalizeLearningState(value) { return value?.version===1 ? {...emptyLearningState(),...value} : emptyLearningState(); }
export function dueMistakes(state, day = localDay()) { return state.mistakes.filter(item=>!item.mastered && item.dueDay<=day).sort((a,b)=>a.dueDay.localeCompare(b.dueDay)); }
export function applyLearningEvent(previous, event, now = new Date().toISOString()) {
  const current = normalizeLearningState(previous);
  if (!event || !/^[\w-]{10,80}$/.test(event.id||"")) throw new TypeError("Invalid learning update.");
  if (current.eventIds.includes(event.id)) return current;
  let state=structuredClone(current); const day=validDay(event.day)?event.day:now.slice(0,10);
  switch(event.type) {
    case "import": { state=mergeLearningSnapshot(current,event.state);break; }
    case "welcome": { state.handled=true;break; }
    case "profile": {
      const profile=event.profile==null?null:validateProfile(event.profile).profile;
      if(event.profile!=null&&!profile)throw new TypeError("Check your profile details.");
      state.profile=profile;state.handled=true;break;
    }
    case "visit": { const item=location(event.visit); const modes=webLanguages.has(item.language)?webModes:learningModes,mode=modes.has(event.visit.mode)?event.visit.mode:"teach";state.lastVisited={...item,mode,config:cleanConfig(event.visit.config),visitedAt:now};break; }
    case "complete": { const item=location(event);const key=`${item.language}:${item.path}`;state.completed[key]=[...new Set([...(state.completed[key]||[]),item.entryId])].slice(-200);break; }
    case "answer": {
      const value=event.answer,item=location(value);
      if (webLanguages.has(item.language)) throw new TypeError("Browser exercises are completed by rendering HTML and CSS.");
      if(!["quiz","prediction","problem"].includes(value.kind)||typeof value.correct!=="boolean"||!value.submittedAnswer?.trim())throw new TypeError("Enter an answer first.");
      const answer={...item,kind:value.kind,prompt:boundedText(value.prompt,1000),code:boundedText(value.code,6000),expectedAnswer:boundedText(value.expectedAnswer,3000),expectedAnswers:(value.expectedAnswers||[]).filter(v=>typeof v==="string").slice(0,12).map(v=>v.slice(0,1000)),explanation:boundedText(value.explanation,6000),submittedAnswer:boundedText(value.submittedAnswer,3000),correct:value.correct,attemptedAt:now};
      const key=questionKey(answer);state.stats.attempts++;if(answer.correct)state.stats.correct++;
      state.attempts=[...state.attempts,{...item,key,kind:answer.kind,correct:answer.correct,attemptedAt:now}].slice(-100);
      let mistake=state.mistakes.find(m=>m.key===key);
      if(!answer.correct){
        if(!mistake){mistake={...answer,key,firstMissedAt:now,misses:0};state.mistakes.push(mistake);}
        Object.assign(mistake,answer,{misses:mistake.misses+1,reviewLevel:0,dueDay:day,lastReviewDay:null,mastered:false});
      }else if(mistake && mistake.lastReviewDay!==day && mistake.dueDay<=day){
        const level=(mistake.reviewLevel||0)+1;Object.assign(mistake,{reviewLevel:level,lastReviewDay:day,mastered:level>=4,dueDay:addDays(day,[1,3,7,14][Math.min(level-1,3)]),lastCorrectAt:now});
      }
      state.mistakes=state.mistakes.slice(-100);break;
    }
    case "quiz": {
      const item=location(event),score=Number(event.score),total=Number(event.total);
      if (webLanguages.has(item.language)) throw new TypeError("Browser exercises are completed by rendering HTML and CSS.");
      if(!Number.isInteger(total)||total<1||total>100||!Number.isInteger(score)||score<0||score>total)throw new TypeError("Invalid quiz score.");
      state.quizzes=[...state.quizzes,{...item,score,total,completedAt:now}].slice(-30);break;
    }
    case "daily": {
      if(!(learnerLanguages.has(event.language)||webLanguages.has(event.language))||!validDay(event.date)||!["concept","prediction-0","prediction-1","prediction-2","problem"].includes(event.marker))throw new TypeError("Invalid daily practice step.");
      const key=`${event.date}:${event.language}`,record=state.daily[key]||{date:event.date,language:event.language,completed:[]};
      state.daily[key]={...record,completed:[...new Set([...record.completed,event.marker])],updatedAt:now};
      const keys=Object.keys(state.daily).sort();for(const old of keys.slice(0,-120))delete state.daily[old];break;
    }
    case "bookmark": { const item=location(event),key=learningKey(item);state.bookmarks=state.bookmarks.some(v=>learningKey(v)===key)?state.bookmarks.filter(v=>learningKey(v)!==key):[...state.bookmarks,item].slice(-150);break; }
    case "draft": { const item=location(event),key=learningKey(item),value=draftValue(item,event.value);delete state.drafts[key];state.drafts[key]={value,config:cleanConfig(event.config),updatedAt:now};const keys=Object.keys(state.drafts);for(const old of keys.slice(0,-100))delete state.drafts[old];break; }
    default: throw new TypeError("Unknown learning update.");
  }
  state.eventIds=[...state.eventIds,event.id].slice(-200);
  // Keep the newest work within a bounded database row, including Unicode text.
  while(new TextEncoder().encode(JSON.stringify(state)).length>750000){
    const drafts=Object.keys(state.drafts);
    if(drafts.length>1){delete state.drafts[drafts[0]];continue;}
    if(state.mistakes.length>1){const mastered=state.mistakes.findIndex(item=>item.mastered);state.mistakes.splice(mastered>=0?mastered:0,1);continue;}
    if(state.bookmarks.length>50){state.bookmarks.shift();continue;}
    if(state.attempts.length>20){state.attempts.shift();continue;}
    throw new TypeError("Learning record is too large.");
  }
  return state;
}
