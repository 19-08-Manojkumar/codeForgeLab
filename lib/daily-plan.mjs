import { curricula } from "./curriculum.mjs";
import { localDay } from "./learning-state.mjs";
import { getWebPracticeEntries } from "./web-practice.mjs";
export function dailyPlan(language, date=localDay()) {
  let seed=0;for(const char of `${date}:${language}`)seed=(Math.imul(seed,31)+char.charCodeAt(0))>>>0;
  if (language === "html" || language === "css") {
    const topics = getWebPracticeEntries(language, "basics"), start = seed % topics.length;
    return { date, language, web: true, concept: topics[start], predictions: [0, 1, 2].map(offset => topics[(start + offset) % topics.length]), problem: topics[(start + 3) % topics.length], key: `${date}:${language}` };
  }
  const curriculum=curricula[language];if(!curriculum)throw new TypeError("Choose a language.");
  const problem=curriculum.problems[seed%curriculum.problems.length], concept=curriculum.topics.find(topic=>topic.id===problem.topicId)||curriculum.topics[seed%curriculum.topics.length];
  const start=curriculum.topics.indexOf(concept), predictions=[0,1,2].map(offset=>curriculum.topics[(start+offset)%curriculum.topics.length]);
  return {date,language,concept,predictions,problem,key:`${date}:${language}`};
}
