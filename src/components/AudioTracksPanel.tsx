import { useRef } from "react";
import { Button } from "@/components/ui/button";
import { decodeAudioFile, fileToBase64, analyzeBuffer } from "@/lib/audio-analysis";

export type AudioTrack = {
  id: string;
  fileName: string;
  fileUrl: string;
  role?: string;
  profile?: any;
  transcript?: string;
  muted?: boolean;
  volume?: number;
};

export type AudioTracksPanelProps = {
  tracks: AudioTrack[];
  onAdd: (file: File) => void;
  onRemove: (id: string) => void;
  onUpdate: (id: string, patch: Partial<AudioTrack>) => void;
};

export default function AudioTracksPanel({ tracks, onAdd, onRemove, onUpdate }: AudioTracksPanelProps) {
  const inputRef = useRef<HTMLInputElement | null>(null);

  return (
    <div className="mt-3">
      <div className="flex items-center gap-2">
        <Button
          onClick={() => inputRef.current?.click()}
          size="sm"
        >
          Add audio track
        </Button>
        <small className="text-xs text-muted-foreground">Upload multiple tracks: main, instrumental, vocals, sfx</small>
      </div>
      <input
        ref={inputRef}
        type="file"
        accept="audio/*"
        className="hidden"
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) onAdd(f);
          e.currentTarget.value = "";
        }}
      />

      <div className="mt-3 flex flex-col gap-2">
        {tracks.map((t) => (
          <div key={t.id} className="flex items-center justify-between rounded-lg border border-border bg-background/60 px-3 py-2">
            <div className="min-w-0">
              <p className="truncate text-sm font-medium">{t.fileName}</p>
              <p className="text-xs text-muted-foreground">{t.role ?? "track"} {t.profile ? `· ${Math.round(t.profile.bpm)} BPM` : "· analysing…"}</p>
            </div>
            <div className="flex items-center gap-2">
              <label className="text-xs">Vol</label>
              <input
                type="range"
                min={0}
                max={1}
                step={0.01}
                value={t.volume ?? 1}
                onChange={(e) => onUpdate(t.id, { volume: Number(e.target.value) })}
              />
              <button className="text-xs text-muted-foreground" onClick={() => onUpdate(t.id, { muted: !t.muted })}>{t.muted ? "Unmute" : "Mute"}</button>
              <button className="text-xs text-destructive" onClick={() => onRemove(t.id)}>Remove</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
