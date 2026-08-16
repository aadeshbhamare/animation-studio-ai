export type AudioProfile = {
  duration: number;
  bpm: number;
  key: string;
  loudness: number;
  energyCurve: number[];
  bands: { bass: number; mid: number; treble: number };
  beats: number[];
  mood: string;
};

const NOTES = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];

/** Decode an uploaded file into a buffer using an offline-safe AudioContext. */
export async function decodeAudioFile(file: File): Promise<AudioBuffer> {
  const arrayBuffer = await file.arrayBuffer();
  const Ctx = window.AudioContext ?? (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
  const ctx = new Ctx();
  const buffer = await ctx.decodeAudioData(arrayBuffer.slice(0));
  void ctx.close();
  return buffer;
}

function movingAverage(values: number[], window: number) {
  const out: number[] = [];
  for (let i = 0; i < values.length; i++) {
    let sum = 0;
    let n = 0;
    for (let j = Math.max(0, i - window); j <= Math.min(values.length - 1, i + window); j++) {
      sum += values[j]!;
      n++;
    }
    out.push(sum / n);
  }
  return out;
}

/** Full offline analysis: tempo, onsets, spectral balance, loudness curve, key + mood guess. */
export function analyzeBuffer(buffer: AudioBuffer): AudioProfile {
  const data = buffer.getChannelData(0);
  const sr = buffer.sampleRate;
  const duration = buffer.duration;

  // --- RMS energy envelope (~86 frames per second) ---
  const hop = Math.max(256, Math.floor(sr / 86));
  const frames: number[] = [];
  for (let i = 0; i + hop < data.length; i += hop) {
    let sum = 0;
    for (let j = 0; j < hop; j++) sum += data[i + j]! * data[i + j]!;
    frames.push(Math.sqrt(sum / hop));
  }
  const framesPerSec = sr / hop;
  const peak = Math.max(...frames, 1e-6);
  const norm = frames.map((v) => v / peak);
  const loudness = norm.reduce((a, b) => a + b, 0) / Math.max(1, norm.length);

  // --- Onset detection: positive flux above a local adaptive threshold ---
  const smooth = movingAverage(norm, Math.round(framesPerSec * 0.35));
  const beats: number[] = [];
  let lastBeat = -1;
  for (let i = 1; i < norm.length; i++) {
    const flux = norm[i]! - norm[i - 1]!;
    const t = i / framesPerSec;
    if (flux > 0.045 && norm[i]! > smooth[i]! * 1.25 && t - lastBeat > 0.22) {
      beats.push(Number(t.toFixed(3)));
      lastBeat = t;
    }
  }

  // --- Tempo via inter-onset interval histogram folded into 70-180 BPM ---
  let bpm = 120;
  if (beats.length > 4) {
    const buckets = new Map<number, number>();
    for (let i = 1; i < beats.length; i++) {
      const interval = beats[i]! - beats[i - 1]!;
      if (interval <= 0.05) continue;
      let candidate = 60 / interval;
      while (candidate > 180) candidate /= 2;
      while (candidate < 70) candidate *= 2;
      const bucket = Math.round(candidate);
      buckets.set(bucket, (buckets.get(bucket) ?? 0) + 1);
    }
    let best = 120;
    let bestCount = 0;
    for (const [k, v] of buckets) {
      const neighborhood = v + (buckets.get(k - 1) ?? 0) + (buckets.get(k + 1) ?? 0);
      if (neighborhood > bestCount) {
        bestCount = neighborhood;
        best = k;
      }
    }
    bpm = best;
  }

  // --- Spectral balance + chroma from a Goertzel sweep on a mid-track window ---
  const winSize = Math.min(data.length, sr * 8);
  const start = Math.max(0, Math.floor((data.length - winSize) / 2));
  const chroma = new Array(12).fill(0);
  let bass = 0;
  let mid = 0;
  let treble = 0;
  const freqs: number[] = [];
  for (let f = 55; f < Math.min(8000, sr / 2); f *= Math.pow(2, 1 / 12)) freqs.push(f);
  const step = Math.max(1, Math.floor(winSize / 8192));
  for (const f of freqs) {
    const w = (2 * Math.PI * f * step) / sr;
    const coeff = 2 * Math.cos(w);
    let s0 = 0;
    let s1 = 0;
    let s2 = 0;
    for (let i = start; i < start + winSize; i += step) {
      s0 = data[i]! + coeff * s1 - s2;
      s2 = s1;
      s1 = s0;
    }
    const mag = Math.sqrt(s1 * s1 + s2 * s2 - coeff * s1 * s2) / (winSize / step);
    if (f < 250) bass += mag;
    else if (f < 2000) mid += mag;
    else treble += mag;
    const note = Math.round(12 * Math.log2(f / 440) + 9) % 12;
    chroma[(note + 12) % 12] = (chroma[(note + 12) % 12] ?? 0) + mag;
  }
  const total = bass + mid + treble || 1;
  const bands = { bass: bass / total, mid: mid / total, treble: treble / total };
  const keyIndex = chroma.indexOf(Math.max(...chroma));
  const minorish = (chroma[(keyIndex + 3) % 12] ?? 0) > (chroma[(keyIndex + 4) % 12] ?? 0);
  const key = `${NOTES[keyIndex]!} ${minorish ? "minor" : "major"}`;

  const energyCurve = Array.from({ length: 64 }, (_, i) => {
    const from = Math.floor((i / 64) * norm.length);
    const to = Math.floor(((i + 1) / 64) * norm.length);
    const slice = norm.slice(from, Math.max(to, from + 1));
    return Number((slice.reduce((a, b) => a + b, 0) / Math.max(1, slice.length)).toFixed(3));
  });

  const fast = bpm > 124;
  const bright = bands.treble > 0.25;
  const loud = loudness > 0.28;
  const mood = [
    fast ? (loud ? "driving and euphoric" : "quick and restless") : loud ? "heavy and cinematic" : "slow and intimate",
    bright ? "bright, airy top end" : "warm, dark low end",
    minorish ? "melancholic tonality" : "uplifting tonality",
  ].join(", ");

  return {
    duration,
    bpm,
    key,
    loudness: Number(loudness.toFixed(3)),
    energyCurve,
    bands: {
      bass: Number(bands.bass.toFixed(3)),
      mid: Number(bands.mid.toFixed(3)),
      treble: Number(bands.treble.toFixed(3)),
    },
    beats: beats.slice(0, 400),
    mood,
  };
}

/** Spread transcribed words across detected onsets so lyrics land on the beat. */
export function alignLyrics(text: string, profile: AudioProfile) {
  const words = text.split(/\s+/).filter(Boolean);
  if (!words.length) return [] as { time: number; end: number; text: string }[];

  const lines: string[] = [];
  let current: string[] = [];
  for (const w of words) {
    current.push(w);
    if (current.length >= 4) {
      lines.push(current.join(" "));
      current = [];
    }
  }
  if (current.length) lines.push(current.join(" "));

  const beatCount = profile.beats.length;
  const anchors =
    beatCount > lines.length
      ? lines.map((_, i) => profile.beats[Math.floor((i / lines.length) * beatCount)]!)
      : lines.map((_, i) => ((i + 0.5) / lines.length) * profile.duration);

  return lines.map((g, i) => ({
    text: g,
    time: anchors[i]!,
    end: i + 1 < anchors.length ? anchors[i + 1]! : profile.duration,
  }));
}

/** Word-level alignment: distribute individual words evenly across the track duration. */
export function alignWordsLocal(text: string, profile: AudioProfile) {
  const words = text.split(/\s+/).filter(Boolean);
  if (!words.length) return [];
  const perWord = profile.duration / words.length;
  return words.map((w, i) => ({
    word: w,
    start: Number((i * perWord).toFixed(3)),
    end: Number(((i + 1) * perWord).toFixed(3)),
    line: Math.floor(i / 4),
    confidence: 0.7,
  }));
}

export function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = String(reader.result);
      resolve(result.slice(result.indexOf(",") + 1));
    };
    reader.onerror = () => reject(new Error("Could not read the audio file"));
    reader.readAsDataURL(file);
  });
}
