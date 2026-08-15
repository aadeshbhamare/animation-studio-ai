import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { AudioLines, Music4, Sparkles, Upload, Wand2, X } from "lucide-react";
import { useMemo, useRef, useState } from "react";
import { toast } from "sonner";

import { AnimationStage, type LyricCue } from "@/components/AnimationStage";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { generateAnimation, transcribeAudio } from "@/lib/ai.functions";
import {
  alignLyrics,
  analyzeBuffer,
  decodeAudioFile,
  fileToBase64,
  type AudioProfile,
} from "@/lib/audio-analysis";
import { EXAMPLE_PROMPTS, PALETTES, TECHNIQUES } from "@/lib/animation-types";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Motion Forge — prompt-to-animation studio" },
      {
        name: "description",
        content:
          "Turn a sentence into a running animation, or upload a song and get a beat-, mood- and lyric-synced music visual.",
      },
      { property: "og:title", content: "Motion Forge — prompt-to-animation studio" },
      {
        property: "og:description",
        content: "AI-directed animations across 40+ techniques, with full audio analysis and lyric transcription.",
      },
    ],
  }),
  component: Studio,
});

function Studio() {
  const generate = useServerFn(generateAnimation);
  const transcribe = useServerFn(transcribeAudio);

  const [prompt, setPrompt] = useState("");
  const [technique, setTechnique] = useState("particle-system");
  const [palette, setPalette] = useState("auto");
  const [html, setHtml] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const [file, setFile] = useState<File | null>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [profile, setProfile] = useState<AudioProfile | null>(null);
  const [analyzing, setAnalyzing] = useState<string | null>(null);
  const [lyrics, setLyrics] = useState("");
  const [showLyrics, setShowLyrics] = useState(true);
  const inputRef = useRef<HTMLInputElement>(null);

  const techniqueLabel = useMemo(() => {
    for (const g of TECHNIQUES) {
      const found = g.items.find((i) => i.id === technique);
      if (found) return `${found.label} — ${found.hint}`;
    }
    return technique;
  }, [technique]);

  const cues: LyricCue[] = useMemo(
    () => (profile && lyrics.trim() ? alignLyrics(lyrics, profile) : []),
    [lyrics, profile],
  );

  const handleFile = async (picked: File) => {
    setFile(picked);
    setAudioUrl((prev) => {
      if (prev) URL.revokeObjectURL(prev);
      return URL.createObjectURL(picked);
    });
    try {
      setAnalyzing("Decoding and analysing the waveform…");
      const buffer = await decodeAudioFile(picked);
      const result = analyzeBuffer(buffer);
      setProfile(result);
      setAnalyzing("Listening for vocals and lyrics…");
      const base64 = await fileToBase64(picked);
      const { text } = await transcribe({
        data: { base64, mimeType: picked.type || "audio/mpeg", fileName: picked.name },
      });
      if (text) {
        setLyrics(text);
        toast.success("Track analysed", { description: `${Math.round(result.bpm)} BPM · ${result.key} · lyrics detected` });
      } else {
        toast.success("Track analysed", { description: `${Math.round(result.bpm)} BPM · ${result.key} · instrumental` });
      }
    } catch (err) {
      toast.error("Audio analysis problem", { description: err instanceof Error ? err.message : "Unknown error" });
    } finally {
      setAnalyzing(null);
    }
  };

  const clearAudio = () => {
    if (audioUrl) URL.revokeObjectURL(audioUrl);
    setFile(null);
    setAudioUrl(null);
    setProfile(null);
    setLyrics("");
  };

  const run = async () => {
    const brief = prompt.trim() || (profile ? "A music visual that embodies this track" : "");
    if (!brief) {
      toast.error("Describe the animation you want first");
      return;
    }
    setLoading(true);
    try {
      const { html: result } = await generate({
        data: {
          prompt: brief,
          technique: techniqueLabel,
          palette: palette === "auto" ? undefined : PALETTES.find((p) => p.id === palette)?.label,
          audio: profile,
          lyrics: lyrics.trim() ? lyrics.trim() : null,
          showLyrics,
        },
      });
      setHtml(result);
      toast.success("Animation ready");
    } catch (err) {
      toast.error("Generation failed", { description: err instanceof Error ? err.message : "Unknown error" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="mx-auto flex min-h-screen max-w-[1600px] flex-col gap-6 px-4 py-6 lg:px-8">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-[0.35em] text-muted-foreground">Motion Forge</p>
          <h1 className="mt-2 text-3xl font-semibold sm:text-4xl">
            Prompt it. <span className="ember-text">Watch it move.</span>
          </h1>
          <p className="mt-2 max-w-xl text-sm text-muted-foreground">
            AI directs a real, code-based animation across 40+ industry techniques — and syncs it to your track&apos;s
            tempo, mood and lyrics.
          </p>
        </div>
        <Button size="lg" className="ember-fill" onClick={run} disabled={loading}>
          <Wand2 />
          {loading ? "Directing…" : "Generate animation"}
        </Button>
      </header>

      <div className="grid flex-1 gap-6 lg:grid-cols-[minmax(0,380px)_minmax(0,1fr)]">
        <ScrollArea className="max-h-[calc(100vh-190px)] rounded-xl border border-border bg-card/60">
          <div className="flex flex-col gap-6 p-5">
            <section className="flex flex-col gap-3">
              <Label className="flex items-center gap-2 text-sm">
                <Sparkles className="size-4 text-primary" /> Your brief
              </Label>
              <Textarea
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                rows={4}
                placeholder="Describe the scene, mood, subject and motion you want…"
                className="resize-none bg-background/60"
              />
              <div className="flex flex-wrap gap-1.5">
                {EXAMPLE_PROMPTS.map((p) => (
                  <button
                    key={p}
                    type="button"
                    onClick={() => setPrompt(p)}
                    className="rounded-full border border-border px-2.5 py-1 text-left text-[11px] text-muted-foreground transition-colors hover:border-primary hover:text-foreground"
                  >
                    {p.length > 42 ? `${p.slice(0, 42)}…` : p}
                  </button>
                ))}
              </div>
            </section>

            <section className="flex flex-col gap-3">
              <Label className="text-sm">Animation technique</Label>
              <div className="flex flex-col gap-3">
                {TECHNIQUES.map((group) => (
                  <div key={group.group}>
                    <p className="mb-1.5 text-[11px] uppercase tracking-widest text-muted-foreground">
                      {group.group}
                    </p>
                    <div className="flex flex-wrap gap-1.5">
                      {group.items.map((item) => (
                        <button
                          key={item.id}
                          type="button"
                          title={item.hint}
                          onClick={() => setTechnique(item.id)}
                          className={
                            technique === item.id
                              ? "ember-fill rounded-full px-3 py-1 text-xs font-medium"
                              : "rounded-full border border-border px-3 py-1 text-xs text-muted-foreground transition-colors hover:border-primary hover:text-foreground"
                          }
                        >
                          {item.label}
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </section>

            <section className="flex flex-col gap-2">
              <Label className="text-sm">Palette</Label>
              <Select value={palette} onValueChange={setPalette}>
                <SelectTrigger className="bg-background/60">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {PALETTES.map((p) => (
                    <SelectItem key={p.id} value={p.id}>
                      {p.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </section>

            <section className="flex flex-col gap-3">
              <Label className="flex items-center gap-2 text-sm">
                <Music4 className="size-4 text-accent" /> Music sync
              </Label>

              {file ? (
                <div className="rounded-lg border border-border bg-background/60 p-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium">{file.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {analyzing ??
                          (profile
                            ? `${Math.round(profile.bpm)} BPM · ${profile.key} · ${profile.beats.length} onsets · ${profile.mood}`
                            : "Analysing…")}
                      </p>
                    </div>
                    <Button size="icon" variant="ghost" onClick={clearAudio} aria-label="Remove track">
                      <X />
                    </Button>
                  </div>
                  {profile ? (
                    <div className="mt-3 flex h-12 items-end gap-[2px]">
                      {profile.energyCurve.map((v, i) => (
                        <span
                          key={i}
                          className="flex-1 rounded-sm bg-primary/70"
                          style={{ height: `${Math.max(6, v * 100)}%` }}
                        />
                      ))}
                    </div>
                  ) : null}
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => inputRef.current?.click()}
                  className="flex flex-col items-center gap-2 rounded-lg border border-dashed border-border bg-background/40 px-4 py-6 text-center transition-colors hover:border-primary"
                >
                  <Upload className="size-5 text-muted-foreground" />
                  <span className="text-sm">Upload a song or voice note</span>
                  <span className="text-xs text-muted-foreground">
                    MP3, WAV, M4A, OGG — we detect tempo, key, energy, beats and lyrics
                  </span>
                </button>
              )}
              <input
                ref={inputRef}
                type="file"
                accept="audio/*"
                className="hidden"
                onChange={(e) => {
                  const picked = e.target.files?.[0];
                  if (picked) void handleFile(picked);
                }}
              />

              {profile ? (
                <>
                  <div className="flex items-center justify-between rounded-lg border border-border bg-background/60 px-3 py-2">
                    <div>
                      <p className="text-sm">Show lyrics on the animation</p>
                      <p className="text-xs text-muted-foreground">Words appear in time with the vocals</p>
                    </div>
                    <Switch checked={showLyrics} onCheckedChange={setShowLyrics} />
                  </div>
                  <Label className="flex items-center gap-2 text-xs text-muted-foreground">
                    <AudioLines className="size-3.5" /> Detected lyrics (editable)
                  </Label>
                  <Textarea
                    rows={5}
                    value={lyrics}
                    onChange={(e) => setLyrics(e.target.value)}
                    placeholder="No vocals detected — you can paste lyrics here."
                    className="resize-none bg-background/60 text-xs"
                  />
                </>
              ) : null}
            </section>

            <Button className="ember-fill" size="lg" onClick={run} disabled={loading}>
              <Wand2 />
              {loading ? "Directing…" : "Generate animation"}
            </Button>
          </div>
        </ScrollArea>

        <div className="min-h-[70vh]">
          <AnimationStage
            html={html}
            loading={loading}
            audioUrl={audioUrl}
            lyricCues={cues}
            showLyrics={showLyrics}
            onRegenerate={run}
          />
        </div>
      </div>
    </main>
  );
}
