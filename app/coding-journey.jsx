"use client";

import { useEffect, useId, useRef, useState } from "react";
import { activityDayStatus, practiceTimeLabel, shiftActivityDay, streakFlame } from "../lib/coding-activity.mjs";

export function JourneyIcon({ name = "trophy", size = 22 }) {
  const shapes = {
    trophy: <><path d="M8 3h8v5c0 4-1.5 6-4 6s-4-2-4-6V3ZM8 5H4v2c0 3 2 4 5 4m7-6h4v2c0 3-2 4-5 4M12 14v4m-4 3h8m-7-3h6v3"/></>,
    flame: <path d="M13 2c1 6-5 7-3 11 2-1 3-3 3-5 5 4 7 7 5 11-1 2-3 3-6 3-5 0-8-4-6-9 1-3 4-6 7-11Z"/>,
    check: <path d="m5 12 4 4L19 6"/>,
    clock: <><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></>,
    left: <path d="m15 6-6 6 6 6"/>,
    right: <path d="m9 6 6 6-6 6"/>,
    lock: <><rect x="5" y="10" width="14" height="11" rx="3"/><path d="M8 10V7a4 4 0 0 1 8 0v3"/></>,
    close: <path d="m6 6 12 12M18 6 6 18"/>,
    spark: <path d="m12 2 2.5 7.5L22 12l-7.5 2.5L12 22l-2.5-7.5L2 12l7.5-2.5L12 2Z"/>,
  };
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{shapes[name] || shapes.trophy}</svg>;
}

const formatDate = day => new Intl.DateTimeFormat("en", { month: "short", day: "numeric", year: "numeric", timeZone: "UTC" }).format(new Date(`${day}T12:00:00Z`));
const weekLabels = ["M", "T", "W", "T", "F", "S", "S"];

export function LiveStreakFlame({ streak }) {
  const id = useId().replace(/:/g,""), flame = streakFlame(streak);
  return <span className="live-streak-flame" data-flame-level={flame.level} style={{"--flame-size":`${flame.size}px`,"--flame-glow":`${flame.glow}px`,"--flame-speed":`${flame.speed}s`}} aria-hidden="true"><svg viewBox="0 0 64 80" className="live-flame-art"><defs><linearGradient id={`${id}-outer`} x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor={flame.level>=4?"#fff7c2":"#ffe9a1"}/><stop offset=".38" stopColor="#ffb12e"/><stop offset=".76" stopColor="#ff6425"/><stop offset="1" stopColor="#b92e19"/></linearGradient><linearGradient id={`${id}-tongue`} x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#fff3a6"/><stop offset=".48" stopColor="#ffb52e"/><stop offset="1" stopColor="#ff6b1c"/></linearGradient><linearGradient id={`${id}-inner`} x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#fffef2"/><stop offset=".62" stopColor="#fff28a"/><stop offset="1" stopColor="#ffb52e"/></linearGradient><radialGradient id={`${id}-base`} cx=".5" cy="1" r=".65"><stop stopColor="#5bb9ff"/><stop offset=".5" stopColor="#ff8b20"/><stop offset="1" stopColor="#ff8b20" stopOpacity="0"/></radialGradient></defs><ellipse className="live-flame-base" cx="32" cy="70" rx="18" ry="7" fill={`url(#${id}-base)`}/><path className="live-flame-outer" fill={`url(#${id}-outer)`} d="M32 3C40 20 49 22 45 38C53 34 58 51 55 63C51 75 38 79 27 74C11 70 8 58 14 46C15 52 19 56 20 50C15 37 25 26 27 20C30 13 29 9 32 3Z"/><path className="live-flame-tongue tongue-left" fill={`url(#${id}-tongue)`} d="M27 69C20 63 20 56 23 49C25 44 23 39 26 33C31 41 31 46 28 52C34 48 34 43 35 39C40 47 37 53 35 58C39 55 40 52 40 49C45 57 41 65 37 69C34 72 30 72 27 69Z"/><path className="live-flame-tongue tongue-right" fill={`url(#${id}-tongue)`} d="M34 70C29 65 33 60 35 55C37 50 35 45 39 40C44 47 43 52 41 57C46 54 46 50 47 47C52 55 49 63 44 68C41 71 37 72 34 70Z"/><path className="live-flame-inner" fill={`url(#${id}-inner)`} d="M32 34C38 43 32 47 38 53C43 59 39 69 31 71C22 71 19 64 23 57C23 61 26 59 26 56C27 48 30 42 32 34Z"/></svg><i className="live-flame-spark spark-one"/><i className="live-flame-spark spark-two"/><i className="live-flame-spark spark-three"/></span>;
}

function PracticeCalendar({ summary, today }) {
  const [month, setMonth] = useState(today.slice(0, 7)), [selected, setSelected] = useState(today);
  const grid = useRef(null), keyboard = useRef(false);
  const previousToday = useRef(today);
  const first = `${month}-01`, date = new Date(`${first}T12:00:00Z`), offset = (date.getUTCDay() + 6) % 7;
  const count = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth() + 1, 0, 12)).getUTCDate();
  const monthTitle = new Intl.DateTimeFormat("en", { month: "long", year: "numeric", timeZone: "UTC" }).format(date);
  const selectedStatus = activityDayStatus(summary.activity, selected, today), record = summary.activity.days[selected];
  const earliestMonth = (summary.activity.firstDay || today).slice(0, 7);
  function navigate(direction) {
    const next = new Date(`${first}T12:00:00Z`); next.setUTCMonth(next.getUTCMonth() + direction);
    const nextMonth = next.toISOString().slice(0, 7); setMonth(nextMonth); setSelected(nextMonth === today.slice(0, 7) ? today : `${nextMonth}-01`);
  }
  function key(event, day) {
    const steps = { ArrowLeft: -1, ArrowRight: 1, ArrowUp: -7, ArrowDown: 7 };
    if (!(event.key in steps)) return;
    event.preventDefault(); const next = shiftActivityDay(day, steps[event.key]);
    if (next > today || next.slice(0, 7) < earliestMonth) return;
    keyboard.current = true; setMonth(next.slice(0, 7)); setSelected(next);
  }
  useEffect(() => { if (keyboard.current) { grid.current?.querySelector(`[data-day="${selected}"]`)?.focus(); keyboard.current = false; } }, [selected]);
  useEffect(() => {
    if (today !== previousToday.current && selected === previousToday.current) { setSelected(today); setMonth(today.slice(0, 7)); }
    previousToday.current = today;
  }, [today, selected]);
  return <section className="journey-calendar" aria-label="Coding activity calendar">
    <div className="journey-section-title"><div><span className="eyebrow">SHOWING UP ADDS UP</span><h3>Your practice calendar</h3></div><span className="journey-days-count">{summary.practiceDays} active {summary.practiceDays === 1 ? "day" : "days"}</span></div>
    <div className="journey-month-nav"><strong>{monthTitle}</strong><div><button aria-label="Previous month" disabled={month <= earliestMonth} onClick={()=>navigate(-1)}><JourneyIcon name="left" size={17}/></button><button aria-label="Next month" disabled={month >= today.slice(0, 7)} onClick={()=>navigate(1)}><JourneyIcon name="right" size={17}/></button></div></div>
    <div className="journey-calendar-grid" ref={grid}><div className="journey-week-labels" aria-hidden="true">{weekLabels.map((label,index)=><span key={index}>{label}</span>)}</div><div className="journey-month-days">{Array.from({length:offset},(_,index)=><span key={`blank-${index}`} aria-hidden="true"/>)}{Array.from({length:count},(_,index)=>{const day=`${month}-${String(index+1).padStart(2,"0")}`,status=activityDayStatus(summary.activity,day,today);return <button key={day} data-day={day} className={`journey-day ${status}${day===today?" is-today":""}`} disabled={status==="future"} tabIndex={day===selected?0:-1} aria-pressed={day===selected} aria-label={`${formatDate(day)}: ${status==="active"?"Practice recorded":status==="missed"?"Missed practice":status==="today"?"Today, ready to practice":status==="future"?"Upcoming day":"Before your first practice"}`} title={formatDate(day)} onKeyDown={event=>key(event,day)} onClick={()=>setSelected(day)}><span>{index+1}</span>{status==="active"&&<span className="journey-day-dot"/>}{status==="missed"&&<span className="journey-missed-mark" aria-hidden="true">−</span>}</button>;})}</div></div>
    <div className={`journey-day-detail ${selectedStatus}`} role="status"><strong>{formatDate(selected)}</strong><span>{selectedStatus==="active"?`Practice recorded${record.seconds?` · ${practiceTimeLabel(record.seconds)} active time`:""}`:selectedStatus==="missed"?"No practice recorded. A pause is part of the journey.":selectedStatus==="today"?"Today is still yours. One exercise is a good start.":"Your journey hadn't started yet."}</span></div>
    <div className="journey-calendar-legend"><span><i className="active"/>Practiced</span><span><i className="missed"/>Missed day</span><span><i className="today"/>Today</span></div>
  </section>;
}

export function TrophyShelf({ summary, compact = false }) {
  const next = summary.achievements.find(item=>!item.earned);
  const progress = next ? next.kind==="streak"?summary.currentStreak:next.kind==="seconds"?summary.seconds:summary.practiceDays : 0;
  const progressLabel = next ? next.kind==="seconds"?`${practiceTimeLabel(progress)} / ${practiceTimeLabel(next.target)}`:`${Math.min(progress,next.target)} / ${next.target} ${next.kind==="streak"?"consecutive days":"practice day"}` : "Every milestone earned";
  return <section className={`journey-trophies${compact?" compact":""}`} aria-label="Practice trophies">
    <div className="journey-section-title"><div>{!compact&&<span className="eyebrow">EARNED, ONE SESSION AT A TIME</span>}<h3>{compact?"Your trophies":"Small wins. Worth keeping."}</h3></div><span className="journey-days-count">{summary.earned.length}/{summary.achievements.length}</span></div>
    <div className="journey-trophy-grid" tabIndex={0} role="group" aria-label={`All ${summary.achievements.length} trophies`}>{summary.achievements.map(item=><div key={item.id} className={`journey-trophy ${item.earned?`earned ${item.tier}`:"locked"}`} title={`${item.label}: ${item.description}${item.earned?" · Earned":" · Not yet earned"}`}><span className="journey-trophy-medal"><JourneyIcon size={compact?21:25}/>{!item.earned&&<span className="journey-trophy-lock"><JourneyIcon name="lock" size={9}/></span>}</span><strong>{item.label}</strong>{!compact&&<span>{item.description}</span>}<small>{item.earned?"Earned":"Not yet"}</small></div>)}</div>
    {compact&&<p className="profile-trophy-hint">Scroll to explore all {summary.achievements.length} trophies.</p>}
    {next&&<div className="journey-next-trophy"><div><span>Next: <strong>{next.label}</strong></span><span>{progressLabel}</span></div><progress value={Math.min(progress,next.target)} max={next.target} aria-label={`Progress toward ${next.label}`}/></div>}
    {!compact&&<p className="journey-reward-note">Earned trophies stay with you, even after a missed day.</p>}
  </section>;
}

export default function CodingJourney({ summary, today, startPractice, loading, signedIn, saveStatus, motionPaused }) {
  if (!summary || loading) return <section className="coding-journey journey-compact journey-loading" aria-label="Your coding journey" aria-busy="true"><p>Loading your streak…</p></section>;
  const monday = shiftActivityDay(today,-((new Date(`${today}T12:00:00Z`).getUTCDay()+6)%7));
  return <section className={`coding-journey journey-compact${motionPaused?" motion-paused":""}`} aria-label="Your coding journey">
    <div className="journey-momentum"><div className="journey-streak"><LiveStreakFlame streak={summary.currentStreak}/><div><div className="journey-streak-number"><strong>{summary.currentStreak}</strong><span>day streak</span></div><p>{summary.activeToday?"Today's practice logged":summary.currentStreak?"Keep it going today":summary.missedYesterday?"New day. Fresh start.":"Start with one session"}</p></div></div><div className="journey-week" aria-label="This week's practice"><div>{Array.from({length:7},(_,index)=>{const day=shiftActivityDay(monday,index),status=activityDayStatus(summary.activity,day,today);return <span className={`journey-week-day ${status}`} key={day} title={`${formatDate(day)} · ${status}`}><span>{weekLabels[index]}</span><i>{status==="active"?<JourneyIcon name="check" size={13}/>:day===today?<span className="journey-today-dot"/>:status==="missed"?"−":""}</i></span>;})}</div></div><div className="journey-compact-stats"><span><strong>{summary.bestStreak}</strong> best</span><span><strong>{summary.earned.length}/{summary.achievements.length}</strong> trophies</span><span><strong>{practiceTimeLabel(summary.seconds)}</strong> practice</span></div><button className="primary-button journey-start" onClick={startPractice}>Daily practice<JourneyIcon name="right" size={15}/></button></div>
    {summary.missedYesterday&&<p className="journey-return-note"><span><strong>{formatDate(shiftActivityDay(today,-1))}: no practice recorded.</strong> {summary.activeToday?"Your new streak is underway.":"Start again today."}</span></p>}
  </section>;
}

export function JourneyDetails({ summary, today, loading }) {
  if(!summary||!today||loading)return null;
  return <section className="home-journey-details" aria-label="Activity and trophies"><details className="journey-calendar-disclosure"><summary><JourneyIcon name="clock" size={18}/><span>Activity calendar</span><small>{summary.practiceDays} active days</small><JourneyIcon name="right" size={15}/></summary><PracticeCalendar summary={summary} today={today}/></details><details className="journey-trophy-disclosure"><summary><JourneyIcon size={18}/><span>All {summary.achievements.length} trophies</span><small>{summary.earned.length} earned</small><JourneyIcon name="right" size={15}/></summary><TrophyShelf summary={summary}/></details></section>;
}

export function MilestoneCelebration({ summary, identity, loading, motionPaused }) {
  const observed = useRef(null), [reward,setReward] = useState(null);
  const signature = summary?.earned.map(item=>item.id).join(",") || "";
  useEffect(()=>{
    if (!summary || loading) return;
    const previous = observed.current; observed.current={identity,ids:summary.earned.map(item=>item.id)};
    if (!previous || previous.identity!==identity) { setReward(null); return; }
    const earned=summary.earned.filter(item=>!previous.ids.includes(item.id));
    if (earned.length) setReward(earned.at(-1));
  },[identity,loading,signature]);
  useEffect(()=>{if(!reward)return;const timer=setTimeout(()=>setReward(null),6500);return()=>clearTimeout(timer);},[reward]);
  if(!reward)return null;
  return <aside className={`journey-celebration ${reward.tier}${motionPaused?" motion-paused":""}`} role="status" aria-live="polite"><span className="journey-celebration-icon"><JourneyIcon size={28}/></span><div><span className="eyebrow">NEW TROPHY UNLOCKED</span><strong>{reward.label}</strong><p>{reward.description}. That effort is yours to keep.</p></div><button aria-label="Dismiss trophy celebration" onClick={()=>setReward(null)}><JourneyIcon name="close" size={16}/></button><span className="journey-confetti" aria-hidden="true">{Array.from({length:8},(_,index)=><i key={index} style={{"--spark-angle":`${index*45}deg`,"--spark-delay":`${index*35}ms`}}/>)}</span></aside>;
}
