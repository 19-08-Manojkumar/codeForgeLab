export const activityDayLimit = 3660;
export const validActivityDay = value => typeof value === "string" && /^\d{4}-\d{2}-\d{2}$/.test(value) && !Number.isNaN(Date.parse(value)) && new Date(value).toISOString().slice(0, 10) === value;
export function shiftActivityDay(day, offset) { const date = new Date(`${day}T12:00:00Z`); date.setUTCDate(date.getUTCDate() + offset); return date.toISOString().slice(0, 10); }
export function emptyActivity() { return { days: {}, firstDay: null, bestStreak: 0, earned: [] }; }

function longestRun(days) {
  let best = 0, run = 0, previous;
  for (const day of days.sort()) { run = previous && shiftActivityDay(previous, 1) === day ? run + 1 : 1; best = Math.max(best, run); previous = day; }
  return best;
}

export function activityFromState(state) {
  if (state && Object.hasOwn(state, "activity") && state.activity !== undefined) return structuredClone(state.activity);
  // Recover only dated practice records from older accounts. No time is invented.
  const activity = emptyActivity();
  const dates = new Set([...(state?.attempts || []).map(item => item.attemptedAt?.slice(0, 10)), ...(state?.quizzes || []).map(item => item.completedAt?.slice(0, 10)), ...Object.values(state?.daily || {}).filter(item => item.completed?.some(marker => marker !== "concept")).map(item => item.date)]);
  for (const date of [...dates].filter(validActivityDay).sort()) activity.days[date] = { seconds: 0, actions: 1 };
  activity.firstDay = Object.keys(activity.days)[0] || null;
  activity.bestStreak = longestRun(Object.keys(activity.days));
  return activity;
}

export function recordCodingActivity(activity, day, { seconds = 0, actions = 0 } = {}) {
  const next = structuredClone(activity), previous = next.days[day] || { seconds: 0, actions: 0 };
  next.days[day] = { seconds: Math.min(86400, previous.seconds + seconds), actions: Math.min(100000, previous.actions + actions) };
  next.firstDay = !next.firstDay || day < next.firstDay ? day : next.firstDay;
  next.bestStreak = Math.max(next.bestStreak, longestRun(Object.keys(next.days)));
  rememberMilestones(next);
  for (const old of Object.keys(next.days).sort().slice(0, -activityDayLimit)) delete next.days[old];
  return next;
}

export function mergeCodingActivity(current, guest) {
  const next = structuredClone(current);
  for (const [day, record] of Object.entries(guest.days)) {
    const previous = next.days[day] || { seconds: 0, actions: 0 };
    next.days[day] = { seconds: Math.min(86400, previous.seconds + record.seconds), actions: Math.min(100000, previous.actions + record.actions) };
  }
  next.firstDay = [current.firstDay, guest.firstDay].filter(Boolean).sort()[0] || null;
  next.bestStreak = Math.max(current.bestStreak, guest.bestStreak, longestRun(Object.keys(next.days)));
  next.earned = [...new Set([...(current.earned || []), ...(guest.earned || [])])];
  rememberMilestones(next);
  for (const old of Object.keys(next.days).sort().slice(0, -activityDayLimit)) delete next.days[old];
  return next;
}

export const codingMilestones = [
  { id: "first-day", label: "First spark", description: "Your first practice day", kind: "days", target: 1, tier: "bronze" },
  { id: "streak-3", label: "Finding rhythm", description: "3 consecutive practice days", kind: "streak", target: 3, tier: "bronze" },
  { id: "time-10m", label: "Warming up", description: "10 minutes of active practice", kind: "seconds", target: 600, tier: "bronze" },
  { id: "days-5", label: "Five foundations", description: "5 total practice days", kind: "days", target: 5, tier: "bronze" },
  { id: "streak-7", label: "Week of code", description: "7 consecutive practice days", kind: "streak", target: 7, tier: "silver" },
  { id: "time-30m", label: "In the zone", description: "30 minutes of active practice", kind: "seconds", target: 1800, tier: "bronze" },
  { id: "days-10", label: "Ten steps ahead", description: "10 total practice days", kind: "days", target: 10, tier: "silver" },
  { id: "streak-14", label: "Fortnight flow", description: "14 consecutive practice days", kind: "streak", target: 14, tier: "silver" },
  { id: "time-1", label: "Focused mind", description: "1 hour of active practice", kind: "seconds", target: 3600, tier: "silver" },
  { id: "streak-21", label: "Habit maker", description: "21 consecutive practice days", kind: "streak", target: 21, tier: "silver" },
  { id: "days-25", label: "Quarter century", description: "25 total practice days", kind: "days", target: 25, tier: "silver" },
  { id: "streak-30", label: "Steady builder", description: "30 consecutive practice days", kind: "streak", target: 30, tier: "gold" },
  { id: "time-2", label: "Two-hour thinker", description: "2 hours of active practice", kind: "seconds", target: 7200, tier: "silver" },
  { id: "days-50", label: "Half century", description: "50 total practice days", kind: "days", target: 50, tier: "gold" },
  { id: "streak-50", label: "Fifty on fire", description: "50 consecutive practice days", kind: "streak", target: 50, tier: "gold" },
  { id: "time-5", label: "Patient solver", description: "5 hours of active practice", kind: "seconds", target: 18000, tier: "gold" },
  { id: "days-75", label: "Three-quarter mark", description: "75 total practice days", kind: "days", target: 75, tier: "gold" },
  { id: "streak-75", label: "Unbroken rhythm", description: "75 consecutive practice days", kind: "streak", target: 75, tier: "gold" },
  { id: "time-10", label: "Deep learner", description: "10 hours of active practice", kind: "seconds", target: 36000, tier: "gold" },
  { id: "days-100", label: "Hundred days", description: "100 total practice days", kind: "days", target: 100, tier: "platinum" },
  { id: "streak-100", label: "Code centurion", description: "100 consecutive practice days", kind: "streak", target: 100, tier: "platinum" },
  { id: "time-20", label: "Craftsperson", description: "20 hours of active practice", kind: "seconds", target: 72000, tier: "platinum" },
  { id: "streak-180", label: "Half-year habit", description: "180 consecutive practice days", kind: "streak", target: 180, tier: "platinum" },
  { id: "time-100", label: "Master of focus", description: "100 hours of active practice", kind: "seconds", target: 360000, tier: "platinum" },
  { id: "streak-365", label: "Year of code", description: "365 consecutive practice days", kind: "streak", target: 365, tier: "platinum" },
];

export function streakFlame(streak) {
  const level = [1, 3, 7, 14, 30, 100].filter(target => streak >= target).length;
  return { level, size: 34 + level * 5, glow: 2 + level * 3, speed: 1.8 - level * .13 };
}

function rememberMilestones(activity) {
  const days = Object.keys(activity.days), seconds = days.reduce((sum, day) => sum + activity.days[day].seconds, 0);
  activity.earned = [...new Set([...(activity.earned || []), ...codingMilestones.filter(item => (item.kind === "streak" ? activity.bestStreak : item.kind === "seconds" ? seconds : days.length) >= item.target).map(item => item.id)])];
}

export function codingSummary(state, today) {
  const activity = activityFromState(state), days = Object.keys(activity.days).filter(day => day <= today).sort();
  const activeToday = !!activity.days[today], yesterday = shiftActivityDay(today, -1);
  let currentStreak = 0, cursor = activeToday ? today : yesterday;
  while (activity.days[cursor]) { currentStreak++; cursor = shiftActivityDay(cursor, -1); }
  const bestStreak = Math.max(activity.bestStreak, longestRun([...days])), seconds = days.reduce((sum, day) => sum + activity.days[day].seconds, 0);
  const achievements = codingMilestones.map(item => ({ ...item, earned: activity.earned?.includes(item.id) || (item.kind === "streak" ? bestStreak : item.kind === "seconds" ? seconds : days.length) >= item.target }));
  const earned = achievements.filter(item => item.earned), tiers = ["none", "bronze", "silver", "gold", "platinum"];
  const tier = tiers[Math.max(0,...earned.map(item=>tiers.indexOf(item.tier)))];
  return { activity, currentStreak, bestStreak, seconds, practiceDays: days.length, activeToday, missedYesterday: !!activity.firstDay && activity.firstDay <= yesterday && !activity.days[yesterday], achievements, earned, tier };
}

export function activityDayStatus(activity, day, today) {
  if (day > today) return "future";
  if (activity.days[day]) return "active";
  if (day === today) return "today";
  return activity.firstDay && day >= activity.firstDay ? "missed" : "before";
}

export function practiceTimeLabel(seconds) {
  if (seconds < 60) return seconds ? "Less than a minute" : "0 minutes";
  const minutes = Math.floor(seconds / 60);
  return minutes < 60 ? `${minutes} min` : `${Math.floor(minutes / 60)}h${minutes % 60 ? ` ${minutes % 60}m` : ""}`;
}
