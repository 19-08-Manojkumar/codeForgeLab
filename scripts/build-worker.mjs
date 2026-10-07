import { readdir, readFile, mkdir, writeFile, cp } from "node:fs/promises";
import { join, extname } from "node:path";
const assetMap={},types={".html":"text/html; charset=utf-8",".js":"text/javascript; charset=utf-8",".css":"text/css; charset=utf-8",".svg":"image/svg+xml",".txt":"text/plain; charset=utf-8",".json":"application/json",".ico":"image/x-icon",".png":"image/png",".woff2":"font/woff2"};
async function collect(directory,path="") {for(const item of (await readdir(directory,{withFileTypes:true})).sort((a,b)=>a.name.localeCompare(b.name))){const name=path+"/"+item.name,file=join(directory,item.name);if(item.isDirectory())await collect(file,name);else assetMap[name]={data:(await readFile(file)).toString("base64"),type:types[extname(file)]||"application/octet-stream"};}}
await collect("out");
const learner=(await readFile("lib/learner.mjs","utf8")).replace(/^export /gm,"");
const webCurriculum=(await readFile("lib/web-lessons.mjs","utf8")).replace(/^export /gm,"");
const state=(await readFile("lib/learning-state.mjs","utf8")).replace(/^import .*;\r?\n/gm,"").replace(/^export /gm,"");
const worker=(await readFile("server/worker.mjs","utf8")).replace(/^import .*;\r?\n/gm,"").replace(/^export (async function|function)/gm,"$1");
await mkdir("dist/server",{recursive:true});await mkdir("dist/.openai",{recursive:true});
await writeFile("dist/server/index.js",`const STATIC_ASSETS=${JSON.stringify(assetMap)};\n${learner}\n${webCurriculum}\n${state}\n${worker}`);
await cp(".openai/hosting.json","dist/.openai/hosting.json");await cp("drizzle","dist/.openai/drizzle",{recursive:true});
console.log(`Worker packaged with ${Object.keys(assetMap).length} static assets and durable learning storage.`);
