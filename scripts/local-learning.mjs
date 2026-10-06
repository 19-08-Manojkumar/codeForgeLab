import { DatabaseSync } from "node:sqlite";
import { readFile, readdir, mkdir } from "node:fs/promises";
import { join, extname } from "node:path";
import { createServer } from "node:http";
import { learningApi, serveStatic } from "../server/worker.mjs";

// Local preview only. Production receives its learner identity from Sites dispatch.
export async function startLearningPreview({port=0,persistent=false}={}) {
  await mkdir(".sites-runtime",{recursive:true});const sql=new DatabaseSync(persistent?".sites-runtime/learning-preview.sqlite":":memory:");
  sql.exec("CREATE TABLE IF NOT EXISTS local_migrations (name TEXT PRIMARY KEY)");
  for(const name of (await readdir("drizzle")).filter(name=>name.endsWith(".sql")).sort()){if(sql.prepare("SELECT name FROM local_migrations WHERE name=?").get(name))continue;sql.exec("BEGIN");try{sql.exec(await readFile(join("drizzle",name),"utf8"));sql.prepare("INSERT INTO local_migrations (name) VALUES (?)").run(name);sql.exec("COMMIT");}catch(error){sql.exec("ROLLBACK");throw error;}}
  const DB={prepare(query){let values=[];return {bind(...args){values=args;return this;},async first(){return sql.prepare(query).get(...values)||null;},execute(){const result=sql.prepare(query).run(...values);return {meta:{changes:Number(result.changes)}};},async run(){return this.execute();}};},async batch(statements){sql.exec("BEGIN");try{const results=statements.map(statement=>statement.execute());sql.exec("COMMIT");return results;}catch(error){sql.exec("ROLLBACK");throw error;}}};
  const assets={},types={".html":"text/html; charset=utf-8",".js":"text/javascript",".css":"text/css",".svg":"image/svg+xml",".txt":"text/plain",".json":"application/json"};
  async function collect(dir,path=""){for(const item of await readdir(dir,{withFileTypes:true})){const file=join(dir,item.name),name=path+"/"+item.name;if(item.isDirectory())await collect(file,name);else assets[name]={data:(await readFile(file)).toString("base64"),type:types[extname(file)]||"application/octet-stream"};}}
  await collect("out");
  const server=createServer(async(req,res)=>{try{const chunks=[];for await(const chunk of req)chunks.push(chunk);const headers=new Headers(req.headers);headers.set("oai-authenticated-user-id","local-preview-learner");const origin=`http://127.0.0.1:${server.address().port}`;const request=new Request(origin+req.url,{method:req.method,headers,...(!["GET","HEAD"].includes(req.method)?{body:Buffer.concat(chunks)}:{})});const response=new URL(request.url).pathname==="/api/learning"?await learningApi(request,{DB}):serveStatic(request,assets);res.writeHead(response.status,Object.fromEntries(response.headers));res.end(Buffer.from(await response.arrayBuffer()));}catch(error){res.writeHead(500);res.end(error.message);}});
  await new Promise(resolve=>server.listen(port,"127.0.0.1",resolve));
  return {server,url:`http://127.0.0.1:${server.address().port}/`,close(){server.closeAllConnections();server.close();sql.close();},DB};
}
