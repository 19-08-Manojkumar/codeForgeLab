"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import { applyLearningEvent, emptyLearningState, localDay } from "../lib/learning-state.mjs";
import { readLearnerSession } from "../lib/learner.mjs";

export default function useLearningStore() {
  const [state,setState]=useState(emptyLearningState),[status,setStatus]=useState("loading");
  const current=useRef(state),pending=useRef([]),loaded=useRef(false),busy=useRef(false),mounted=useRef(false);
  const publish=useCallback(value=>{current.current=value;if(mounted.current)setState(value);},[]);
  const pump=useCallback(async()=>{
    if(busy.current||!loaded.current||!pending.current.length)return;
    busy.current=true;setStatus("saving");
    try {
      while(pending.current.length){
        const event=pending.current[0],body=JSON.stringify(event),response=await fetch("/api/learning",{method:"POST",headers:{"Content-Type":"application/json"},body,signal:AbortSignal.timeout(10000),keepalive:new TextEncoder().encode(body).length<=60000});
        if(!response.ok)throw new Error("Save unavailable");const saved=await response.json();pending.current.shift();
        publish(pending.current.reduce((value,queued)=>applyLearningEvent(value,queued),saved.state));
      }
      if(mounted.current)setStatus("saved");
    }catch{if(mounted.current)setStatus("unavailable");}finally{busy.current=false;}
  },[publish]);
  const dispatch=useCallback(data=>{
    const event={...data,id:crypto.randomUUID(),day:localDay()};
    try {publish(applyLearningEvent(current.current,event));const index=["draft","visit"].includes(event.type)?pending.current.findIndex((queued,i)=>i>=(busy.current?1:0)&&queued.type===event.type&&(event.type==="visit"||`${queued.language}:${queued.path}:${queued.entryId}`===`${event.language}:${event.path}:${event.entryId}`)):-1;if(index>=0)pending.current[index]=event;else pending.current.push(event);void pump();}catch{}
  },[publish,pump]);
  const load=useCallback(async()=>{
    if(busy.current)return;busy.current=true;loaded.current=false;setStatus("loading");
    try {
      const response=await fetch("/api/learning",{cache:"no-store",signal:AbortSignal.timeout(10000)});if(!response.ok)throw new Error("Load unavailable");
      const saved=await response.json();let value=saved.state;
      if(!value.handled){let storage;try{storage=sessionStorage;}catch{}const old=readLearnerSession(storage);if(old.handled){const event={type:"profile",profile:old.profile,id:crypto.randomUUID(),day:localDay()};pending.current.unshift(event);}}
      publish(pending.current.reduce((value,event)=>applyLearningEvent(value,event),value));loaded.current=true;
      setStatus(pending.current.length?"saving":"saved");
    }catch{setStatus("unavailable");}finally{busy.current=false;if(loaded.current)void pump();}
  },[publish,pump]);
  useEffect(()=>{mounted.current=true;void load();return()=>{mounted.current=false;};},[load]);
  return {state,status,dispatch,retry:load};
}
