import { Download, Expand, Pause, Play, RefreshCw, Code2 } from "lucide-react";
import { useEffect, useRef, useState } from "react";

import { Button } from "@/components/ui/button";

export type LyricCue = { time: number; end: number; text: string };

type Props = {
  html: string | null;
  loading: boolean;
  audioUrl: string | null;
  lyricCues: LyricCue[];
  showLyrics: boolean;
  onRegenerate: () => void;
};

export function AnimationStage({ html, loading, audioUrl, lyricCues, showLyrics, onRegenerate }: Props) {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const audioRef = useRef<HTMLAudioElement>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const ctxRef = useRef<AudioContext | null>(null);
  const [playing, setPlaying] = useState(false);
  const [showCode, setShowCode] = useState(false);

  // Feed live audio analysis (or a synthetic pulse) into the sandboxed animation.
  useEffect(() => {
    let raf = 0;
    let smoothed = { level: 0, bass: 0, mid: 0, treble: 0 };
    let lastBeat = 0;

    const tick = () => {
      raf = requestAnimationFrame(tick);
      const win = iframeRef.current?.contentWindow;
      if (!win) return;

      const analyser = analyserRef.current;
      const time = audioRef.current?.currentTime ?? performance.now() / 1000;
      let level = 0;
      let bass = 0;
      let mid = 0;
      let treble = 0;

      if (analyser) {
        const bins = new Uint8Array(analyser.frequencyBinCount);
        analyser.getByteFrequencyData(bins);
        const slice = (from: number, to: number) => {
          let sum = 0;
          const a = Math.floor(bins.length * from);
          const b = Math.floor(bins.length * to);
          for (let i = a; i < b; i++) sum += bins[i] ?? 0;
          return sum / Math.max(1, b - a) / 255;
        };
        bass = slice(0, 0.08);
        mid = slice(0.08, 0.4);
        treble = slice(0.4, 1);
        level = (bass + mid + treble) / 3;
      } else {
        level = 0.35 + 0.25 * Math.sin(time * 2.4);
        bass = 0.4 + 0.3 * Math.sin(time * 1.6);
        mid = 0.35 + 0.2 * Math.sin(time * 3.1);
        treble = 0.3 + 0.2 * Math.sin(time * 5.3);
      }

      const k = 0.25;
      smoothed = {
        level: smoothed.level + (level - smoothed.level) * k,
        bass: smoothed.bass + (bass - smoothed.bass) * k,
        mid: smoothed.mid + (mid - smoothed.mid) * k,
        treble: smoothed.treble + (treble - smoothed.treble) * k,
      };

      const beat = bass > smoothed.bass * 1.35 && bass > 0.25 && time - lastBeat > 0.18;
      if (beat) lastBeat = time;

      const cue = showLyrics ? lyricCues.find((c) => time >= c.time && time < c.end) : undefined;

      win.postMessage(
        { type: "audio", time, beat, lyric: cue?.text ?? null, ...smoothed, raw: { level, bass, mid, treble } },
        "*",
      );
    };

    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [lyricCues, showLyrics, html]);

  const ensureGraph = () => {
    const el = audioRef.current;
    if (!el || analyserRef.current) return;
    const Ctx = window.AudioContext;
    const ctx = new Ctx();
    const source = ctx.createMediaElementSource(el);
    const analyser = ctx.createAnalyser();
    analyser.fftSize = 2048;
    analyser.smoothingTimeConstant = 0.75;
    source.connect(analyser);
    analyser.connect(ctx.destination);
    ctxRef.current = ctx;
    analyserRef.current = analyser;
  };

  const toggle = async () => {
    const el = audioRef.current;
    if (!el) return;
    ensureGraph();
    await ctxRef.current?.resume();
    if (el.paused) {
      await el.play();
      setPlaying(true);
    } else {
      el.pause();
      setPlaying(false);
    }
  };

  const download = () => {
    if (!html) return;
    const blob = new Blob([html], { type: "text/html" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "animation.html";
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="flex h-full flex-col gap-3">
      <div className="stage-frame relative flex-1 overflow-hidden">
        {html ? (
          <iframe
            ref={iframeRef}
            title="Generated animation"
            srcDoc={html}
            sandbox="allow-scripts"
            className="h-full w-full border-0 bg-black"
          />
        ) : (
          <div className="flex h-full w-full flex-col items-center justify-center gap-3 px-8 text-center">
            <div className={loading ? "pulse-dot" : "idle-dot"} />
            <p className="font-display text-lg text-foreground">
              {loading ? "Directing your animation…" : "Your animation renders here"}
            </p>
            <p className="max-w-sm text-sm text-muted-foreground">
              {loading
                ? "Choosing palette, timing and technique, then writing the frame loop."
                : "Describe a scene, pick a technique, optionally drop in a track, and hit generate."}
            </p>
          </div>
        )}
        {showCode && html ? (
          <pre className="absolute inset-0 overflow-auto bg-card/95 p-4 text-xs leading-relaxed text-muted-foreground">
            {html}
          </pre>
        ) : null}
      </div>

      <div className="flex flex-wrap items-center gap-2">
        {audioUrl ? (
          <Button variant="secondary" size="sm" onClick={toggle}>
            {playing ? <Pause /> : <Play />}
            {playing ? "Pause track" : "Play track"}
          </Button>
        ) : null}
        <Button variant="ghost" size="sm" onClick={onRegenerate} disabled={loading}>
          <RefreshCw /> Regenerate
        </Button>
        <Button variant="ghost" size="sm" onClick={() => setShowCode((v) => !v)} disabled={!html}>
          <Code2 /> {showCode ? "Hide code" : "View code"}
        </Button>
        <Button variant="ghost" size="sm" onClick={download} disabled={!html}>
          <Download /> Download
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => iframeRef.current?.requestFullscreen()}
          disabled={!html}
        >
          <Expand /> Fullscreen
        </Button>
        {audioUrl ? <audio ref={audioRef} src={audioUrl} loop className="hidden" /> : null}
      </div>
    </div>
  );
}
