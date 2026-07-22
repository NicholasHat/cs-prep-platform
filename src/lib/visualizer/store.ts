import { create } from "zustand";
import type { Frame } from "./types";

interface PlaybackState {
  frames: Frame[];
  cursor: number;
  playing: boolean;
  /** Frames per second. */
  speed: number;
  load: (frames: Frame[]) => void;
  play: () => void;
  pause: () => void;
  toggle: () => void;
  stepForward: () => void;
  stepBack: () => void;
  seek: (cursor: number) => void;
  reset: () => void;
  setSpeed: (speed: number) => void;
  /** Advance one frame during playback; pauses at the end. */
  tick: () => void;
}

export const usePlayback = create<PlaybackState>((set, get) => ({
  frames: [],
  cursor: 0,
  playing: false,
  speed: 4,

  load: (frames) => set({ frames, cursor: 0, playing: false }),
  play: () => {
    const { cursor, frames } = get();
    // Restart from the top if play is hit at the end.
    set({ playing: true, cursor: cursor >= frames.length - 1 ? 0 : cursor });
  },
  pause: () => set({ playing: false }),
  toggle: () => (get().playing ? get().pause() : get().play()),
  stepForward: () =>
    set((s) => ({
      playing: false,
      cursor: Math.min(s.cursor + 1, s.frames.length - 1),
    })),
  stepBack: () =>
    set((s) => ({ playing: false, cursor: Math.max(s.cursor - 1, 0) })),
  seek: (cursor) =>
    set((s) => ({
      playing: false,
      cursor: Math.max(0, Math.min(cursor, s.frames.length - 1)),
    })),
  reset: () => set({ cursor: 0, playing: false }),
  setSpeed: (speed) => set({ speed }),
  tick: () =>
    set((s) => {
      if (!s.playing) return s;
      if (s.cursor >= s.frames.length - 1) return { ...s, playing: false };
      return { ...s, cursor: s.cursor + 1 };
    }),
}));
