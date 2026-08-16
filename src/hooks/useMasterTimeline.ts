import { useMemo } from "react";
import type { AudioProfile } from "@/lib/audio-analysis";
import type { WordCue, StoryboardScene } from "@/lib/project-types";

export function useMasterTimeline(audioProfile: AudioProfile | null, wordCues: WordCue[], scenes: StoryboardScene[]) {
  return useMemo(() => {
    const duration = audioProfile?.duration ?? scenes.reduce((s, sc) => Math.max(s, sc.start + sc.duration), 0) || 0;
    const beats = audioProfile?.beats ?? [];
    return { duration, beats, wordCues, scenes };
  }, [audioProfile, wordCues, scenes]);
}
