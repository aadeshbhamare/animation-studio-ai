import { History, RotateCcw, Save, Trash2 } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { styleLabel } from "@/lib/animation-types";
import { supabase, type AnimationVersionRow } from "@/lib/supabase-client";

type Props = {
  currentHtml: string | null;
  currentPrompt: string;
  currentStyles: string[];
  currentSceneCount: number;
  onRestore: (version: AnimationVersionRow) => void;
};

export function VersionHistory({ currentHtml, currentPrompt, currentStyles, currentSceneCount, onRestore }: Props) {
  const [versions, setVersions] = useState<AnimationVersionRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [label, setLabel] = useState("");

  const load = async () => {
    const { data, error } = await supabase
      .from("animation_versions")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(50);
    if (error) {
      toast.error("Could not load versions", { description: error.message });
      return;
    }
    setVersions((data ?? []) as AnimationVersionRow[]);
  };

  useEffect(() => {
    void load();
  }, []);

  const save = async () => {
    if (!currentHtml) {
      toast.error("Generate an animation first");
      return;
    }
    setLoading(true);
    const finalLabel = label.trim() || `Version ${versions.length + 1}`;
    const { data, error } = await supabase
      .from("animation_versions")
      .insert({
        label: finalLabel,
        prompt: currentPrompt,
        styles: currentStyles,
        html: currentHtml,
        scene_count: currentSceneCount,
      })
      .select("*")
      .single();
    setLoading(false);
    if (error || !data) {
      toast.error("Could not save version", { description: error?.message ?? "Unknown error" });
      return;
    }
    setLabel("");
    setVersions((prev) => [data as AnimationVersionRow, ...prev]);
    toast.success("Version saved", { description: finalLabel });
  };

  const remove = async (id: string) => {
    const { error } = await supabase.from("animation_versions").delete().eq("id", id);
    if (error) {
      toast.error("Could not delete version", { description: error.message });
      return;
    }
    setVersions((prev) => prev.filter((v) => v.id !== id));
  };

  return (
    <section className="flex flex-col gap-3 rounded-xl border border-border bg-card/60 p-4">
      <Label className="flex items-center gap-2 text-sm">
        <History className="size-4 text-accent" /> Version history
      </Label>

      <div className="flex gap-2">
        <Input
          value={label}
          onChange={(e) => setLabel(e.target.value)}
          placeholder="Name this version…"
          className="h-8 bg-background/60 text-xs"
        />
        <Button size="sm" className="ember-fill" onClick={save} disabled={loading || !currentHtml}>
          <Save /> Save
        </Button>
      </div>

      {versions.length > 0 ? (
        <ScrollArea className="max-h-56 rounded-lg border border-border">
          <div className="flex flex-col gap-1.5 p-2">
            {versions.map((v) => (
              <div
                key={v.id}
                className="flex items-center gap-2 rounded-lg border border-border bg-background/60 p-2.5"
              >
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="truncate text-xs font-medium">{v.label}</span>
                    <span className="shrink-0 text-[10px] text-muted-foreground">
                      {new Date(v.created_at).toLocaleDateString()}{" "}
                      {new Date(v.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                    </span>
                  </div>
                  <p className="truncate text-[11px] text-muted-foreground">
                    {v.prompt.slice(0, 60) || "Untitled"}
                  </p>
                  <div className="mt-1 flex flex-wrap gap-1">
                    {v.styles.slice(0, 3).map((s) => (
                      <span key={s} className="rounded bg-muted px-1.5 py-0.5 text-[10px] text-muted-foreground">
                        {styleLabel(s)}
                      </span>
                    ))}
                    {v.styles.length > 3 ? (
                      <span className="text-[10px] text-muted-foreground">+{v.styles.length - 3}</span>
                    ) : null}
                  </div>
                </div>
                <div className="flex shrink-0 flex-col gap-1">
                  <Button
                    size="icon"
                    variant="ghost"
                    className="h-7 w-7"
                    onClick={() => onRestore(v)}
                    aria-label="Restore version"
                  >
                    <RotateCcw className="size-3.5" />
                  </Button>
                  <Button
                    size="icon"
                    variant="ghost"
                    className="h-7 w-7"
                    onClick={() => remove(v.id)}
                    aria-label="Delete version"
                  >
                    <Trash2 className="size-3.5 text-destructive" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>
      ) : (
        <p className="text-xs text-muted-foreground">
          Saved versions appear here. Restore any version to bring back its animation, prompt and styles.
        </p>
      )}
    </section>
  );
}
