export type TechniqueGroup = {
  group: string;
  items: { id: string; label: string; hint: string }[];
};

/** A broad survey of the animation techniques used across the motion-design industry. */
export const TECHNIQUES: TechniqueGroup[] = [
  {
    group: "Core motion",
    items: [
      { id: "css-keyframes", label: "CSS keyframes", hint: "Classic timeline-based CSS animation" },
      { id: "spring-physics", label: "Spring physics", hint: "Damped springs, overshoot, natural easing" },
      { id: "easing-showcase", label: "Easing study", hint: "Cubic beziers, anticipation, follow-through" },
      { id: "stagger-choreography", label: "Stagger choreography", hint: "Cascading element entrances" },
      { id: "morph-transitions", label: "Shape morphing", hint: "SVG path interpolation between forms" },
      { id: "parallax-depth", label: "Parallax depth", hint: "Multi-layer depth and camera drift" },
    ],
  },
  {
    group: "Typography",
    items: [
      { id: "kinetic-typography", label: "Kinetic typography", hint: "Per-character text choreography" },
      { id: "typewriter", label: "Typewriter", hint: "Character reveal with caret" },
      { id: "variable-font", label: "Variable font morph", hint: "Weight and width animation" },
      { id: "text-mask-reveal", label: "Mask reveal", hint: "Clip-path wipes over headlines" },
      { id: "liquid-text", label: "Liquid text", hint: "Gooey SVG filter typography" },
      { id: "glitch-text", label: "Glitch text", hint: "RGB split, datamosh, scanlines" },
    ],
  },
  {
    group: "Generative & particles",
    items: [
      { id: "particle-system", label: "Particle system", hint: "Thousands of canvas particles" },
      { id: "flow-field", label: "Flow field", hint: "Perlin-noise vector fields" },
      { id: "fractal", label: "Fractals", hint: "Recursive geometry, L-systems" },
      { id: "generative-art", label: "Generative art", hint: "Rule-based evolving composition" },
      { id: "cellular-automata", label: "Cellular automata", hint: "Emergent grid life" },
      { id: "boids", label: "Flocking / boids", hint: "Emergent swarm behaviour" },
      { id: "physics-sim", label: "Physics sim", hint: "Gravity, collisions, cloth, rope" },
      { id: "fluid-sim", label: "Fluid / smoke", hint: "Advection, dye, turbulence" },
    ],
  },
  {
    group: "3D & shaders",
    items: [
      { id: "webgl-shader", label: "WebGL shader", hint: "Raw fragment-shader visuals" },
      { id: "raymarching", label: "Raymarching", hint: "Signed distance field 3D scenes" },
      { id: "css-3d", label: "CSS 3D", hint: "Perspective, transform-style: preserve-3d" },
      { id: "isometric", label: "Isometric world", hint: "2.5D grid animation" },
      { id: "wireframe", label: "Wireframe mesh", hint: "Rotating vector geometry" },
      { id: "displacement", label: "Displacement warp", hint: "Noise-driven image distortion" },
    ],
  },
  {
    group: "Style & craft",
    items: [
      { id: "motion-graphics", label: "Motion graphics", hint: "Broadcast-style shape animation" },
      { id: "line-drawing", label: "Line drawing", hint: "SVG stroke-dashoffset tracing" },
      { id: "frame-by-frame", label: "Frame-by-frame", hint: "Hand-drawn cel animation feel" },
      { id: "claymorphic", label: "Soft / claymorphic", hint: "Squash, stretch, blobby bodies" },
      { id: "retro-crt", label: "Retro CRT", hint: "Scanlines, phosphor glow, VHS" },
      { id: "brutalist", label: "Brutalist grid", hint: "Hard cuts, mono type, stark grid" },
      { id: "infographic", label: "Data / infographic", hint: "Animated charts and counters" },
      { id: "logo-sting", label: "Logo sting", hint: "Short branded intro animation" },
    ],
  },
  {
    group: "Audio reactive",
    items: [
      { id: "spectrum-bars", label: "Spectrum bars", hint: "Classic FFT bar visualizer" },
      { id: "waveform", label: "Waveform", hint: "Oscilloscope line motion" },
      { id: "radial-visualizer", label: "Radial visualizer", hint: "Circular frequency bloom" },
      { id: "beat-strobe", label: "Beat strobe", hint: "Cuts and flashes locked to the beat" },
      { id: "lyric-video", label: "Lyric video", hint: "Typography synced to vocals" },
      { id: "audio-terrain", label: "Audio terrain", hint: "Frequency-driven 3D landscape" },
    ],
  },
];

export const PALETTES = [
  { id: "auto", label: "Let the AI decide" },
  { id: "amber-noir", label: "Amber noir — charcoal, ember, bone" },
  { id: "electric-cyan", label: "Electric — ink blue, cyan, white" },
  { id: "editorial", label: "Editorial — cream, ink, oxblood" },
  { id: "acid", label: "Acid — asphalt, lime, magenta" },
  { id: "pastel", label: "Pastel — sand, sky, coral" },
  { id: "mono", label: "Monochrome — pure greyscale" },
  { id: "sunset", label: "Sunset — plum, tangerine, gold" },
];

export const EXAMPLE_PROMPTS = [
  "A slow bloom of ink in water that resolves into a beating heart",
  "Neon city skyline scrolling past a rain-streaked train window",
  "A single word, HUNGER, exploding into a thousand shards and reassembling",
  "Sunrise over a wireframe mountain range, layer by layer",
  "Molten gold liquid typography spelling out the track title",
  "Swarm of fireflies forming constellations on every beat",
];

export type StyleItem = { id: string; label: string; hint: string };
export type StyleGroup = { group: string; items: StyleItem[] };

/** The full production style library — selectable per project or per scene. */
export const STYLE_LIBRARY: StyleGroup[] = [
  {
    group: "2D animation",
    items: [
      { id: "traditional-2d", label: "Traditional", hint: "Cel-style hand animation" },
      { id: "hand-drawn", label: "Hand drawn", hint: "Rough pencil linework, boil" },
      { id: "digital-2d", label: "Digital 2D", hint: "Clean modern 2D rigs" },
      { id: "cartoon", label: "Cartoon", hint: "Squash, stretch, bold outlines" },
      { id: "anime", label: "Anime", hint: "Speed lines, dramatic holds, cel shading" },
      { id: "vector", label: "Vector", hint: "Crisp shapes, flat fills" },
      { id: "flat-design", label: "Flat design", hint: "Minimal geometry, no gradients" },
      { id: "cutout", label: "Cutout", hint: "Jointed paper puppet motion" },
      { id: "paper-cutout", label: "Paper cutout", hint: "Layered paper with drop shadows" },
      { id: "isometric-2d", label: "Isometric", hint: "2.5D axonometric world" },
      { id: "pixel-art", label: "Pixel art", hint: "Low-res sprites, dithering" },
      { id: "comic", label: "Comic", hint: "Panels, halftone, action lines" },
      { id: "sketch", label: "Sketch", hint: "Construction lines and hatching" },
      { id: "watercolor", label: "Watercolor", hint: "Bleeding washes, paper grain" },
      { id: "ink", label: "Ink", hint: "Sumi-e brush, high contrast" },
    ],
  },
  {
    group: "3D animation",
    items: [
      { id: "realistic-3d", label: "Realistic 3D", hint: "PBR shading, real optics" },
      { id: "stylized-3d", label: "Stylized 3D", hint: "Exaggerated forms, art-directed light" },
      { id: "low-poly", label: "Low poly", hint: "Faceted geometry, flat shading" },
      { id: "cinematic-3d", label: "Cinematic 3D", hint: "Anamorphic lensing, depth of field" },
      { id: "character-3d", label: "Character 3D", hint: "Rigged performance animation" },
      { id: "product-3d", label: "Product 3D", hint: "Turntables, studio light, reflections" },
      { id: "arch-3d", label: "Architectural 3D", hint: "Space fly-throughs, daylight" },
      { id: "clay-3d", label: "Clay 3D", hint: "Matte clay render, soft AO" },
    ],
  },
  {
    group: "Motion graphics",
    items: [
      { id: "kinetic-typography", label: "Kinetic typography", hint: "Per-word text choreography" },
      { id: "logo-animation", label: "Logo animation", hint: "Branded sting and reveal" },
      { id: "infographic", label: "Infographic", hint: "Animated stats and callouts" },
      { id: "data-viz", label: "Data visualisation", hint: "Charts building in time" },
      { id: "shape-animation", label: "Shape animation", hint: "Broadcast geometry motion" },
      { id: "morphing", label: "Morphing", hint: "Path interpolation between forms" },
      { id: "particle-animation", label: "Particle animation", hint: "Emitters, trails, forces" },
      { id: "fluid-animation", label: "Fluid animation", hint: "Advected dye and smoke" },
      { id: "abstract", label: "Abstract", hint: "Non-figurative colour and form" },
    ],
  },
  {
    group: "Traditional & experimental",
    items: [
      { id: "stop-motion", label: "Stop motion", hint: "Stepped frames, tactile jitter" },
      { id: "clay-animation", label: "Clay animation", hint: "Fingerprints and deformation" },
      { id: "puppet", label: "Puppet", hint: "Hinged limbs, string physics" },
      { id: "silhouette", label: "Silhouette", hint: "Backlit black forms" },
      { id: "whiteboard", label: "Whiteboard", hint: "Drawn-on-screen explainer" },
      { id: "flipbook", label: "Flipbook", hint: "Paper edge, rapid frames" },
      { id: "rotoscope", label: "Rotoscope", hint: "Traced live motion" },
      { id: "two-point-five-d", label: "2.5D", hint: "Flat layers in 3D space" },
      { id: "hybrid", label: "Hybrid", hint: "Mixed 2D/3D/live media" },
      { id: "mechanical", label: "Mechanical", hint: "Gears, linkages, machine timing" },
      { id: "glitch", label: "Glitch", hint: "Datamosh, RGB split, corruption" },
      { id: "experimental", label: "Experimental", hint: "Rule-breaking generative craft" },
    ],
  },
  {
    group: "Music animation",
    items: [
      { id: "audio-reactive", label: "Audio reactive", hint: "Everything driven by the signal" },
      { id: "beat-visualizer", label: "Beat visualiser", hint: "Hits punch the composition" },
      { id: "spectrum", label: "Spectrum", hint: "FFT bars and blooms" },
      { id: "waveform", label: "Waveform", hint: "Oscilloscope motion" },
      { id: "lyric-video", label: "Lyric video", hint: "Typography carries the song" },
      { id: "karaoke", label: "Karaoke", hint: "Word-by-word highlight" },
      { id: "music-video", label: "Music video", hint: "Narrative cuts to the track" },
      { id: "album-art", label: "Album art motion", hint: "Cover art brought alive" },
      { id: "vocal-reactive", label: "Vocal reactive", hint: "Reacts to voice, not drums" },
      { id: "bass-reactive", label: "Bass reactive", hint: "Low-end drives scale and camera" },
    ],
  },
];

export const ALL_STYLES: StyleItem[] = STYLE_LIBRARY.flatMap((g) => g.items);

export const styleLabel = (id: string) => ALL_STYLES.find((s) => s.id === id)?.label ?? id;

export const CAMERA_MOVES = [
  { id: "ai", label: "AI camera" },
  { id: "static", label: "Static" },
  { id: "pan", label: "Pan" },
  { id: "tilt", label: "Tilt" },
  { id: "zoom", label: "Zoom" },
  { id: "dolly", label: "Dolly" },
  { id: "tracking", label: "Tracking" },
  { id: "orbit", label: "Orbit" },
  { id: "crane", label: "Crane" },
  { id: "handheld", label: "Handheld" },
  { id: "drone", label: "Drone" },
  { id: "first-person", label: "First person" },
];

export const TRANSITIONS = [
  { id: "ai", label: "AI transition" },
  { id: "cut", label: "Cut" },
  { id: "fade", label: "Fade" },
  { id: "dissolve", label: "Dissolve" },
  { id: "zoom", label: "Zoom" },
  { id: "whip-pan", label: "Whip pan" },
  { id: "glitch", label: "Glitch" },
  { id: "flash", label: "Flash" },
  { id: "morph", label: "Morph" },
  { id: "spin", label: "Spin" },
  { id: "liquid", label: "Liquid" },
  { id: "particle", label: "Particle" },
  { id: "beat", label: "Beat cut" },
  { id: "camera", label: "Camera move" },
];

export const IMAGE_MOTIONS = [
  { id: "ai", label: "AI motion" },
  { id: "slow-zoom", label: "Slow zoom in" },
  { id: "zoom-out", label: "Zoom out" },
  { id: "pan-left", label: "Pan left" },
  { id: "pan-right", label: "Pan right" },
  { id: "pan-up", label: "Pan up" },
  { id: "pan-down", label: "Pan down" },
  { id: "parallax", label: "Parallax" },
  { id: "depth-3d", label: "3D depth" },
  { id: "rotate", label: "Rotate" },
  { id: "float", label: "Float" },
  { id: "shake", label: "Shake" },
  { id: "beat-pulse", label: "Beat pulse" },
  { id: "particle-reveal", label: "Particle reveal" },
  { id: "morph", label: "Morph" },
];

export const ORDER_MODES = [
  { id: "hybrid", label: "AI hybrid (recommended)" },
  { id: "ai", label: "AI decides" },
  { id: "upload", label: "Upload order" },
  { id: "manual", label: "Manual order" },
  { id: "beat", label: "Beat based" },
  { id: "lyrics", label: "Lyrics based" },
  { id: "story", label: "Story based" },
];

export const DIRECTOR_MODES = [
  { id: "auto", label: "Auto — AI directs everything" },
  { id: "guided", label: "Guided — AI suggests, you approve" },
  { id: "manual", label: "Manual — you control everything" },
];

export const LYRIC_MODES = [
  { id: "none", label: "Do not show lyrics" },
  { id: "line", label: "Line by line" },
  { id: "word", label: "Word by word" },
  { id: "karaoke", label: "Karaoke highlight" },
  { id: "keyword", label: "Important words only" },
  { id: "typography", label: "AI typography" },
  { id: "bilingual", label: "Original + translation" },
];

export const ASPECT_RATIOS = [
  { id: "16:9", label: "16:9 — landscape", ratio: 16 / 9 },
  { id: "9:16", label: "9:16 — vertical", ratio: 9 / 16 },
  { id: "1:1", label: "1:1 — square", ratio: 1 },
  { id: "21:9", label: "21:9 — cinemascope", ratio: 21 / 9 },
  { id: "4:5", label: "4:5 — feed", ratio: 4 / 5 },
];

export const SOCIAL_PRESETS = [
  { id: "youtube", label: "YouTube", aspect: "16:9", resolution: "1080p", fps: 30 },
  { id: "shorts", label: "YouTube Shorts", aspect: "9:16", resolution: "1080p", fps: 30 },
  { id: "reels", label: "Instagram Reels", aspect: "9:16", resolution: "1080p", fps: 30 },
  { id: "ig-post", label: "Instagram Post", aspect: "1:1", resolution: "1080p", fps: 30 },
  { id: "tiktok", label: "TikTok", aspect: "9:16", resolution: "1080p", fps: 60 },
  { id: "x", label: "X / Twitter", aspect: "16:9", resolution: "720p", fps: 30 },
  { id: "cinema", label: "Cinematic", aspect: "21:9", resolution: "4K", fps: 24 },
];

export const RESOLUTIONS = ["720p", "1080p", "2K", "4K"];
export const FPS_OPTIONS = [24, 30, 60];
export const AUDIO_KINDS = ["music", "vocals", "voiceover", "sfx", "ambience"] as const;

export const DURATION_OPTIONS = [
  { id: "ai", label: "AI decides" },
  { id: "audio", label: "Match audio length" },
  { id: "15", label: "15 seconds" },
  { id: "30", label: "30 seconds" },
  { id: "60", label: "60 seconds" },
];
