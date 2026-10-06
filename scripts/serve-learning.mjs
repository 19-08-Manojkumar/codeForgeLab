import { startLearningPreview } from "./local-learning.mjs";
const preview=await startLearningPreview({port:3000,persistent:true});console.log(`MethodLab learning preview: ${preview.url}`);
process.on("SIGINT",()=>{preview.close();process.exit(0);});
