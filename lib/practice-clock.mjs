// Count elapsed visible, focused practice after a recent editor interaction.
// Long gaps are capped so sleeping devices and throttled tabs add no idle hours.
export class PracticeClock {
  constructor(now = 0) { this.lastTick = now; this.activeUntil = 0; this.seconds = 0; this.day = null; }
  interact(now) { if (now >= this.activeUntil) this.lastTick = now; this.activeUntil = now + 60000; }
  tick(now, day, eligible) {
    const events = [];
    if (this.day && this.day !== day) { events.push(...this.flush()); this.seconds = 0; }
    this.day = day;
    if (eligible) this.seconds += Math.max(0, Math.min(2000, Math.min(now, this.activeUntil) - this.lastTick)) / 1000;
    this.lastTick = now;
    if (this.seconds >= 30 || !eligible || now >= this.activeUntil) events.push(...this.flush());
    return events;
  }
  flush() {
    const seconds = Math.min(60, Math.floor(this.seconds));
    if (!seconds || !this.day) return [];
    this.seconds -= seconds;
    return [{ type: "practice-time", day: this.day, seconds }];
  }
}
