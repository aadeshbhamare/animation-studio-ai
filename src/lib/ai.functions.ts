import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

import {
  alignWordsServer,
  analyzeImageBase64,
  buildStoryboard,
  buildVisualDNA,
  generateAnimationHtml,
  runQualityCheck,
  transcribeAudioBase64,
} from "./animation-gen.server";
import type { ImageAsset, StoryboardScene, VisualDNA, WordCue, QualityReport } from "./project-types";

const audioProfileSchema = z.object({
  duration: z.number(),
  bpm: z.number(),
  key: z.string(),
  loudness: z.number(),
  energyCurve: z.array(z.number()),
  bands: z.object({ bass: z.number(), mid: z.number(), treble: z.number() }),
  beats: z.array(z.number()),
  mood: z.string(),
});

const imageSchema = z.object({
  id: z.string(),
  name: z.string(),
  url: z.string(),
  dataUrl: z.string(),
  width: z.number(),
  height: z.number(),
  orientation: z.string(),
  palette: z.array(z.string()),
  brightness: z.number(),
  contrast: z.number(),
  saturation: z.number(),
  role: z.string(),
  motion: z.string(),
  locked: z.boolean(),
  duration: z.number().nullable(),
  status: z.string(),
  subject: z.string(),
  objects: z.array(z.string()),
  faces: z.number(),
  style: z.string(),
  mood: z.string(),
  description: z.string(),
});

const generateSchema = z.object({
  prompt: z.string().min(3).max(2000),
  technique: z.string().min(1).max(120),
  styles: z.array(z.string()).max(20),
  palette: z.string().max(200).optional(),
  audio: audioProfileSchema.nullable().optional(),
  lyrics: z.string().max(8000).nullable().optional(),
  lyricMode: z.string().max(40),
  showLyrics: z.boolean(),
  images: z.array(imageSchema).max(50),
  directorMode: z.string().max(40),
  aspectRatio: z.string().max(20),
  duration: z.string().max(20),
  camera: z.string().max(40),
  transition: z.string().max(40),
  orderMode: z.string().max(40),
  preserveColors: z.boolean(),
});

export const generateAnimation = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => generateSchema.parse(data))
  .handler(async ({ data }) => ({ html: await generateAnimationHtml(data) }));

const transcribeSchema = z.object({
  base64: z.string().min(10),
  mimeType: z.string().max(100),
  fileName: z.string().max(200),
});

export const transcribeAudio = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => transcribeSchema.parse(data))
  .handler(async ({ data }) => ({
    text: await transcribeAudioBase64(data.base64, data.mimeType, data.fileName),
  }));

const analyzeImageSchema = z.object({
  base64: z.string().min(10),
  mimeType: z.string().max(100),
  fileName: z.string().max(200),
});

export const analyzeImage = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => analyzeImageSchema.parse(data))
  .handler(async ({ data }) => ({
    analysis: await analyzeImageBase64(data.base64, data.mimeType, data.fileName),
  }));

const storyboardSchema = z.object({
  prompt: z.string().max(2000),
  styles: z.array(z.string()).max(20),
  audio: audioProfileSchema.nullable().optional(),
  lyrics: z.string().max(8000).nullable().optional(),
  images: z.array(imageSchema).max(50),
  directorMode: z.string().max(40),
  duration: z.string().max(20),
});

export const createStoryboard = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => storyboardSchema.parse(data))
  .handler(async ({ data }) => ({
    scenes: (await buildStoryboard(data)) as StoryboardScene[],
  }));

const visualDnaSchema = z.object({
  images: z.array(imageSchema).max(50),
});

export const getVisualDNA = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => visualDnaSchema.parse(data))
  .handler(async ({ data }) => ({
    dna: (await buildVisualDNA(data.images)) as VisualDNA | null,
  }));

const qualitySchema = z.object({
  hasLyrics: z.boolean(),
  hasAudio: z.boolean(),
  hasImages: z.boolean(),
  lyricMode: z.string().max(40),
  html: z.string(),
  audio: audioProfileSchema.nullable().optional(),
});

export const qualityCheck = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => qualitySchema.parse(data))
  .handler(async ({ data }) => ({
    report: (await runQualityCheck(data)) as QualityReport,
  }));

const alignSchema = z.object({
  text: z.string().max(8000),
  duration: z.number(),
  beats: z.array(z.number()),
});

export const alignWords = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => alignSchema.parse(data))
  .handler(async ({ data }) => ({
    cues: (await alignWordsServer(data.text, data.duration, data.beats)) as WordCue[],
  }));
