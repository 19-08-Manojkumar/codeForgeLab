import { validateProfile } from "./learner.mjs";

// Only expose profile fields from the account verified by Supabase Auth.
export function signupLearningProfile(user) {
  return validateProfile(user?.user_metadata?.learning_profile).profile;
}

export function accountLearningProfile(user, state) {
  if (!user) return null;
  // A saved edit or intentional removal takes precedence over signup details.
  return state.handled || state.profile ? state.profile : user.signupProfile ?? null;
}
