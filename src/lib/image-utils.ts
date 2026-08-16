import type { ImageAsset, ImageRole } from "./project-types";
import { uid } from "./project-types";

const MAX_DIM = 768;
const JPEG_QUALITY = 0.72;

export async function fileToImageAsset(file: File): Promise<ImageAsset> {
  const url = URL.createObjectURL(file);
  const img = await loadImage(url);
  URL.revokeObjectURL(url);

  const { canvas, dataUrl, width, height } = await downscale(img);
  const palette = await extractPalette(canvas);
  const brightness = computeBrightness(canvas);
  const contrast = computeContrast(canvas);
  const saturation = computeSaturation(canvas);
  const orientation =
    width > height * 1.1 ? "landscape" : height > width * 1.1 ? "portrait" : "square";

  return {
    id: uid(),
    name: file.name,
    url: URL.createObjectURL(file),
    dataUrl,
    width,
    height,
    orientation,
    palette,
    brightness,
    contrast,
    saturation,
    role: guessRole(palette, brightness, width, height),
    motion: "ai",
    locked: false,
    duration: null,
    status: "pending",
    subject: "",
    objects: [],
    faces: 0,
    style: "",
    mood: "",
    description: "",
  };
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error("Could not decode image"));
    img.src = src;
  });
}

async function downscale(img: HTMLImageElement) {
  const scale = Math.min(1, MAX_DIM / Math.max(img.width, img.height));
  const width = Math.max(1, Math.round(img.width * scale));
  const height = Math.max(1, Math.round(img.height * scale));
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas not supported");
  ctx.drawImage(img, 0, 0, width, height);
  const dataUrl = canvas.toDataURL("image/jpeg", JPEG_QUALITY);
  return { canvas, dataUrl, width, height };
}

async function extractPalette(canvas: HTMLCanvasElement): Promise<string[]> {
  const ctx = canvas.getContext("2d");
  if (!ctx) return ["#888888"];
  const sw = 8;
  const data = ctx.getImageData(0, 0, sw, Math.max(1, Math.floor((sw / canvas.width) * canvas.height))).data;
  const buckets = new Map<string, { count: number; r: number; g: number; b: number }>();
  for (let i = 0; i < data.length; i += 4) {
    const r = data[i]!;
    const g = data[i + 1]!;
    const b = data[i + 2]!;
    const qr = Math.round(r / 32) * 32;
    const qg = Math.round(g / 32) * 32;
    const qb = Math.round(b / 32) * 32;
    const key = `${qr},${qg},${qb}`;
    const existing = buckets.get(key);
    if (existing) {
      existing.count++;
      existing.r += r;
      existing.g += g;
      existing.b += b;
    } else {
      buckets.set(key, { count: 1, r, g, b });
    }
  }
  const sorted = [...buckets.values()].sort((a, b) => b.count - a.count).slice(0, 5);
  return sorted.map((c) =>
    rgbToHex(Math.round(c.r / c.count), Math.round(c.g / c.count), Math.round(c.b / c.count)),
  );
}

function rgbToHex(r: number, g: number, b: number) {
  return "#" + [r, g, b].map((v) => v.toString(16).padStart(2, "0")).join("");
}

function computeBrightness(canvas: HTMLCanvasElement): number {
  const ctx = canvas.getContext("2d");
  if (!ctx) return 0.5;
  const data = ctx.getImageData(0, 0, canvas.width, Math.min(canvas.height, 64)).data;
  let sum = 0;
  let n = 0;
  for (let i = 0; i < data.length; i += 4) {
    sum += (data[i]! + data[i + 1]! + data[i + 2]!) / 3;
    n++;
  }
  return n > 0 ? sum / n / 255 : 0.5;
}

function computeContrast(canvas: HTMLCanvasElement): number {
  const ctx = canvas.getContext("2d");
  if (!ctx) return 0.5;
  const data = ctx.getImageData(0, 0, canvas.width, Math.min(canvas.height, 64)).data;
  const vals: number[] = [];
  for (let i = 0; i < data.length; i += 4) {
    vals.push((data[i]! + data[i + 1]! + data[i + 2]!) / 3);
  }
  if (!vals.length) return 0.5;
  const mean = vals.reduce((a, b) => a + b, 0) / vals.length;
  const variance = vals.reduce((a, v) => a + (v - mean) ** 2, 0) / vals.length;
  return Math.min(1, Math.sqrt(variance) / 80);
}

function computeSaturation(canvas: HTMLCanvasElement): number {
  const ctx = canvas.getContext("2d");
  if (!ctx) return 0.5;
  const data = ctx.getImageData(0, 0, canvas.width, Math.min(canvas.height, 64)).data;
  let sum = 0;
  let n = 0;
  for (let i = 0; i < data.length; i += 4) {
    const r = data[i]!;
    const g = data[i + 1]!;
    const b = data[i + 2]!;
    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    sum += max === 0 ? 0 : (max - min) / max;
    n++;
  }
  return n > 0 ? sum / n : 0.5;
}

function guessRole(
  palette: string[],
  brightness: number,
  width: number,
  height: number,
): ImageRole {
  if (width > height * 1.6 || height > width * 1.6) return "background";
  if (brightness < 0.3 || brightness > 0.85) return "logo";
  return "character";
}

export function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = String(reader.result);
      resolve(result.slice(result.indexOf(",") + 1));
    };
    reader.onerror = () => reject(new Error("Could not read the file"));
    reader.readAsDataURL(file);
  });
}
