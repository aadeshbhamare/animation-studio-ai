import { useState } from "react";
import type { WordCue } from "@/lib/project-types";

export type LyricsVerifierProps = {
  wordCues: WordCue[];
  onUpdateCues: (cues: WordCue[]) => void;
  onAccept: (cues: WordCue[]) => void;
};

export default function LyricsVerifier({ wordCues, onUpdateCues, onAccept }: LyricsVerifierProps) {
  const [local, setLocal] = useState<WordCue[]>(() => wordCues || []);

  // Sync when external changes
  React.useEffect(() => setLocal(wordCues || []), [wordCues]);

  function updateWord(i: number, k: keyof WordCue, v: any) {
    const next = [...local];
    // @ts-ignore
    next[i] = { ...next[i], [k]: v };
    setLocal(next);
    onUpdateCues(next);
  }

  return (
    <div className="mt-3">
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium">Detected words</p>
        <div className="text-xs text-muted-foreground">Edit individual words below — low confidence words show a warning.</div>
      </div>
      <div className="mt-2 grid grid-cols-2 gap-2">
        {local.map((w, i) => (
          <div key={`${w.word}-${i}`} className="rounded border border-border p-2">
            <div className="flex items-center justify-between">
              <input className="flex-1 bg-transparent text-sm" value={w.word} onChange={(e) => updateWord(i, "word", e.target.value)} />
              <span className="ml-2 text-xs text-muted-foreground">{w.start}s</span>
            </div>
            {typeof w.confidence !== "undefined" && w.confidence < 0.7 ? (
              <div className="mt-1 text-xs text-yellow-600">⚠ AI is unsure about this lyric. Please verify.</div>
            ) : null}
          </div>
        ))}
      </div>
      <div className="mt-3 flex gap-2">
        <button className="rounded bg-primary px-3 py-1 text-sm text-white" onClick={() => onAccept(local)}>Accept verified lyrics</button>
      </div>
    </div>
  );
}
