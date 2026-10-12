import { signupLearningProfile } from "../lib/account-profile.mjs";
import { learningJson } from "./learning-api.mjs";

export function createAccountApi(getIdentity) {
  return async function accountApi() {
    try {
      const { user, unavailable } = await getIdentity();
      if (unavailable) return learningJson({ error: "Account service is temporarily unavailable." }, 503);
      return learningJson({ user: user ? { id: user.id, email: user.email, signupProfile: signupLearningProfile(user) } : null });
    } catch { return learningJson({ error: "Account service is temporarily unavailable." }, 503); }
  };
}
