import { applyLearningEvent, emptyLearningState, normalizeLearningState } from "../lib/learning-state.mjs";

const jsonResponse=(value,status=200)=>Response.json(value,{status,headers:{"Cache-Control":"no-store","X-Content-Type-Options":"nosniff"}});
async function learnerRow(db,userId) {
  await db.prepare("INSERT INTO learning_state (user_id, state_json, revision) VALUES (?, ?, 0) ON CONFLICT(user_id) DO NOTHING").bind(userId,JSON.stringify(emptyLearningState())).run();
  return db.prepare("SELECT state_json, revision FROM learning_state WHERE user_id = ?").bind(userId).first();
}
export async function learningApi(request,env) {
  const userId=request.headers.get("oai-authenticated-user-id");
  if(!userId)return jsonResponse({error:"Sign in to save your learning progress."},401);
  if(!env.DB)return jsonResponse({error:"Learning storage is temporarily unavailable."},503);
  try {
    if(request.method==="GET"){const row=await learnerRow(env.DB,userId);return jsonResponse({state:normalizeLearningState(JSON.parse(row.state_json))});}
    if(request.method!=="POST")return jsonResponse({error:"Method not allowed."},405);
    const origin=request.headers.get("Origin");if(origin&&origin!==new URL(request.url).origin)return jsonResponse({error:"Request origin does not match."},403);
    if(!request.headers.get("Content-Type")?.startsWith("application/json"))return jsonResponse({error:"Send a JSON learning update."},415);
    if(Number(request.headers.get("Content-Length"))>200000)return jsonResponse({error:"Learning update is too large."},413);
    const body=await request.text();if(new TextEncoder().encode(body).length>200000)return jsonResponse({error:"Learning update is too large."},413);
    let event;try{event=JSON.parse(body);}catch{return jsonResponse({error:"Invalid update."},400);}
    if(!event||typeof event!=="object"||!/^[\w-]{10,80}$/.test(event.id||"")||typeof event.type!=="string")return jsonResponse({error:"Invalid update."},400);
    for(let attempt=0;attempt<4;attempt++) {
      const row=await learnerRow(env.DB,userId),before=normalizeLearningState(JSON.parse(row.state_json));
      const applied=await env.DB.prepare("SELECT event_id FROM learning_events WHERE user_id = ? AND event_id = ?").bind(userId,event.id).first();
      if(applied)return jsonResponse({state:before});
      let next;try{next=applyLearningEvent(before,event);}catch{return jsonResponse({error:"Check the learning update."},400);}
      if(before.eventIds.includes(event.id))return jsonResponse({state:before});
      const results=await env.DB.batch([
        env.DB.prepare("UPDATE learning_state SET state_json = ?, revision = revision + 1 WHERE user_id = ? AND revision = ? AND NOT EXISTS (SELECT 1 FROM learning_events WHERE user_id = ? AND event_id = ?)").bind(JSON.stringify(next),userId,row.revision,userId,event.id),
        env.DB.prepare("INSERT INTO learning_events (user_id, event_id, created_at) SELECT ?, ?, ? WHERE changes() = 1").bind(userId,event.id,new Date().toISOString()),
      ]);
      if(results[0].meta.changes===1)return jsonResponse({state:next});
    }
    return jsonResponse({error:"Another update is saving. Try again."},409);
  }catch(error){console.error("Learning storage unavailable",error.message);return jsonResponse({error:"Learning storage is temporarily unavailable."},503);}
}

export function serveStatic(request,assets) {
  if(!["GET","HEAD"].includes(request.method))return new Response("Method not allowed",{status:405});
  let path;try{path=decodeURIComponent(new URL(request.url).pathname);}catch{return new Response("Invalid URL",{status:400});}
  let asset=assets[path]||assets[path.replace(/\/$/,"")+"/index.html"];
  const status=asset?200:404;asset=asset||assets["/404.html"];
  if(!asset)return new Response("Not found",{status:404});
  const bytes=Uint8Array.from(atob(asset.data),char=>char.charCodeAt(0));
  return new Response(request.method==="HEAD"?null:bytes,{status,headers:{"Content-Type":asset.type,"Cache-Control":path.startsWith("/_next/static/")?"public, max-age=31536000, immutable":"no-cache","X-Content-Type-Options":"nosniff"}});
}
export default {async fetch(request,env){const path=new URL(request.url).pathname;if(path==="/api/learning")return learningApi(request,env);if(path.startsWith("/api/"))return jsonResponse({error:"Not found."},404);return serveStatic(request,STATIC_ASSETS);}};
