import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

import { generateAnimationHtml, transcribeAudioBase64 } from "./animation-gen.server";

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

const generateSchema = z.object({
  prompt: z.string().min(3).max(2000),
  technique: z.string().min(1).max(120),
  palette: z.string().max(200).optional(),
  audio: audioProfileSchema.nullable().optional(),
  lyrics: z.string().max(8000).nullable().optional(),
  showLyrics: z.boolean().optional(),
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
