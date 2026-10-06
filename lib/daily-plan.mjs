import { curricula } from "./curriculum.mjs";
import { localDay } from "./learning-state.mjs";
export function dailyPlan(language, date=localDay()) {
  const curriculum=curricula[language];if(!curriculum)throw new TypeError("Choose a language.");
  let seed=0;for(const char of `${date}:${language}`)seed=(Math.imul(seed,31)+char.charCodeAt(0))>>>0;
  const problem=curriculum.problems[seed%curriculum.problems.length], concept=curriculum.topics.find(topic=>topic.id===problem.topicId)||curriculum.topics[seed%curriculum.topics.length];
  const start=curriculum.topics.indexOf(concept), predictions=[0,1,2].map(offset=>curriculum.topics[(start+offset)%curriculum.topics.length]);
  return {date,language,concept,predictions,problem,key:`${date}:${language}`};
}
