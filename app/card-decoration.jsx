const motifs = {
  methods: <><circle className="decoration-orbit" cx="50" cy="35" r="25" strokeDasharray="3 5"/><g className="decoration-float"><path d="m37 25-9 10 9 10m26-20 9 10-9 10m-10-24-7 28"/></g><circle className="decoration-dot" cx="75" cy="35" r="3"/></>,
  render: <><rect className="decoration-float" x="21" y="14" width="58" height="42" rx="7"/><path d="M21 25h58"/><g className="decoration-slide"><path d="m39 33-7 7 7 7m22-14 7 7-7 7m-9-17-4 20"/></g></>,
  basics: <><g className="decoration-float"><path className="decoration-fill" d="M50 22c-10-7-21-8-30-5v34c10-3 21-2 30 5 9-7 20-8 30-5V17c-9-3-20-2-30 5Z"/><path d="M50 22v34M27 27c5-1 10 0 16 3m-16 6c5-1 10 0 16 3m14-9c6-3 11-4 16-3m-16 12c6-3 11-4 16-3"/></g><path className="decoration-pulse" d="m76 6 2 5 5 2-5 2-2 5-2-5-5-2 5-2Z"/></>,
  interviews: <><path className="decoration-fill decoration-float" d="M22 17h43a7 7 0 0 1 7 7v16a7 7 0 0 1-7 7H39L26 57V47h-4a7 7 0 0 1-7-7V24a7 7 0 0 1 7-7Z"/><g className="decoration-slide"><circle cx="33" cy="32" r="2"/><circle cx="44" cy="32" r="2"/><circle cx="55" cy="32" r="2"/></g><path className="decoration-pulse" d="M69 29h9a7 7 0 0 1 7 7v15a7 7 0 0 1-7 7h-4l-8 6v-6h-6"/></>,
  problems: <><rect className="decoration-fill" x="20" y="12" width="62" height="47" rx="8"/><path d="M20 25h62m-54-6h2m6 0h2m6 0h2"/><path className="decoration-slide" d="m29 35 8 6-8 6m15 0h11"/><path className="decoration-pulse" d="m62 40 5 5 10-12"/></>,
  "level-1": <><rect x="20" y="13" width="60" height="45" rx="6" strokeDasharray="3 4"/><g className="decoration-float"><rect className="decoration-fill" x="28" y="22" width="17" height="11" rx="3"/><path d="M51 25h19M51 31h13M28 42h42M28 49h26"/></g></>,
  "level-2": <><g className="decoration-layout"><rect className="decoration-fill" x="17" y="15" width="29" height="20" rx="4"/><rect x="52" y="15" width="31" height="39" rx="4"/><rect x="17" y="41" width="29" height="13" rx="4"/></g></>,
  "level-3": <><rect className="decoration-fill" x="17" y="17" width="66" height="37" rx="9"/><rect x="25" y="25" width="28" height="7" rx="3"/><path d="M25 41h17"/><circle className="decoration-click" cx="69" cy="42" r="14"/><path className="decoration-float" d="m59 31 3 25 6-8 9-2-18-15Z"/></>,
  "level-4": <><rect className="decoration-float" x="26" y="11" width="59" height="42" rx="6"/><rect className="decoration-fill" x="16" y="20" width="59" height="42" rx="6"/><path d="M16 31h59m-51 9h15v14H24zM45 41h20M45 48h14"/><path className="decoration-slide" d="M45 55h20"/></>,
  databases: <><g className="decoration-float"><ellipse className="decoration-fill" cx="43" cy="17" rx="22" ry="8"/><path d="M21 17v16c0 4 10 8 22 8s22-4 22-8V17M21 33v16c0 4 10 8 22 8s22-4 22-8V33"/></g><path d="M66 27h15v20H65"/><circle className="decoration-data" cx="81" cy="27" r="3"/></>,
  "data-science": <><path d="M17 12v47h68"/><g className="decoration-bars"><rect className="decoration-fill" x="26" y="36" width="10" height="16" rx="2"/><rect className="decoration-fill" x="45" y="25" width="10" height="27" rx="2"/><rect className="decoration-fill" x="64" y="13" width="10" height="39" rx="2"/></g><path className="decoration-slide" d="m25 25 17-10 14 4L77 7"/><circle className="decoration-pulse" cx="77" cy="7" r="3"/></>,
};

export default function CardDecoration({ variant }) {
  return <span className={`card-decoration motif-${variant}`} aria-hidden="true" inert>
    <svg viewBox="0 0 100 70" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" focusable="false">{motifs[variant] || motifs.methods}</svg>
  </span>;
}
