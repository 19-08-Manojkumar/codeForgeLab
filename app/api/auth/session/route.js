import { learningIdentity } from "../../../../lib/supabase/server";
import { createAccountApi } from "../../../../server/account-api.mjs";

export const dynamic = "force-dynamic";
export const GET = createAccountApi(learningIdentity);
