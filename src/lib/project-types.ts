import type { AudioProfile } from "./audio-analysis";

export type AudioKind = "music" | "vocals" | "voiceover" | "sfx" | "ambience";

export type SongSection = {
  name: string;
  start: number;
  end: number;
  energy: number;
};

export type AudioTrack = {
  id: string;
  name: string;
  url: string;
  kind: AudioKind;
  volume: number;
  muted: boolean;
  solo: boolean;
  loop: boolean;
  offset: number;
  trimStart: number;
  trimEnd: number;
  fadeIn: number;
  fadeOut: number;
  profile: AudioProfile | null;
  sections: SongSection[];
  transcript: string;
  language: string;
  confidence: number;
  status: "pending" | "analyzing" | "ready" | "error";
  statusDetail: string;
};

export type ImageRole =
  | "character"
  | "background"
  | "object"
  | "product"
  | "logo"
  | "texture"
  | "reference";

export type ImageAsset = {
  id: string;
  name: string;
  url: string;
  /** Downscaled JPEG data URL, safe to inject into the sandboxed stage. */
  dataUrl: string;
  width: number;
  height: number;
  orientation: "landscape" | "portrait" | "square";
  palette: string[];
  brightness: number;
  contrast: number;
  saturation: number;
  role: ImageRole;
  motion: string;
  locked: boolean;
  duration: number | null;
  status: "pending" | "analyzing" | "ready" | "error";
  subject: string;
  objects: string[];
  faces: number;
  style: string;
  mood: string;
  description: string;
};

export type StoryboardScene = {
  id: string;
  title: string;
  start: number;
  duration: number;
  description: string;
  styleId: string;
  cameraId: string;
  transitionId: string;
  imageIds: string[];
  lyric: string;
  emotion: string;
  section: string;
  palette: string[];
  locked: boolean;
};

export type VisualDNA = {
  primary: string;
  secondary: string;
  accent: string;
  background: string;
  highlight: string;
  contrast: number;
  saturation: number;
};

export type WordCue = {
  word: string;
  start: number;
  end: number;
  line: number;
  confidence: number;
};

export type LyricLine = {
  text: string;
  start: number;
  end: number;
  words: WordCue[];
};

export type LyricSource = "ai" | "user" | "lrc" | "srt" | "txt" | "none";

export type QualityCheck = {
  label: string;
  status: "pass" | "warn" | "fail";
  detail: string;
};

export type QualityReport = {
  score: number;
  checks: QualityCheck[];
};

export type ProjectVersion = {
  id: string;
  label: string;
  createdAt: number;
  html: string;
  prompt: string;
  styles: string[];
  sceneCount: number;
};

export const uid = () => Math.random().toString(36).slice(2, 10);
