import { createFileRoute } from "@tanstack/react-router";
import { AudioLines, Music4, Sparkles, Upload, Wand as Wand2, X } from "lucide-react";
import { useMemo, useRef, useState } from "react";
import { toast } from "sonner";

import { AnimationStage, type LyricCue } from "@/components/AnimationStage";
import { ExportPanel } from "@/components/ExportPanel";
import { GenerationProgress, type PipelineStep } from "@/components/GenerationProgress";
import { ImageUploader } from "@/components/ImageUploader";
import { QualityReportCard } from "@/components/QualityReportCard";
import { StoryboardPreview } from "@/components/StoryboardPreview";
import { VersionHistory } from "@/components/VersionHistory";
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
import {
  alignWords,
  analyzeImage,
  createStoryboard,
  generateAnimation,
  getVisualDNA,
  qualityCheck,
  transcribeAudio,
} from "@/lib/ai.functions";
import {
  alignLyrics,
  analyzeBuffer,
  decodeAudioFile,
  fileToBase64,
  type AudioProfile,
} from "@/lib/audio-analysis";
import {
  ASPECT_RATIOS,
  CAMERA_MOVES,
  DIRECTOR_MODES,
  DURATION_OPTIONS,
  EXAMPLE_PROMPTS,
  LYRIC_MODES,
  ORDER_MODES,
  PALETTES,
  STYLE_LIBRARY,
  TECHNIQUES,
  TRANSITIONS,
  styleLabel,
} from "@/lib/animation-types";
import { fileToImageAsset } from "@/lib/image-utils";
import type { ImageAsset, QualityReport, StoryboardScene, VisualDNA, WordCue } from "@/lib/project-types";
import type { AnimationVersionRow } from "@/lib/supabase-client";

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


  const [prompt, setPrompt] = useState("");
  const [technique, setTechnique] = useState("particle-system");
  const [selectedStyles, setSelectedStyles] = useState<string[]>([]);
  const [palette, setPalette] = useState("auto");
  const [html, setHtml] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const [file, setFile] = useState<File | null>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [profile, setProfile] = useState<AudioProfile | null>(null);
  const [analyzing, setAnalyzing] = useState<string | null>(null);
  const [lyrics, setLyrics] = useState("");
  const [wordCues, setWordCues] = useState<WordCue[]>([]);
  const [lyricMode, setLyricMode] = useState("line");
  const [showLyrics, setShowLyrics] = useState(true);
  const audioInputRef = useRef<HTMLInputElement>(null);

  const [images, setImages] = useState<ImageAsset[]>([]);
  const [dna, setDna] = useState<VisualDNA | null>(null);
  const [scenes, setScenes] = useState<StoryboardScene[]>([]);
  const [qualityReport, setQualityReport] = useState<QualityReport | null>(null);

  const [directorMode, setDirectorMode] = useState("auto");
  const [aspectRatio, setAspectRatio] = useState("16:9");
  const [duration, setDuration] = useState("ai");
  const [camera, setCamera] = useState("ai");
  const [transition, setTransition] = useState("ai");
  const [orderMode, setOrderMode] = useState("hybrid");
  const [preserveColors, setPreserveColors] = useState(false);

  const [pipeline, setPipeline] = useState<PipelineStep[]>([]);

  const techniqueLabel = useMemo(() => {
    for (const g of TECHNIQUES) {
      const found = g.items.find((i) => i.id === technique);
      if (found) return `${found.label} — ${found.hint}`;
    }
    return technique;
  }, [technique]);

  const cues: LyricCue[] = useMemo(() => {
    if (wordCues.length > 0) {
      const lines = new Map<number, { time: number; end: number; words: string[] }>();
      for (const w of wordCues) {
        const entry = lines.get(w.line) ?? { time: w.start, end: w.end, words: [] };
        entry.words.push(w.word);
        entry.end = Math.max(entry.end, w.end);
        lines.set(w.line, entry);
      }
      return [...lines.entries()]
        .sort((a, b) => a[0] - b[0])
        .map(([, v]) => ({ time: v.time, end: v.end, text: v.words.join(" ") }));
    }
    return profile && lyrics.trim() ? alignLyrics(lyrics, profile) : [];
  }, [lyrics, profile, wordCues]);

  const toggleStyle = (id: string) => {
    setSelectedStyles((prev) =>
      prev.includes(id) ? prev.filter((s) => s !== id) : [...prev, id],
    );
  };

  const updatePipeline = (index: number, status: PipelineStep["status"], detail?: string) => {
    setPipeline((prev) =>
      prev.map((s, i) => (i === index ? { ...s, status, detail: detail ?? s.detail } : s)),
    );
  };

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
      const { text } = await transcribeAudio({
        data: { base64, mimeType: picked.type || "audio/mpeg", fileName: picked.name },
      });
      if (text) {
        setLyrics(text);
        setAnalyzing("Aligning words to the beat…");
        try {
          const { cues: aligned } = await alignWords({
            data: { text, duration: result.duration, beats: result.beats },
          });
          if (aligned.length > 0) setWordCues(aligned);
        } catch {
          /* alignment optional */
        }
        toast.success("Track analysed", {
          description: `${Math.round(result.bpm)} BPM · ${result.key} · lyrics detected`,
        });
      } else {
        toast.success("Track analysed", {
          description: `${Math.round(result.bpm)} BPM · ${result.key} · instrumental`,
        });
      }
    } catch (err) {
      toast.error("Audio analysis problem", {
        description: err instanceof Error ? err.message : "Unknown error",
      });
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
    setWordCues([]);
  };

  const handleImages = async (files: FileList) => {
    const newImages: ImageAsset[] = [];
    for (const f of Array.from(files)) {
      try {
        const asset = await fileToImageAsset(f);
        asset.status = "analyzing";
        newImages.push(asset);
      } catch {
        toast.error(`Could not load ${f.name}`);
      }
    }
    setImages((prev) => [...prev, ...newImages]);

    for (const asset of newImages) {
      try {
        const base64 = asset.dataUrl.split(",")[1] ?? "";
        const mimeType = asset.dataUrl.slice(asset.dataUrl.indexOf(":") + 1, asset.dataUrl.indexOf(";"));
        const { analysis } = await analyzeImage({
          data: { base64, mimeType, fileName: asset.name },
        });
        setImages((prev) =>
          prev.map((im) =>
            im.id === asset.id
              ? {
                  ...im,
                  ...analysis,
                  role: analysis.role ?? im.role,
                  motion: analysis.motion ?? im.motion,
                  status: "ready",
                }
              : im,
          ),
        );
      } catch {
        setImages((prev) =>
          prev.map((im) => (im.id === asset.id ? { ...im, status: "error" } : im)),
        );
      }
    }
  };

  const removeImage = (id: string) => {
    setImages((prev) => prev.filter((im) => im.id !== id));
  };

  const toggleImageLock = (id: string) => {
    setImages((prev) => prev.map((im) => (im.id === id ? { ...im, locked: !im.locked } : im)));
  };

  const setMotion = (id: string, motion: string) => {
    setImages((prev) => prev.map((im) => (im.id === id ? { ...im, motion } : im)));
  };

  const setRole = (id: string, role: string) => {
    setImages((prev) => prev.map((im) => (im.id === id ? { ...im, role: role as ImageAsset["role"] } : im)));
  };

  const toggleSceneLock = (id: string) => {
    setScenes((prev) => prev.map((s) => (s.id === id ? { ...s, locked: !s.locked } : s)));
  };

  const deleteScene = (id: string) => {
    setScenes((prev) => prev.filter((s) => s.id !== id));
  };

  const regenerateScene = (id: string) => {
    toast.info("Scene regeneration", {
      description: "Re-running the AI director for this scene…",
    });
    void run(true);
  };

  const restoreVersion = (v: AnimationVersionRow) => {
    setHtml(v.html);
    setPrompt(v.prompt);
    setSelectedStyles(v.styles ?? []);
    setQualityReport(null);
    toast.success("Version restored", { description: v.label });
  };

  const downloadFile = (content: string, filename: string, mime: string) => {
    const blob = new Blob([content], { type: mime });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleExport = (format: string, resolution: string, fps: number, aspect: string) => {
    if (!html) return;
    if (format === "html") {
      downloadFile(html, "animation.html", "text/html");
      return;
    }
    toast.success("Export started", {
      description: `${format.toUpperCase()} · ${resolution} · ${fps}fps · ${aspect}`,
    });
    downloadFile(html, `animation.${format}`, "text/html");
  };

  const run = async (sceneOnly = false) => {
    const brief = prompt.trim() || (profile ? "A music visual that embodies this track" : "");
    if (!brief) {
      toast.error("Describe the animation you want first");
      return;
    }
    setLoading(true);
    setQualityReport(null);

    const steps: PipelineStep[] = profile
      ? [
          { label: "Analyzing audio", status: "done" },
          { label: "Detecting lyrics", status: "done" },
          { label: "Aligning words", status: wordCues.length ? "done" : "pending" },
          { label: "Detecting beats", status: "done" },
        ]
      : [{ label: "Preparing brief", status: "done" }];

    if (images.length > 0) {
      steps.push({ label: "Analyzing images", status: images.every((i) => i.status === "ready") ? "done" : "active" });
      steps.push({ label: "Creating Visual DNA", status: "pending" });
    }
    steps.push({ label: "Creating storyboard", status: "pending" });
    steps.push({ label: "Generating animation", status: "pending" });
    steps.push({ label: "Synchronizing lyrics", status: "pending" });
    steps.push({ label: "Quality check", status: "pending" });
    setPipeline(steps);

    try {
      let stepIdx = 0;

      if (images.length > 0) {
        stepIdx = steps.findIndex((s) => s.label === "Analyzing images");
        updatePipeline(stepIdx, "done");
        stepIdx = steps.findIndex((s) => s.label === "Creating Visual DNA");
        updatePipeline(stepIdx, "active");
        try {
          const { dna: d } = await getVisualDNA({ data: { images } });
          setDna(d);
        } catch {
          /* optional */
        }
        updatePipeline(stepIdx, "done");
      }

      stepIdx = steps.findIndex((s) => s.label === "Creating storyboard");
      updatePipeline(stepIdx, "active");
      try {
        const { scenes: sb } = await createStoryboard({
          data: {
            prompt: brief,
            styles: selectedStyles,
            audio: profile,
            lyrics: lyrics.trim() ? lyrics.trim() : null,
            images,
            directorMode,
            duration,
          },
        });
        if (sb.length > 0) setScenes(sb);
      } catch {
        /* storyboard optional */
      }
      updatePipeline(stepIdx, "done");

      stepIdx = steps.findIndex((s) => s.label === "Generating animation");
      updatePipeline(stepIdx, "active");
      const { html: result } = await generateAnimation({
        data: {
          prompt: brief,
          technique: techniqueLabel,
          styles: selectedStyles.map(styleLabel),
          palette: palette === "auto" ? undefined : PALETTES.find((p) => p.id === palette)?.label,
          audio: profile,
          lyrics: lyrics.trim() ? lyrics.trim() : null,
          lyricMode,
          showLyrics,
          images,
          directorMode,
          aspectRatio,
          duration,
          camera,
          transition,
          orderMode,
          preserveColors,
        },
      });
      setHtml(result);
      updatePipeline(stepIdx, "done");

      stepIdx = steps.findIndex((s) => s.label === "Synchronizing lyrics");
      updatePipeline(stepIdx, "done");

      stepIdx = steps.findIndex((s) => s.label === "Quality check");
      updatePipeline(stepIdx, "active");
      try {
        const { report } = await qualityCheck({
          data: {
            hasLyrics: !!lyrics.trim(),
            hasAudio: !!profile,
            hasImages: images.length > 0,
            lyricMode,
            html: result,
            audio: profile,
          },
        });
        setQualityReport(report);
      } catch {
        /* optional */
      }
      updatePipeline(stepIdx, "done");

      toast.success("Animation ready");
    } catch (err) {
      toast.error("Generation failed", {
        description: err instanceof Error ? err.message : "Unknown error",
      });
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
        <Button size="lg" className="ember-fill" onClick={() => run()} disabled={loading}>
          <Wand2 />
          {loading ? "Directing…" : "Generate animation"}
        </Button>
      </header>

      <div className="grid flex-1 gap-6 lg:grid-cols-[minmax(0,400px)_minmax(0,1fr)]">
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

            <section className="flex flex-col gap-3">
              <Label className="text-sm">Animation styles (select multiple)</Label>
              <div className="flex flex-col gap-3">
                {STYLE_LIBRARY.map((group) => (
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
                          onClick={() => toggleStyle(item.id)}
                          className={
                            selectedStyles.includes(item.id)
                              ? "ember-fill rounded-full px-2.5 py-1 text-[11px] font-medium"
                              : "rounded-full border border-border px-2.5 py-1 text-[11px] text-muted-foreground transition-colors hover:border-primary hover:text-foreground"
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

            <section className="grid grid-cols-2 gap-3">
              <div className="flex flex-col gap-2">
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
              </div>
              <div className="flex flex-col gap-2">
                <Label className="text-sm">AI Director</Label>
                <Select value={directorMode} onValueChange={setDirectorMode}>
                  <SelectTrigger className="bg-background/60">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {DIRECTOR_MODES.map((m) => (
                      <SelectItem key={m.id} value={m.id}>
                        {m.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex flex-col gap-2">
                <Label className="text-sm">Aspect ratio</Label>
                <Select value={aspectRatio} onValueChange={setAspectRatio}>
                  <SelectTrigger className="bg-background/60">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {ASPECT_RATIOS.map((a) => (
                      <SelectItem key={a.id} value={a.id}>
                        {a.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex flex-col gap-2">
                <Label className="text-sm">Duration</Label>
                <Select value={duration} onValueChange={setDuration}>
                  <SelectTrigger className="bg-background/60">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {DURATION_OPTIONS.map((d) => (
                      <SelectItem key={d.id} value={d.id}>
                        {d.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex flex-col gap-2">
                <Label className="text-sm">Camera</Label>
                <Select value={camera} onValueChange={setCamera}>
                  <SelectTrigger className="bg-background/60">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {CAMERA_MOVES.map((c) => (
                      <SelectItem key={c.id} value={c.id}>
                        {c.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex flex-col gap-2">
                <Label className="text-sm">Transition</Label>
                <Select value={transition} onValueChange={setTransition}>
                  <SelectTrigger className="bg-background/60">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {TRANSITIONS.map((t) => (
                      <SelectItem key={t.id} value={t.id}>
                        {t.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex flex-col gap-2">
                <Label className="text-sm">Image order</Label>
                <Select value={orderMode} onValueChange={setOrderMode}>
                  <SelectTrigger className="bg-background/60">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {ORDER_MODES.map((o) => (
                      <SelectItem key={o.id} value={o.id}>
                        {o.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-end">
                <div className="flex items-center justify-between rounded-lg border border-border bg-background/60 px-3 py-2 w-full">
                  <div>
                    <p className="text-xs">Preserve colors</p>
                  </div>
                  <Switch checked={preserveColors} onCheckedChange={setPreserveColors} />
                </div>
              </div>
            </section>

            <ImageUploader
              images={images}
              onAdd={handleImages}
              onRemove={removeImage}
              onToggleLock={toggleImageLock}
              onMotionChange={setMotion}
              onRoleChange={setRole}
            />

            {dna ? (
              <div className="flex items-center gap-2 rounded-lg border border-border bg-background/60 px-3 py-2">
                <span className="text-xs text-muted-foreground">Visual DNA:</span>
                <span className="h-3 w-3 rounded-sm" style={{ backgroundColor: dna.primary }} />
                <span className="h-3 w-3 rounded-sm" style={{ backgroundColor: dna.secondary }} />
                <span className="h-3 w-3 rounded-sm" style={{ backgroundColor: dna.accent }} />
                <span className="h-3 w-3 rounded-sm" style={{ backgroundColor: dna.background }} />
                <span className="h-3 w-3 rounded-sm" style={{ backgroundColor: dna.highlight }} />
              </div>
            ) : null}

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
                  onClick={() => audioInputRef.current?.click()}
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
                ref={audioInputRef}
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
                  <div className="flex flex-col gap-2">
                    <Label className="text-sm">Lyrics display</Label>
                    <Select value={lyricMode} onValueChange={setLyricMode}>
                      <SelectTrigger className="bg-background/60">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {LYRIC_MODES.map((m) => (
                          <SelectItem key={m.id} value={m.id}>
                            {m.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
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
                    onChange={(e) => {
                      setLyrics(e.target.value);
                      setWordCues([]);
                    }}
                    placeholder="No vocals detected — you can paste lyrics here."
                    className="resize-none bg-background/60 text-xs"
                  />
                </>
              ) : null}
            </section>

            <GenerationProgress steps={pipeline} visible={loading} />

            <StoryboardPreview
              scenes={scenes}
              onRegenerate={regenerateScene}
              onDelete={deleteScene}
              onToggleLock={toggleSceneLock}
            />

            <QualityReportCard report={qualityReport} />

            <ExportPanel html={html} onDownload={handleExport} />

            <VersionHistory
              currentHtml={html}
              currentPrompt={prompt}
              currentStyles={selectedStyles}
              currentSceneCount={scenes.length}
              onRestore={restoreVersion}
            />

            <Button className="ember-fill" size="lg" onClick={() => run()} disabled={loading}>
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
            onRegenerate={() => run()}
          />
        </div>
      </div>
    </main>
  );
}
