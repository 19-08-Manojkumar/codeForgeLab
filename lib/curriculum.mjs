import javascript from "./curriculum/javascript.mjs";
import python from "./curriculum/python.mjs";
import java from "./curriculum/java.mjs";
import c from "./curriculum/c.mjs";

export const curricula = { javascript, python, java, c };
export function getPracticeEntries(language, path) {
  const curriculum = curricula[language]; if (!curriculum) return [];
  if (path === "methods") return (curriculum.references || []).map(entry => ({ ...entry, title: entry.name, group: entry.group || "Functions" }));
  if (path === "basics") return curriculum.topics.map(entry => ({ ...entry, group: entry.title }));
  const entries = path === "interviews" ? curriculum.interviews : path === "problems" ? curriculum.problems : [];
  return entries.map(entry => ({ ...entry, title: entry.title || entry.question, group: curriculum.topics.find(topic => topic.id === entry.topicId)?.title || "Practice" }));
}
