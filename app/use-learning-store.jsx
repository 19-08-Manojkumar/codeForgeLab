"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import { emptyLearningState } from "../lib/learning-state.mjs";
import { LearningStore, learningTransport } from "../lib/learning-store.mjs";

export default function useLearningStore(account) {
  const [snapshot, setSnapshot] = useState(() => ({ state: emptyLearningState(), status: "loading", identity: "guest" }));
  const store = useRef(null), owner = account.user?.id || null, ready=account.status!=="loading";
  const transport=useCallback(async(...args)=>{try{return await learningTransport(...args);}catch(error){if(error.status===401||error.status===409)void account.refresh();throw error;}},[account.refresh]);
  useEffect(() => {
    if (!ready) return;
    let storage = null, legacyStorage = null;
    try { storage = window.localStorage; legacyStorage = window.sessionStorage; } catch {}
    const controller = new LearningStore({ owner, storage, legacyStorage, transport, changed: setSnapshot });
    store.current = controller; setSnapshot(controller.snapshot());
    if (owner) void controller.load();
    return () => { controller.destroy(); if (store.current === controller) store.current = null; };
  }, [owner, ready, transport]);
  const dispatch = useCallback(data => store.current?.dispatch(data), []);
  const retry = useCallback(() => { if (account.status === "unavailable") void account.refresh(); else void store.current?.retry(); }, [account.status, account.refresh]);
  const visible=snapshot.identity===(owner||"guest")?snapshot:{state:emptyLearningState(),status:"loading",identity:owner||"guest"};
  return { ...visible, status: account.status === "unavailable" ? "account-unavailable" : visible.status, dispatch, retry };
}
