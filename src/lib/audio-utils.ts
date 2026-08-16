import type { AudioProfile } from "@/lib/audio-analysis";

export type AudioTrack = {
  id: string;
  fileName: string;
  fileUrl: string;
  role?: string;
  profile?: AudioProfile | null;
  transcript?: string;
  muted?: boolean;
  volume?: number;
};

/**
 * Merge multiple audio profiles into a simple master profile.
 * Strategy: prefer the longest duration profile, average BPM, merge & dedupe beats, and average energy curves.
 */
export function mergeAudioProfiles(profiles: (AudioProfile | null | undefined)[]): AudioProfile | null {
  const list = profiles.filter(Boolean) as AudioProfile[];
  if (!list.length) return null;
  if (list.length === 1) return list[0]!;

  // Pick longest duration as base
  let base = list.reduce((a, b) => (b.duration > a.duration ? b : a));

  // Average BPM weighted by duration
  const totalDur = list.reduce((s, p) => s + p.duration, 0);
  const bpm = Math.round(list.reduce((s, p) => s + p.bpm * p.duration, 0) / totalDur);

  // Merge beats: concat, sort and unique within 5ms
  const beats = Array.from(new Set(list.flatMap((p) => p.beats))).sort((a, b) => a - b);

  // Deduplicate near-equal beats
  const dedup: number[] = [];
  for (const b of beats) {
    if (!dedup.length || Math.abs(dedup[dedup.length - 1]! - b) > 0.005) dedup.push(b);
  }

  // Average energyCurve to length 64
  const len = 64;
  const summed = new Array(len).fill(0);
  for (const p of list) {
    for (let i = 0; i < len; i++) summed[i]! += p.energyCurve[i] ?? 0;
  }
  const energyCurve = summed.map((v) => Number((v / list.length).toFixed(3)));

  const bands = {
    bass: Number((list.reduce((s, p) => s + p.bands.bass, 0) / list.length).toFixed(3)),
    mid: Number((list.reduce((s, p) => s + p.bands.mid, 0) / list.length).toFixed(3)),
    treble: Number((list.reduce((s, p) => s + p.bands.treble, 0) / list.length).toFixed(3)),
  };

  const loudness = Number((list.reduce((s, p) => s + p.loudness, 0) / list.length).toFixed(3));
  const key = base.key;
  const mood = list.map((p) => p.mood).join(" · ");

  return {
    duration: Math.max(...list.map((p) => p.duration)),
    bpm,
    key,
    loudness,
    energyCurve,
    bands,
    beats: dedup.slice(0, 200),
    mood,
  };
}

export function snapToNearestBeat(time: number, beats: number[], threshold = 0.15) {
  if (!beats || beats.length === 0) return time;
  let best = beats[0]!;
  let dist = Math.abs(best - time);
  for (const b of beats) {
    const d = Math.abs(b - time);
    if (d < dist) {
      dist = d;
      best = b;
    }
  }
  return dist <= threshold ? best : time;
}
