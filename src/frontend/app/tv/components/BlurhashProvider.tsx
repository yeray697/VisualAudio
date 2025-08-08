import {
  createContext,
  useContext,
  useEffect,
  useState,
  ReactNode,
} from "react";
import { encode } from "blurhash";
import tinycolor from "tinycolor2";

interface BlurhashContextProps {
  blurhash: string | null;
  textColor: string;
  fadedTextColor: string;
  overlayColor: string;
  dominantColor: string;
  loading: boolean;
  error: Error | null;
  setImageUrl: (url: string | undefined) => void;
}

const BlurhashContext = createContext<BlurhashContextProps | undefined>(
  undefined
);

function getImageData(
  image: HTMLImageElement,
  width: number,
  height: number
): ImageData {
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;

  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas context not available");

  ctx.drawImage(image, 0, 0, width, height);
  return ctx.getImageData(0, 0, width, height);
}

function calculateAverageLuminance(pixels: Uint8ClampedArray): number {
  let total = 0;
  const count = pixels.length / 4;
  for (let i = 0; i < pixels.length; i += 4) {
    const r = pixels[i];
    const g = pixels[i + 1];
    const b = pixels[i + 2];
    const luminance = 0.2126 * r + 0.7152 * g + 0.0722 * b;
    total += luminance;
  }
  return total / count;
}

function getOverlayColorFromLuminance(luminance: number): string {
  const darkness = Math.max(0, Math.min(1, 1 - luminance / 255));
  const alpha = 0.15 + 0.35 * darkness;
  return `rgba(0, 0, 0, ${alpha.toFixed(2)})`;
}

function calculateDominantColor(pixels: Uint8ClampedArray): string {
  let rTotal = 0,
    gTotal = 0,
    bTotal = 0;
  const count = pixels.length / 4;
  for (let i = 0; i < pixels.length; i += 4) {
    rTotal += pixels[i];
    gTotal += pixels[i + 1];
    bTotal += pixels[i + 2];
  }
  return `rgb(${Math.round(rTotal / count)}, ${Math.round(
    gTotal / count
  )}, ${Math.round(bTotal / count)})`;
}

function getReadableTextColor(luminance: number): string {
  if (luminance < 60) return "#f0f0f0";
  if (luminance < 128) return "#e0e0e0";
  if (luminance < 180) return "#333333";
  return "#222222";
}

export const BlurhashProvider = ({ children }: { children: ReactNode }) => {
  const [imageUrl, setImageUrl] = useState<string | undefined>(undefined);
  const [blurhash, setBlurhash] = useState<string | null>(null);
  const [textColor, setTextColor] = useState<string>("#fff");
  const [fadedTextColor, setFadedTextColor] = useState<string>("rgba(255,255,255,0.6)");
  const [overlayColor, setOverlayColor] = useState<string>("rgba(0,0,0,0.3)");
  const [dominantColor, setDominantColor] = useState<string>("rgb(255,255,255)");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!imageUrl) return;

    const generate = async () => {
      setLoading(true);
      setError(null);

      try {
        const img = new Image();
        img.crossOrigin = "anonymous";
        img.src = imageUrl;

        await new Promise<void>((resolve, reject) => {
          img.onload = () => resolve();
          img.onerror = reject;
        });

        const width = 64;
        const height = Math.round((img.height / img.width) * width);
        const imageData = getImageData(img, width, height);
        const pixels = imageData.data;

        const hash = encode(pixels, width, height, 4, 4);
        const luminance = calculateAverageLuminance(pixels);
        const overlay = getOverlayColorFromLuminance(luminance);
        const text = getReadableTextColor(luminance);
        const dominant = calculateDominantColor(pixels);
        const faded = tinycolor(text).setAlpha(0.5).toRgbString(); // ← nuevo color derivado

        setBlurhash(hash);
        setTextColor(text);
        setFadedTextColor(faded);
        setOverlayColor(overlay);
        setDominantColor(dominant);
      } catch (err) {
        setError(err as Error);
        setBlurhash(null);
        setTextColor("#fff");
        setFadedTextColor("rgba(255,255,255,0.6)");
        setOverlayColor("rgba(0,0,0,0.3)");
        setDominantColor("rgb(255,255,255)");
      } finally {
        setLoading(false);
      }
    };

    generate();
  }, [imageUrl]);

  return (
    <BlurhashContext.Provider
      value={{
        blurhash,
        textColor,
        fadedTextColor,
        overlayColor,
        dominantColor,
        loading,
        error,
        setImageUrl,
      }}
    >
      {children}
    </BlurhashContext.Provider>
  );
};

export function useBlurhashContext() {
  const context = useContext(BlurhashContext);
  if (!context) {
    throw new Error("useBlurhashContext must be used within a BlurhashProvider");
  }
  return context;
}
