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
