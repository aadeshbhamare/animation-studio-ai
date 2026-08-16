--- a/src/routes/index.tsx
+++ b/src/routes/index.tsx
@@
 import { AnimationStage, type LyricCue } from "@/components/AnimationStage";
@@
 import {
   alignWords,
   analyzeBuffer,
   decodeAudioFile,
   fileToBase64,
   type AudioProfile,
 } from "@/lib/audio-analysis";
+import AudioTracksPanel from "@/components/AudioTracksPanel";
+import MasterTimeline from "@/components/MasterTimeline";
+import LyricsVerifier from "@/components/LyricsVerifier";
+import { mergeAudioProfiles, type AudioTrack } from "@/lib/audio-utils";
@@
   const [file, setFile] = useState<File | null>(null);
   const [audioUrl, setAudioUrl] = useState<string | null>(null);
   const [profile, setProfile] = useState<AudioProfile | null>(null);
+  const [audioTracks, setAudioTracks] = useState<AudioTrack[]>([]);
+  const [masterProfile, setMasterProfile] = useState<AudioProfile | null>(null);
   const [analyzing, setAnalyzing] = useState<string | null>(null);
   const [lyrics, setLyrics] = useState("");
   const [wordCues, setWordCues] = useState<WordCue[]>([]);
@@
   const handleFile = async (picked: File) => {
@@
   };
+
+  const handleAddTrack = async (picked: File) => {
+    const id = Math.random().toString(36).slice(2, 9);
+    const url = URL.createObjectURL(picked);
+    const base: AudioTrack = { id, fileName: picked.name, fileUrl: url, role: "track", muted: false, volume: 1 };
+    setAudioTracks((prev) => [...prev, base]);
+    try {
+      setAnalyzing("Decoding and analysing the waveform…");
+      const buffer = await decodeAudioFile(picked);
+      const result = analyzeBuffer(buffer);
+      const base64 = await fileToBase64(picked);
+      const { text } = await transcribeAudio({ data: { base64, mimeType: picked.type || "audio/mpeg", fileName: picked.name } });
+      setAudioTracks((prev) => prev.map((t) => (t.id === id ? { ...t, profile: result, transcript: text ?? "" } : t)));
+    } catch (err) {
+      toast.error("Audio analysis problem", {
+        description: err instanceof Error ? err.message : "Unknown error",
+      });
+    } finally {
+      setAnalyzing(null);
+    }
+  };
+
+  // When tracks change, compute a master profile
+  useEffect(() => {
+    const profiles = audioTracks.map((t) => t.profile ?? null);
+    const merged = mergeAudioProfiles(profiles);
+    setMasterProfile(merged);
+  }, [audioTracks]);
@@
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
+
+              <AudioTracksPanel
+                tracks={audioTracks}
+                onAdd={(f) => void handleAddTrack(f)}
+                onRemove={(id) => setAudioTracks((prev) => prev.filter((t) => t.id !== id))}
+                onUpdate={(id, patch) => setAudioTracks((prev) => prev.map((t) => (t.id === id ? { ...t, ...patch } : t)))}
+              />
@@
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
+                  <LyricsVerifier
+                    wordCues={wordCues}
+                    onUpdateCues={(cues) => setWordCues(cues)}
+                    onAccept={(cues) => {
+                      setWordCues(cues);
+                      setLyrics(cues.map((c) => c.word).join(" "));
+                    }}
+                  />
                 </>
               ) : null}
             </section>
@@
         <div className="min-h-[70vh]">
-          <AnimationStage
-            html={html}
-            loading={loading}
-            audioUrl={audioUrl}
-            lyricCues={cues}
-            showLyrics={showLyrics}
-            onRegenerate={() => run()}
-          />
+          <div className="flex flex-col gap-3">
+            <AnimationStage html={html} loading={loading} audioUrl={audioUrl} lyricCues={cues} showLyrics={showLyrics} onRegenerate={() => run()} />
+            <MasterTimeline audioProfile={masterProfile ?? profile} wordCues={wordCues} scenes={scenes} />
+          </div>
         </div>
       </div>
     </main>
   );
 }
