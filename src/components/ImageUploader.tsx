import { ImagePlus, Lock, Trash2, X } from "lucide-react";
import { useRef } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { IMAGE_MOTIONS } from "@/lib/animation-types";
import type { ImageAsset } from "@/lib/project-types";

type Props = {
  images: ImageAsset[];
  onAdd: (files: FileList) => void;
  onRemove: (id: string) => void;
  onToggleLock: (id: string) => void;
  onMotionChange: (id: string, motion: string) => void;
  onRoleChange: (id: string, role: string) => void;
};

const ROLES = ["character", "background", "object", "product", "logo", "texture", "reference"];

export function ImageUploader({ images, onAdd, onRemove, onToggleLock, onMotionChange, onRoleChange }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);

  return (
    <section className="flex flex-col gap-3">
      <Label className="flex items-center gap-2 text-sm">
        <ImagePlus className="size-4 text-accent" /> Images
      </Label>

      {images.length > 0 ? (
        <div className="flex flex-col gap-2">
          {images.map((img, i) => (
            <div key={img.id} className="flex items-start gap-3 rounded-lg border border-border bg-background/60 p-2.5">
              <img
                src={img.dataUrl}
                alt={img.name}
                className="h-14 w-14 shrink-0 rounded-md object-cover"
              />
              <div className="flex min-w-0 flex-1 flex-col gap-1.5">
                <div className="flex items-center gap-2">
                  <span className="truncate text-xs font-medium">
                    IMG{String(i + 1).padStart(2, "0")}
                  </span>
                  <Badge variant="secondary" className="text-[10px]">
                    {img.status === "analyzing" ? "Analyzing…" : img.status === "ready" ? img.role : "Pending"}
                  </Badge>
                  {img.locked ? <Lock className="size-3 text-primary" /> : null}
                </div>
                <p className="truncate text-[11px] text-muted-foreground">{img.name}</p>
                {img.description ? (
                  <p className="line-clamp-2 text-[11px] text-muted-foreground">{img.description}</p>
                ) : null}
                {img.palette.length > 0 ? (
                  <div className="flex gap-1">
                    {img.palette.slice(0, 5).map((c, j) => (
                      <span
                        key={j}
                        className="h-3 w-3 rounded-sm border border-border/50"
                        style={{ backgroundColor: c }}
                      />
                    ))}
                  </div>
                ) : null}
                <div className="flex gap-1.5">
                  <Select value={img.role} onValueChange={(v) => onRoleChange(img.id, v)}>
                    <SelectTrigger className="h-7 flex-1 text-[11px]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {ROLES.map((r) => (
                        <SelectItem key={r} value={r}>
                          {r}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Select value={img.motion} onValueChange={(v) => onMotionChange(img.id, v)}>
                    <SelectTrigger className="h-7 flex-1 text-[11px]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {IMAGE_MOTIONS.map((m) => (
                        <SelectItem key={m.id} value={m.id}>
                          {m.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="flex flex-col gap-1">
                <Button
                  size="icon"
                  variant="ghost"
                  className="h-7 w-7"
                  onClick={() => onToggleLock(img.id)}
                  aria-label="Lock image"
                >
                  <Lock className={img.locked ? "size-3.5 text-primary" : "size-3.5"} />
                </Button>
                <Button
                  size="icon"
                  variant="ghost"
                  className="h-7 w-7"
                  onClick={() => onRemove(img.id)}
                  aria-label="Remove image"
                >
                  <Trash2 className="size-3.5 text-destructive" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      ) : null}

      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        className="flex flex-col items-center gap-1.5 rounded-lg border border-dashed border-border bg-background/40 px-4 py-5 text-center transition-colors hover:border-primary"
      >
        <ImagePlus className="size-5 text-muted-foreground" />
        <span className="text-sm">Upload images</span>
        <span className="text-xs text-muted-foreground">
          JPG, PNG, WEBP — characters, backgrounds, logos, objects
        </span>
      </button>
      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/svg+xml"
        multiple
        className="hidden"
        onChange={(e) => {
          if (e.target.files && e.target.files.length > 0) onAdd(e.target.files);
          e.target.value = "";
        }}
      />
    </section>
  );
}
