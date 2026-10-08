import { learningIdentity } from "../../../../lib/supabase/server";
import { learningJson } from "../../../../server/learning-api.mjs";

export const dynamic = "force-dynamic";
export async function GET() {
  try {
    const { user, unavailable } = await learningIdentity();
    if (unavailable) return learningJson({ error: "Account service is temporarily unavailable." }, 503);
    return learningJson({ user: user ? { id: user.id, email: user.email } : null });
  } catch { return learningJson({ error: "Account service is temporarily unavailable." }, 503); }
}
