import { learningIdentity } from "../../../lib/supabase/server";
import { createLearningApi } from "../../../server/learning-api.mjs";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";
const handler = createLearningApi(learningIdentity);
export const GET = handler;
export const POST = handler;
