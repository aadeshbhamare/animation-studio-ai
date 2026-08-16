import type {
  ImageAsset,
  QualityReport,
  StoryboardScene,
  VisualDNA,
  WordCue,
} from "./project-types";

const GATEWAY = "https://ai.gateway.lovable.dev/v1";
const CHAT_MODEL = "google/gemini-3-flash-preview";
const VISION_MODEL = "google/gemini-3-flash-preview";
const STT_MODEL = "openai/gpt-4o-transcribe";

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

export type GenInput = {
  prompt: string;
  technique: string;
  styles: string[];
  palette?: string | undefined;
  audio?: AudioProfile | null | undefined;
  lyrics?: string | null | undefined;
  lyricMode: string;
  showLyrics: boolean;
  images: ImageAsset[];
  directorMode: string;
  aspectRatio: string;
  duration: string;
  camera: string;
  transition: string;
  orderMode: string;
  preserveColors: boolean;
};

const SYSTEM = `You are a world-class motion designer and creative coder. You output ONE self-contained HTML document that renders a beautiful, looping animation.

HARD RULES
- Output ONLY raw HTML. No markdown fences, no commentary.
- One file: <!doctype html> with inline <style> and <script>. No external requests, no CDN, no imports, no fetch. Google Fonts are NOT allowed; use system font stacks.
- Fill the viewport exactly: html,body{margin:0;height:100%;overflow:hidden;background:<scene bg>}. Canvas/SVG must resize with window and respect devicePixelRatio.
- 60fps via requestAnimationFrame. No libraries. Vanilla JS / CSS / SVG / Canvas2D / WebGL only.
- Must look designed: deliberate palette, depth, easing, staggering, grain/vignette/glow where appropriate. Never plain black-on-white default text.
- Must loop or evolve forever without freezing.

ASPECT RATIO
If the brief specifies an aspect ratio other than 16:9, letterbox the animation inside a centered stage so the creative matches that ratio on any screen. For 9:16 and 4:5, render a tall portrait stage; for 21:9, a wide cinemascope bar.

IMAGE ASSETS
Some uploaded images may be provided as data URLs. Use them as layered elements in the scene — backgrounds, characters, objects — with parallax, depth, masking, blend modes and camera movement. Never just slideshow them. Combine multiple images into one coherent composition when the brief asks for it. If no images are provided, generate all visuals procedurally.

AUDIO REACTIVITY (always implement, harmless when silent)
The host posts messages to the iframe every frame:
  window.addEventListener('message', e => { const d = e.data; if (d && d.type === 'audio') { /* d.level, d.bass, d.mid, d.treble (0..1), d.beat (bool), d.time (sec), d.lyric (string|null) */ } })
Keep a smoothed copy of these values and drive scale, hue, displacement, particle spawn, camera shake and beat flashes with them. When no messages arrive, fall back to a synthetic sine-based pulse so the animation still lives.

LYRICS
If lyrics rendering is requested, render d.lyric as large kinetic typography with per-word entrance/exit motion, and hide it when null. The lyric mode tells you how: "word" = one word at a time, "line" = full line, "karaoke" = highlight the current word within the line, "keyword" = only emphasise important words, "typography" = expressive AI-designed type, "bilingual" = original plus a translation line. Never invent lyrics — only show what arrives in d.lyric.`;

function buildUserPrompt(input: GenInput) {
  const parts: string[] = [];
  parts.push(`Creative brief: ${input.prompt}`);
  parts.push(`Primary animation technique: ${input.technique}. Commit to it fully.`);
  if (input.styles.length > 0) {
    parts.push(
      `Additional selected styles to blend: ${input.styles.join(", ")}. Maintain visual consistency across style changes — consistent characters, objects, colour and lighting.`,
    );
  }
  if (input.palette) parts.push(`Palette direction: ${input.palette}`);
  if (input.aspectRatio) parts.push(`Target aspect ratio: ${input.aspectRatio}.`);
  if (input.camera && input.camera !== "ai")
    parts.push(`Camera movement: ${input.camera}.`);
  if (input.transition && input.transition !== "ai")
    parts.push(`Preferred transition style: ${input.transition}.`);
  if (input.directorMode === "auto")
    parts.push("AI Director mode: AUTO — you decide scene order, image placement, durations, and transitions.");
  else if (input.directorMode === "guided")
    parts.push("AI Director mode: GUIDED — make strong suggestions a user can override; keep the composition clear and editable.");
  else parts.push("AI Director mode: MANUAL — follow the user's explicit instructions precisely.");
  if (input.orderMode && input.orderMode !== "hybrid")
    parts.push(`Image ordering: ${input.orderMode}.`);
  if (input.preserveColors)
    parts.push("Preserve original image colours — do not aggressively colour-grade.");
  if (input.duration && input.duration !== "ai") {
    if (input.duration === "audio") parts.push("Duration: match the uploaded audio length.");
    else parts.push(`Duration: approximately ${input.duration} seconds.`);
  }

  if (input.images.length > 0) {
    const imgDesc = input.images
      .map(
        (im, i) =>
          `IMG${String(i + 1).padStart(2, "0")}: role=${im.role}, subject="${im.subject}", objects=[${im.objects.join(", ")}], mood="${im.mood}", style="${im.style}", motion=${im.motion}`,
      )
      .join("\n");
    parts.push(`Uploaded images (use these data URLs as <img src="..."> in the document):\n${imgDesc}`);
  }

  if (input.audio) {
    const a = input.audio;
    parts.push(
      `This animation is synced to an uploaded track. Analysis: duration ${a.duration.toFixed(
        1,
      )}s, tempo ~${Math.round(a.bpm)} BPM, perceived key ${a.key}, average loudness ${a.loudness.toFixed(
        2,
      )}, spectral balance bass ${a.bands.bass.toFixed(2)} / mid ${a.bands.mid.toFixed(
        2,
      )} / treble ${a.bands.treble.toFixed(2)}, mood: ${a.mood}. Design the motion rhythm around ${Math.round(
        a.bpm,
      )} BPM and make beats visibly punch. React to kicks, snares, bass, drops, choruses and energy changes.`,
    );
  }
  if (input.lyrics) {
    const modeNote =
      input.lyricMode === "none"
        ? "Lyrics must NOT be rendered as text. Use their emotional tone only."
        : `Lyric display mode: ${input.lyricMode}.`;
    parts.push(
      `${modeNote} Full lyrics for tone reference and timing: """${input.lyrics.slice(0, 1500)}"""`,
    );
  } else {
    parts.push("No lyrics: still handle d.lyric gracefully if it ever arrives.");
  }
  parts.push("Return the complete HTML document now.");
  return parts.join("\n\n");
}

function extractHtml(raw: string) {
  let out = raw.trim();
  const fence = out.match(/```(?:html)?\s*([\s\S]*?)```/i);
  if (fence?.[1]) out = fence[1].trim();
  const idx = out.toLowerCase().indexOf("<!doctype");
  if (idx > 0) out = out.slice(idx);
  return out;
}

async function chat(messages: { role: string; content: string }[], stream = false) {
  const key = process.env["LOVABLE_API_KEY"];
  if (!key) throw new Error("Missing LOVABLE_API_KEY");

  const res = await fetch(`${GATEWAY}/chat/completions`, {
    method: "POST",
    headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
    body: JSON.stringify({ model: CHAT_MODEL, stream, messages }),
  });

  if (!res.ok || !res.body) {
    const text = await res.text().catch(() => "");
    if (res.status === 429) throw new Error("Rate limited by Lovable AI. Try again in a moment.");
    if (res.status === 402) throw new Error("AI credits exhausted. Add credits to keep generating.");
    throw new Error(`AI request failed (${res.status}): ${text.slice(0, 200)}`);
  }

  if (!stream) {
    const json = (await res.json()) as { choices?: { message?: { content?: string } }[] };
    return json.choices?.[0]?.message?.content ?? "";
  }

  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";
  let content = "";
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split("\n");
    buffer = lines.pop() ?? "";
    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed.startsWith("data:")) continue;
      const data = trimmed.slice(5).trim();
      if (!data || data === "[DONE]") continue;
      try {
        const json = JSON.parse(data);
        content += json.choices?.[0]?.delta?.content ?? "";
      } catch {
        /* partial chunk */
      }
    }
  }
  return content;
}

export async function generateAnimationHtml(input: GenInput) {
  const content = await chat(
    [
      { role: "system", content: SYSTEM },
      { role: "user", content: buildUserPrompt(input) },
    ],
    true,
  );
  const html = extractHtml(content);
  if (!html || html.length < 100) throw new Error("The model returned an empty animation. Try again.");
  return html;
}

export async function transcribeAudioBase64(base64: string, mimeType: string, fileName: string) {
  const key = process.env["LOVABLE_API_KEY"];
  if (!key) throw new Error("Missing LOVABLE_API_KEY");

  const binary = Uint8Array.from(atob(base64), (c) => c.charCodeAt(0));
  const form = new FormData();
  form.append("file", new Blob([binary], { type: mimeType || "audio/mpeg" }), fileName || "audio.mp3");
  form.append("model", STT_MODEL);

  const res = await fetch(`${GATEWAY}/audio/transcriptions`, {
    method: "POST",
    headers: { Authorization: `Bearer ${key}` },
    body: form,
  });
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    if (res.status === 429) throw new Error("Rate limited while transcribing. Try again shortly.");
    if (res.status === 402) throw new Error("AI credits exhausted.");
    throw new Error(`Transcription failed (${res.status}): ${text.slice(0, 200)}`);
  }
  const json = (await res.json()) as { text?: string };
  return (json.text ?? "").trim();
}

export async function analyzeImageBase64(
  base64: string,
  mimeType: string,
  fileName: string,
): Promise<Partial<ImageAsset>> {
  const dataUrl = `data:${mimeType || "image/jpeg"};base64,${base64}`;
  const content = await chat(
    [
      {
        role: "user",
        content: [
          {
            type: "text",
            text: `Analyze this uploaded image for an AI animation studio. Return ONLY a compact JSON object with keys: subject (one short phrase), objects (array of short strings), faces (integer count), style (short phrase), mood (short phrase), description (one sentence), role (one of: character, background, object, product, logo, texture, reference), motion (one of: ai, slow-zoom, zoom-out, pan-left, pan-right, pan-up, pan-down, parallax, depth-3d, rotate, float, shake, beat-pulse, particle-reveal, morph). File name: ${fileName}`,
          },
          { type: "image_url", image_url: { url: dataUrl } },
        ],
      } as never,
    ],
    false,
  );
  const jsonMatch = content.match(/\{[\s\S]*\}/);
  if (!jsonMatch) return {};
  try {
    return JSON.parse(jsonMatch[0]) as Partial<ImageAsset>;
  } catch {
    return {};
  }
}

export async function buildStoryboard(input: {
  prompt: string;
  styles: string[];
  audio?: AudioProfile | null;
  lyrics?: string | null;
  images: ImageAsset[];
  directorMode: string;
  duration: string;
}): Promise<StoryboardScene[]> {
  const parts: string[] = [];
  parts.push(`Create a storyboard as a JSON array for this animation project.`);
  parts.push(`Brief: ${input.prompt}`);
  if (input.styles.length) parts.push(`Styles: ${input.styles.join(", ")}`);
  if (input.audio)
    parts.push(
      `Audio: ${input.audio.duration.toFixed(1)}s, ${Math.round(input.audio.bpm)} BPM, ${input.audio.key}, mood: ${input.audio.mood}, ${input.audio.beats.length} beats.`,
    );
  if (input.lyrics) parts.push(`Lyrics excerpt: """${input.lyrics.slice(0, 800)}"""`);
  if (input.images.length)
    parts.push(
      `Images: ${input.images.map((im, i) => `IMG${String(i + 1).padStart(2, "0")}(${im.role})`).join(", ")}`,
    );
  if (input.duration && input.duration !== "ai")
    parts.push(`Total duration: ${input.duration === "audio" ? "match audio" : input.duration + "s"}`);
  parts.push(
    `Return ONLY a JSON array. Each scene: {title, start, duration, description, styleId, cameraId, transitionId, imageIds (array of IMG## strings), lyric, emotion, section, palette (array of hex colors)}. Cover the full timeline.`,
  );

  const content = await chat([{ role: "user", content: parts.join("\n") }], false);
  const jsonMatch = content.match(/\[[\s\S]*\]/);
  if (!jsonMatch) return [];
  try {
    const arr = JSON.parse(jsonMatch[0]) as Omit<StoryboardScene, "id" | "locked">[];
    return arr.map((s) => ({
      ...s,
      id: Math.random().toString(36).slice(2, 10),
      locked: false,
      imageIds: s.imageIds ?? [],
      palette: s.palette ?? [],
    }));
  } catch {
    return [];
  }
}

export async function buildVisualDNA(images: ImageAsset[]): Promise<VisualDNA | null> {
  if (!images.length) return null;
  const content = await chat(
    [
      {
        role: "user",
        content: `Given these image palettes: ${images
          .map((im) => `[${im.palette.join(", ")}]`)
          .join("; ")}. Return ONLY a JSON object with keys: primary, secondary, accent, background, highlight (all hex colors), contrast (0..1 number), saturation (0..1 number). Harmonize across all images.`,
      },
    ],
    false,
  );
  const jsonMatch = content.match(/\{[\s\S]*\}/);
  if (!jsonMatch) return null;
  try {
    return JSON.parse(jsonMatch[0]) as VisualDNA;
  } catch {
    return null;
  }
}

export async function runQualityCheck(input: {
  hasLyrics: boolean;
  hasAudio: boolean;
  hasImages: boolean;
  lyricMode: string;
  html: string;
  audio?: AudioProfile | null;
}): Promise<QualityReport> {
  const checks = input.html
    ? [
        { label: "Animation code present", status: "pass" as const, detail: `${input.html.length} chars generated` },
        {
          label: "Audio reactivity wired",
          status: input.html.includes("message") ? ("pass" as const) : ("warn" as const),
          detail: input.html.includes("message") ? "postMessage listener found" : "No audio listener detected",
        },
        {
          label: "Lyrics handling",
          status: input.lyricMode === "none" || input.html.includes("lyric") ? ("pass" as const) : ("warn" as const),
          detail:
            input.lyricMode === "none"
              ? "Lyrics off by choice"
              : input.html.includes("lyric")
                ? "Lyric rendering detected"
                : "No lyric rendering found",
        },
        {
          label: "Beat sync",
          status: input.html.includes("beat") ? ("pass" as const) : ("warn" as const),
          detail: input.html.includes("beat") ? "Beat variable referenced" : "Beat not referenced in code",
        },
        {
          label: "Image usage",
          status: !input.hasImages
            ? ("pass" as const)
            : input.html.includes("data:image") || input.html.includes("<img")
              ? ("pass" as const)
              : ("warn" as const),
          detail: !input.hasImages
            ? "No images uploaded"
            : input.html.includes("data:image") || input.html.includes("<img")
              ? "Images embedded in scene"
              : "Images uploaded but not embedded",
        },
        {
          label: "Resolution / aspect",
          status: input.html.includes("devicePixelRatio") ? ("pass" as const) : ("warn" as const),
          detail: input.html.includes("devicePixelRatio") ? "DPR-aware canvas" : "May not be DPR-aware",
        },
        {
          label: "Audio analysis",
          status: input.hasAudio ? ("pass" as const) : ("warn" as const),
          detail: input.hasAudio && input.audio ? `${Math.round(input.audio.bpm)} BPM detected` : "No audio uploaded",
        },
        {
          label: "Lyrics detected",
          status: input.hasLyrics ? ("pass" as const) : ("warn" as const),
          detail: input.hasLyrics ? "Vocals transcribed" : "No vocals / instrumental",
        },
      ]
    : [{ label: "Generation", status: "fail" as const, detail: "No animation produced" }];

  const score = Math.round(
    (checks.reduce((acc, c) => acc + (c.status === "pass" ? 1 : c.status === "warn" ? 0.5 : 0), 0) /
      Math.max(1, checks.length)) *
      100,
  );
  return { score, checks };
}

export async function alignWordsServer(
  text: string,
  duration: number,
  beats: number[],
): Promise<WordCue[]> {
  const words = text.split(/\s+/).filter(Boolean);
  if (!words.length) return [];
  const content = await chat(
    [
      {
        role: "user",
        content: `Distribute these lyrics across ${duration.toFixed(1)} seconds. Words: """${text.slice(0, 1000)}""". Beats (seconds): ${beats.slice(0, 60).join(", ")}. Return ONLY a JSON array of {word, start, end, line, confidence}. Cover the full duration evenly. line is the line number (0-indexed).`,
      },
    ],
    false,
  );
  const jsonMatch = content.match(/\[[\s\S]*\]/);
  if (!jsonMatch) return [];
  try {
    return JSON.parse(jsonMatch[0]) as WordCue[];
  } catch {
    return [];
  }
}
