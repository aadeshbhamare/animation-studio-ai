const GATEWAY = "https://ai.gateway.lovable.dev/v1";
const CHAT_MODEL = "google/gemini-3-flash-preview";
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
  palette?: string;
  audio?: AudioProfile | null;
  lyrics?: string | null;
  showLyrics?: boolean;
};

const SYSTEM = `You are a world-class motion designer and creative coder. You output ONE self-contained HTML document that renders a beautiful, looping animation.

HARD RULES
- Output ONLY raw HTML. No markdown fences, no commentary.
- One file: <!doctype html> with inline <style> and <script>. No external requests, no CDN, no imports, no fetch. Google Fonts are NOT allowed; use system font stacks.
- Fill the viewport exactly: html,body{margin:0;height:100%;overflow:hidden;background:<scene bg>}. Canvas/SVG must resize with window and respect devicePixelRatio.
- 60fps via requestAnimationFrame. No libraries. Vanilla JS / CSS / SVG / Canvas2D / WebGL only.
- Must look designed: deliberate palette, depth, easing, staggering, grain/vignette/glow where appropriate. Never plain black-on-white default text.
- Must loop or evolve forever without freezing.

AUDIO REACTIVITY (always implement, harmless when silent)
The host posts messages to the iframe every frame:
  window.addEventListener('message', e => { const d = e.data; if (d && d.type === 'audio') { /* d.level, d.bass, d.mid, d.treble (0..1), d.beat (bool), d.time (sec), d.lyric (string|null) */ } })
Keep a smoothed copy of these values and drive scale, hue, displacement, particle spawn, camera shake and beat flashes with them. When no messages arrive, fall back to a synthetic sine-based pulse so the animation still lives.

LYRICS
If lyrics rendering is requested, render d.lyric as large kinetic typography with per-word entrance/exit motion, and hide it when null.`;

function buildUserPrompt(input: GenInput) {
  const parts: string[] = [];
  parts.push(`Creative brief: ${input.prompt}`);
  parts.push(`Primary animation technique: ${input.technique}. Commit to it fully.`);
  if (input.palette) parts.push(`Palette direction: ${input.palette}`);
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
      )} BPM and make beats visibly punch.`,
    );
  }
  if (input.lyrics) {
    parts.push(
      input.showLyrics
        ? `Lyrics are ON. Render the live d.lyric word/line as the hero typographic element. Full lyrics for tone reference: """${input.lyrics.slice(0, 1500)}"""`
        : `Lyrics exist but must NOT be rendered as text. Use their emotional tone only: """${input.lyrics.slice(0, 600)}"""`,
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
  if (fence) out = fence[1].trim();
  const idx = out.toLowerCase().indexOf("<!doctype");
  if (idx > 0) out = out.slice(idx);
  return out;
}

export async function generateAnimationHtml(input: GenInput) {
  const key = process.env["LOVABLE_API_KEY"];
  if (!key) throw new Error("Missing LOVABLE_API_KEY");

  const res = await fetch(`${GATEWAY}/chat/completions`, {
    method: "POST",
    headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      model: CHAT_MODEL,
      stream: true,
      messages: [
        { role: "system", content: SYSTEM },
        { role: "user", content: buildUserPrompt(input) },
      ],
    }),
  });

  if (!res.ok || !res.body) {
    const text = await res.text().catch(() => "");
    if (res.status === 429) throw new Error("Rate limited by Lovable AI. Try again in a moment.");
    if (res.status === 402) throw new Error("AI credits exhausted. Add credits to keep generating.");
    throw new Error(`AI request failed (${res.status}): ${text.slice(0, 200)}`);
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
