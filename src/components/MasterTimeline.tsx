import type { StoryboardScene } from "@/lib/project-types";
import type { WordCue } from "@/lib/project-types";
import type { AudioProfile } from "@/lib/audio-analysis";

export type MasterTimelineProps = {
  audioProfile: AudioProfile | null;
  wordCues: WordCue[];
  scenes: StoryboardScene[];
};

export default function MasterTimeline({ audioProfile, wordCues, scenes }: MasterTimelineProps) {
  const duration = audioProfile?.duration ?? Math.max(10, scenes.reduce((s, sc) => Math.max(s, sc.start + sc.duration), 0));
  const beats = audioProfile?.beats ?? [];

  // Render a simple horizontal timeline
  const width = Math.max(800, Math.round((duration / Math.max(1, duration)) * 1600));

  return (
    <div className="mt-4 rounded-lg border border-border bg-background/40 p-3">
      <div className="text-xs text-muted-foreground mb-2">Master timeline — beats are thin lines, words are blue markers, scenes are blocks</div>
      <div className="relative overflow-x-auto" style={{ height: 120 }}>
        <div style={{ width: `${Math.max(1200, Math.round(duration * 100))}px`, height: 120 }}>
          {/* Beats */}
          {beats.map((b, i) => (
            <div key={i} style={{ position: "absolute", left: `${(b / duration) * 100}%`, top: 0, bottom: 0, width: 1, background: "rgba(255,255,255,0.06)" }} />
          ))}

          {/* Words */}
          {wordCues.map((w, i) => (
            <div key={i} style={{ position: "absolute", left: `${(w.start / duration) * 100}%`, top: 10, width: 6, height: 6, borderRadius: 3, background: "#60a5fa" }} title={`${w.word} @ ${w.start}s`} />
          ))}

          {/* Scenes */}
          {scenes.map((s) => (
            <div key={s.id} style={{ position: "absolute", left: `${(s.start / duration) * 100}%`, top: 40, width: `${(s.duration / duration) * 100}%`, height: 40, background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.06)", display: "flex", alignItems: "center", paddingLeft: 6 }}>
              <div className="text-xs">{s.title}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
