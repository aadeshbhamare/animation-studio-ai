import { Download, Film, Share2 } from "lucide-react";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ASPECT_RATIOS, FPS_OPTIONS, RESOLUTIONS, SOCIAL_PRESETS } from "@/lib/animation-types";

type Props = {
  html: string | null;
  onDownload: (format: string, resolution: string, fps: number, aspect: string) => void;
};

export function ExportPanel({ html, onDownload }: Props) {
  const [format, setFormat] = useState("mp4");
  const [resolution, setResolution] = useState("1080p");
  const [fps, setFps] = useState("30");
  const [aspect, setAspect] = useState("16:9");
  const [preset, setPreset] = useState("");

  const applyPreset = (id: string) => {
    setPreset(id);
    const p = SOCIAL_PRESETS.find((s) => s.id === id);
    if (p) {
      setAspect(p.aspect);
      setResolution(p.resolution);
      setFps(String(p.fps));
    }
  };

  return (
    <section className="flex flex-col gap-3 rounded-xl border border-border bg-card/60 p-4">
      <Label className="flex items-center gap-2 text-sm">
        <Film className="size-4 text-primary" /> Export
      </Label>

      <div className="flex flex-wrap gap-1.5">
        {SOCIAL_PRESETS.map((p) => (
          <button
            key={p.id}
            type="button"
            onClick={() => applyPreset(p.id)}
            className={
              preset === p.id
                ? "ember-fill rounded-full px-2.5 py-1 text-[11px] font-medium"
                : "rounded-full border border-border px-2.5 py-1 text-[11px] text-muted-foreground transition-colors hover:border-primary hover:text-foreground"
            }
          >
            {p.label}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-2 gap-2">
        <div className="flex flex-col gap-1">
          <Label className="text-[11px] text-muted-foreground">Format</Label>
          <Select value={format} onValueChange={setFormat}>
            <SelectTrigger className="h-8 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {["mp4", "mov", "webm", "gif"].map((f) => (
                <SelectItem key={f} value={f}>
                  {f.toUpperCase()}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="flex flex-col gap-1">
          <Label className="text-[11px] text-muted-foreground">Resolution</Label>
          <Select value={resolution} onValueChange={setResolution}>
            <SelectTrigger className="h-8 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {RESOLUTIONS.map((r) => (
                <SelectItem key={r} value={r}>
                  {r}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="flex flex-col gap-1">
          <Label className="text-[11px] text-muted-foreground">FPS</Label>
          <Select value={fps} onValueChange={setFps}>
            <SelectTrigger className="h-8 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {FPS_OPTIONS.map((f) => (
                <SelectItem key={f} value={String(f)}>
                  {f} fps
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="flex flex-col gap-1">
          <Label className="text-[11px] text-muted-foreground">Aspect</Label>
          <Select value={aspect} onValueChange={setAspect}>
            <SelectTrigger className="h-8 text-xs">
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
      </div>

      <div className="flex gap-2">
        <Button
          className="ember-fill flex-1"
          size="sm"
          disabled={!html}
          onClick={() => onDownload(format, resolution, Number(fps), aspect)}
        >
          <Download /> Export {format.toUpperCase()}
        </Button>
        <Button variant="outline" size="sm" disabled={!html} onClick={() => onDownload("html", resolution, Number(fps), aspect)}>
          <Share2 /> HTML
        </Button>
      </div>
    </section>
  );
}
