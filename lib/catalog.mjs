export function filterLessons(catalog, query = "", group = "all") {
  const terms = query.trim().toLowerCase().split(/\s+/u).filter(Boolean);
  return catalog.filter(lesson => {
    if (group !== "all" && lesson.group !== group) return false;
    const text = [lesson.id, lesson.name, lesson.verb, lesson.group, lesson.kind].join(" ").toLowerCase();
    return terms.every(term => text.includes(term));
  });
}
