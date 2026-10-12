import { applyLearningEvent } from "../lib/learning-state.mjs";
import { requestOrigin } from "../lib/request-origin.mjs";
import { signupLearningProfile } from "../lib/account-profile.mjs";

const headers = { "Cache-Control": "private, no-store", "X-Content-Type-Options": "nosniff" };
export const learningJson = (value, status = 200) => Response.json(value, { status, headers });

async function record(client) {
  const { data, error } = await client.rpc("get_learning_state");
  if (error || !data?.state || !Number.isSafeInteger(data.revision)) throw new Error("Storage unavailable");
  return data;
}

async function accountRecord(client, user) {
  // Signup details come from the verified account, including on a new device.
  // Existing edits and intentional profile removal always take precedence.
  const profile = signupLearningProfile(user);
  for (let attempt = 0; attempt < 4; attempt++) {
    const before = await record(client);
    if (!profile || before.state.profile || before.state.handled) return before;
    const event = { id: "signup-profile-v1", type: "profile", profile };
    const next = applyLearningEvent(before.state, event);
    const { data, error } = await client.rpc("apply_learning_update", { p_event_id: event.id, p_expected_revision: before.revision, p_state: next });
    if (error) throw new Error("Storage unavailable");
    if (["saved", "duplicate"].includes(data?.status) && data.state) return data;
    if (data?.status !== "conflict") throw new Error("Storage unavailable");
  }
  throw new Error("Profile initialization is busy");
}

export function createLearningApi(getIdentity) {
  return async function learningApi(request) {
    try {
      const { client, user, unavailable } = await getIdentity();
      if (unavailable) return learningJson({ error: "Account saving is temporarily unavailable." }, 503);
      if (!user) return learningJson({ error: "Sign in to save learning to your account." }, 401);
      const expectedAccount = request.headers.get("X-Learner-Account");
      if (expectedAccount && expectedAccount !== user.id) return learningJson({ error: "Your account changed. Sign in again to save this work." }, 409);
      if (request.method === "GET") return learningJson({ state: (await accountRecord(client, user)).state });
      if (request.method !== "POST") return learningJson({ error: "Method not allowed." }, 405);
      const origin = request.headers.get("Origin");
      if ((origin && origin !== requestOrigin(request)) || request.headers.get("Sec-Fetch-Site") === "cross-site") return learningJson({ error: "Request origin does not match." }, 403);
      if (!request.headers.get("Content-Type")?.startsWith("application/json")) return learningJson({ error: "Send a JSON learning update." }, 415);
      if (Number(request.headers.get("Content-Length")) > 800000) return learningJson({ error: "Learning update is too large." }, 413);
      const body = await request.text(), length = new TextEncoder().encode(body).length;
      if (length > 800000) return learningJson({ error: "Learning update is too large." }, 413);
      let event;
      try { event = JSON.parse(body); } catch { return learningJson({ error: "Invalid update." }, 400); }
      if (!event || typeof event !== "object" || Array.isArray(event) || typeof event.id !== "string" || !/^[\w-]{10,80}$/.test(event.id) || typeof event.type !== "string") return learningJson({ error: "Invalid update." }, 400);
      if (event.type !== "import" && length > 200000) return learningJson({ error: "Learning update is too large." }, 413);
      for (let attempt = 0; attempt < 4; attempt++) {
        const before = await record(client);
        let next;
        try { next = applyLearningEvent(before.state, event); } catch { return learningJson({ error: "Check the learning update." }, 400); }
        const { data, error } = await client.rpc("apply_learning_update", { p_event_id: event.id, p_expected_revision: before.revision, p_state: next });
        if (error) throw new Error("Storage unavailable");
        if (["saved", "duplicate"].includes(data?.status)) return learningJson({ state: data.state });
        if (data?.status !== "conflict") throw new Error("Storage unavailable");
      }
      return learningJson({ error: "Another update is saving. Try again." }, 409);
    } catch {
      return learningJson({ error: "Learning storage is temporarily unavailable." }, 503);
    }
  };
}
