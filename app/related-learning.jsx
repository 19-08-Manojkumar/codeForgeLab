const learningSites = [
  {
    id: "databases",
    name: "DataForge DB",
    title: "Learn SQL & NoSQL",
    description: "Explore SQL and NoSQL, from database fundamentals to working with structured and flexible data.",
    topics: ["SQL", "NoSQL", "Databases"],
    href: "https://dataforge-db.vercel.app/",
    action: "Explore databases",
  },
  {
    id: "data-science",
    name: "Data Science Forge",
    title: "Learn data science & analytics",
    description: "Explore data science and data analytics, and learn how to turn data into useful insights.",
    topics: ["Data science", "Data analytics"],
    href: "https://data-science-forge.vercel.app/",
    action: "Explore data science",
  },
];

function LearningMark({ database }) {
  return <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{database ? <><ellipse cx="12" cy="5" rx="8" ry="3"/><path d="M4 5v7c0 1.7 3.6 3 8 3s8-1.3 8-3V5M4 12v7c0 1.7 3.6 3 8 3s8-1.3 8-3v-7"/></> : <><path d="M3 3v18h18M7 16v-4M12 16V8M17 16V5"/><path d="m6 9 5-5 5 2 5-4"/></>}</svg>;
}

export default function RelatedLearning() {
  return <section className="related-learning" aria-labelledby="related-learning-heading">
    <div className="related-learning-heading"><span className="eyebrow">KEEP LEARNING</span><h2 id="related-learning-heading">Explore other areas</h2><p>Continue your learning on our database and data websites.</p></div>
    <div className="related-learning-grid">{learningSites.map(site => <a key={site.id} className={`related-learning-card ${site.id}`} href={site.href} target="_blank" rel="noopener noreferrer">
      <div className="related-card-top"><span className="related-learning-mark"><LearningMark database={site.id === "databases"}/></span><span className="related-site-name">{site.name}</span><svg className="related-external-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M14 3h7v7M21 3l-9 9M10 3H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-5"/></svg></div>
      <h3>{site.title}</h3><p>{site.description}</p><div className="related-topic-list">{site.topics.map(topic => <span key={topic}>{topic}</span>)}</div>
      <div className="related-card-bottom"><span>{site.action}</span><span className="related-link-arrow" aria-hidden="true">↗</span></div><span className="sr-only">Opens {site.name} in a new tab.</span>
    </a>)}</div>
  </section>;
}
