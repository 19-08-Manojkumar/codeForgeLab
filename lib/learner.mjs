export const PROFILE_KEY = "methodlab.learner.v1";
export const HANDLED_KEY = "methodlab.learner-handled.v1";

const ROLES = new Set(["student", "working", "independent"]);
const GOALS = new Set(["basics", "projects", "interviews", "work", "course"]);
const normalizeText = value => typeof value === "string" ? value.trim().replace(/\s+/gu, " ") : "";

// Only these fields enter session storage. Age is optional metadata, never a learning rule.
export function validateProfile(draft) {
  const source = draft && typeof draft === "object" ? draft : {};
  const name = normalizeText(source.name);
  const domain = normalizeText(source.domain);
  const role = typeof source.role === "string" ? source.role : "";
  const goal = typeof source.goal === "string" ? source.goal : "";
  const rawAge = source.age == null ? "" : String(source.age).trim();
  const age = rawAge === "" ? null : Number(rawAge);
  const errors = {};

  if (!name) errors.name = "Enter the name you would like us to use.";
  else if ([...name].length > 40) errors.name = "Keep your name to 40 characters or fewer.";
  if (rawAge !== "" && (!/^\d+$/u.test(rawAge) || !Number.isInteger(age) || age < 1 || age > 120)) {
    errors.age = "Enter a whole number from 1 to 120, or leave age blank.";
  }
  if (!ROLES.has(role)) errors.role = "Choose the option that describes you.";
  if (!domain) errors.domain = "Enter your area of study, work, or interest.";
  else if ([...domain].length > 60) errors.domain = "Keep your area to 60 characters or fewer.";
  if (!GOALS.has(goal)) errors.goal = "Choose what you would like to achieve.";

  return {
    profile: Object.keys(errors).length ? null : { name, age, role, domain, goal },
    errors,
  };
}

function readItem(storage, key) {
  try { return storage?.getItem(key) ?? null; } catch { return null; }
}

export function readLearnerSession(storage) {
  let profile = null;
  try {
    const saved = readItem(storage, PROFILE_KEY);
    if (saved) profile = validateProfile(JSON.parse(saved)).profile;
  } catch { /* A malformed session should not prevent learning. */ }
  return { profile, handled: !!profile || readItem(storage, HANDLED_KEY) === "true" };
}

export function saveLearnerSession(storage, profile) {
  const normalized = profile == null ? null : validateProfile(profile).profile;
  try {
    if (normalized) storage?.setItem(PROFILE_KEY, JSON.stringify(normalized));
    else storage?.removeItem(PROFILE_KEY);
  } catch { /* The UI can retain the profile in memory when storage is unavailable. */ }
  try { storage?.setItem(HANDLED_KEY, "true"); } catch { /* Skipping is also safe without storage. */ }
  return { profile: normalized, handled: true };
}

export function learnerBackground(profile) {
  if (!profile) return "";
  if (profile.role === "student") return `Studying ${profile.domain}`;
  if (profile.role === "working") return `Working in ${profile.domain}`;
  return `Exploring ${profile.domain}`;
}

export function learnerGoalMessage(profile) {
  if (!profile) return "Keep going, one clear idea at a time.";
  const messages = {
    basics: "Keep going, one clear idea at a time.",
    projects: "Every result you understand helps you build with more confidence.",
    interviews: "Explaining why the code works is good practice for your next interview.",
    work: "Keep practicing for the code you want to use at work.",
    course: "You’re building understanding for your coursework.",
  };
  return messages[profile.goal] ?? messages.basics;
}

export function personalizeCelebration(celebration, profile) {
  if (!celebration) return celebration;
  const name = profile?.name?.trim();
  const title = name ? `Well done, ${name}!` : "Well done!";
  switch (celebration.kind) {
    case "first":
      return { ...celebration, title, message: name ? learnerGoalMessage(profile) : celebration.message };
    case "retry":
      return { ...celebration, title, message: "Taking another look helped. Keep tracing the code step by step." };
    case "streak": {
      const streak = Number.isInteger(celebration.streak) && celebration.streak > 0 ? celebration.streak : null;
      return { ...celebration, title, message: `${streak ? `${streak} correct predictions in a row. ` : ""}Your careful predictions are paying off. Keep following each step.` };
    }
    case "perfect": {
      const count = Number.isInteger(celebration.count) && celebration.count > 0 ? celebration.count : null;
      return { ...celebration, title, message: count ? `All ${count} predictions were correct on your first try. ${learnerGoalMessage(profile)}` : `Every prediction was correct on your first try. ${learnerGoalMessage(profile)}` };
    }
    case "prediction":
    case "problem":
      return { ...celebration, title };
    default:
      return celebration;
  }
}

export function correctFeedback(profile, index = 0) {
  if (!profile) return "That’s right.";
  const name = profile.name;
  const messages = [
    `Well done, ${name}!`,
    `Nice work, ${name}!`,
    `That’s right, ${name}. Keep going!`,
    `You predicted it correctly, ${name}!`,
  ];
  const position = Number.isInteger(index) ? ((index % messages.length) + messages.length) % messages.length : 0;
  return messages[position];
}

export function retryFeedback(profile) {
  return profile ? `Take another look, ${profile.name}. Trace each step before checking again.` : "Almost. Take another look.";
}
