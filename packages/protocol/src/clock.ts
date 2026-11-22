export type Cancel = () => void;

/**
 * A source of time. The protocol's timing (50 Hz setpoints and status, the
 * 100 ms silence rule) runs on a clock, so tests can run it on simulated time
 * and the bench on real time.
 */
export interface Clock {
  /** Milliseconds. Only differences are meaningful. */
  now(): number;
  setTimeout(callback: () => void, ms: number): Cancel;
  setInterval(callback: () => void, ms: number): Cancel;
  sleep(ms: number): Promise<void>;
}

/** Real time. */
export const systemClock: Clock = {
  now: () => performance.now(),
  setTimeout(callback, ms) {
    const handle = setTimeout(callback, ms);
    return () => clearTimeout(handle);
  },
  setInterval(callback, ms) {
    const handle = setInterval(callback, ms);
    return () => clearInterval(handle);
  },
  sleep: (ms) => new Promise((resolve) => setTimeout(resolve, ms)),
};

type Timer = { due: number; period: number | undefined; callback: () => void; order: number; cancelled: boolean };

/**
 * Simulated time that only moves when someone sleeps. Sleeping runs every
 * timer that falls due, in time order, so a whole bus of simulated nodes runs
 * deterministically and much faster than real time. Timers due at the same
 * moment run in the order they were created.
 */
export class ManualClock implements Clock {
  #now: number;
  #timers: Timer[] = [];
  #order = 0;

  constructor(start = 0) {
    this.#now = start;
  }

  now(): number {
    return this.#now;
  }

  setTimeout(callback: () => void, ms: number): Cancel {
    return this.#add(callback, ms, undefined);
  }

  setInterval(callback: () => void, ms: number): Cancel {
    if (!(ms > 0)) throw new RangeError("interval must be positive");
    return this.#add(callback, ms, ms);
  }

  async sleep(ms: number): Promise<void> {
    this.advance(ms);
  }

  /** Moves time forward by `ms`, running every timer that falls due. */
  advance(ms: number): void {
    const end = this.#now + Math.max(0, ms);
    for (;;) {
      const next = this.#nextDue(end);
      if (!next) break;
      this.#now = next.due;
      if (next.period === undefined) {
        next.cancelled = true;
      } else {
        next.due += next.period;
      }
      next.callback();
      this.#timers = this.#timers.filter((t) => !t.cancelled);
    }
    this.#now = end;
  }

  #add(callback: () => void, ms: number, period: number | undefined): Cancel {
    const timer: Timer = { due: this.#now + Math.max(0, ms), period, callback, order: this.#order++, cancelled: false };
    this.#timers.push(timer);
    return () => {
      timer.cancelled = true;
    };
  }

  #nextDue(end: number): Timer | undefined {
    let best: Timer | undefined;
    for (const t of this.#timers) {
      if (t.cancelled || t.due > end) continue;
      if (!best || t.due < best.due || (t.due === best.due && t.order < best.order)) best = t;
    }
    return best;
  }
}
