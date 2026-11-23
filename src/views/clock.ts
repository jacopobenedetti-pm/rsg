/**
 * Orologio condiviso tra le viste: un unico tempo di simulazione, riproduzione a velocità variabile.
 */
import { useSyncExternalStore } from 'react';

export class Clock {
  t = 0;
  duration = 10;
  playing = false;
  rate = 1;
  private listeners = new Set<() => void>();
  private raf = 0;
  private last = 0;

  subscribe = (fn: () => void) => {
    this.listeners.add(fn);
    return () => {
      this.listeners.delete(fn);
    };
  };

  private emit() {
    this.listeners.forEach((l) => l());
  }

  set(t: number) {
    this.t = Math.max(0, Math.min(this.duration, t));
    this.emit();
  }

  setDuration(d: number) {
    this.duration = d;
    if (this.t > d) this.t = d;
    this.emit();
  }

  setRate(r: number) {
    this.rate = r;
    this.emit();
  }

  play() {
    if (this.playing) return;
    if (this.t >= this.duration - 1e-3) this.t = 0;
    this.playing = true;
    this.last = performance.now();
    const tick = (now: number) => {
      if (!this.playing) return;
      const dt = Math.min(0.1, (now - this.last) / 1000);
      this.last = now;
      this.t = Math.min(this.duration, this.t + dt * this.rate);
      if (this.t >= this.duration) this.playing = false;
      this.emit();
      if (this.playing) this.raf = requestAnimationFrame(tick);
    };
    this.raf = requestAnimationFrame(tick);
    this.emit();
  }

  pause() {
    this.playing = false;
    cancelAnimationFrame(this.raf);
    this.emit();
  }

  toggle() {
    if (this.playing) this.pause();
    else this.play();
  }

  dispose() {
    this.pause();
    this.listeners.clear();
  }
}

export function useClockTime(clock: Clock) {
  return useSyncExternalStore(clock.subscribe, () => clock.t);
}

export function useClockState(clock: Clock) {
  const t = useSyncExternalStore(clock.subscribe, () => clock.t);
  const playing = useSyncExternalStore(clock.subscribe, () => clock.playing);
  const rate = useSyncExternalStore(clock.subscribe, () => clock.rate);
  return { t, playing, rate };
}
