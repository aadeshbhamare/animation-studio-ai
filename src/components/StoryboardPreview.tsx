import { Clapperboard, Lock, RefreshCw, Trash2 } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { styleLabel } from "@/lib/animation-types";
import type { StoryboardScene } from "@/lib/project-types";

type Props = {
  scenes: StoryboardScene[];
  onRegenerate: (id: string) => void;
  onDelete: (id: string) => void;
  onToggleLock: (id: string) => void;
};

export function StoryboardPreview({ scenes, onRegenerate, onDelete, onToggleLock }: Props) {
  if (!scenes.length) return null;

  return (
    <section className="flex flex-col gap-3">
      <Label className="flex items-center gap-2 text-sm">
        <Clapperboard className="size-4 text-primary" /> AI Storyboard
      </Label>
      <div className="flex flex-col gap-2">
        {scenes.map((scene, i) => (
          <div key={scene.id} className="rounded-lg border border-border bg-background/60 p-3">
            <div className="flex items-start justify-between gap-2">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-primary">
                  Scene {i + 1}
                </span>
                <span className="text-[11px] text-muted-foreground">
                  {scene.start.toFixed(1)}s — {(scene.start + scene.duration).toFixed(1)}s
                </span>
                {scene.locked ? <Lock className="size-3 text-primary" /> : null}
              </div>
              <div className="flex gap-1">
                <Button
                  size="icon"
                  variant="ghost"
                  className="h-6 w-6"
                  onClick={() => onToggleLock(scene.id)}
                  aria-label="Lock scene"
                >
                  <Lock className={scene.locked ? "size-3 text-primary" : "size-3"} />
                </Button>
                <Button
                  size="icon"
                  variant="ghost"
                  className="h-6 w-6"
                  onClick={() => onRegenerate(scene.id)}
                  aria-label="Regenerate scene"
                >
                  <RefreshCw className="size-3" />
                </Button>
                <Button
                  size="icon"
                  variant="ghost"
                  className="h-6 w-6"
                  onClick={() => onDelete(scene.id)}
                  aria-label="Delete scene"
                >
                  <Trash2 className="size-3 text-destructive" />
                </Button>
              </div>
            </div>
            <p className="mt-1.5 text-xs text-foreground">{scene.description}</p>
            <div className="mt-2 flex flex-wrap gap-1.5">
              <Badge variant="secondary" className="text-[10px]">
                {styleLabel(scene.styleId)}
              </Badge>
              {scene.cameraId ? (
                <Badge variant="outline" className="text-[10px]">
                  {scene.cameraId}
                </Badge>
              ) : null}
              {scene.transitionId ? (
                <Badge variant="outline" className="text-[10px]">
                  {scene.transitionId}
                </Badge>
              ) : null}
              {scene.emotion ? (
                <Badge variant="outline" className="text-[10px]">
                  {scene.emotion}
                </Badge>
              ) : null}
              {scene.section ? (
                <Badge variant="outline" className="text-[10px]">
                  {scene.section}
                </Badge>
              ) : null}
            </div>
            {scene.lyric ? (
              <p className="mt-1.5 text-[11px] italic text-muted-foreground">"{scene.lyric}"</p>
            ) : null}
            {scene.imageIds.length > 0 ? (
              <p className="mt-1 text-[10px] text-muted-foreground">
                Images: {scene.imageIds.join(", ")}
              </p>
            ) : null}
            {scene.palette.length > 0 ? (
              <div className="mt-1.5 flex gap-1">
                {scene.palette.slice(0, 6).map((c, j) => (
                  <span
                    key={j}
                    className="h-3 w-3 rounded-sm border border-border/50"
                    style={{ backgroundColor: c }}
                  />
                ))}
              </div>
            ) : null}
          </div>
        ))}
      </div>
    </section>
  );
}
