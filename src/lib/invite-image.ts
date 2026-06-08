export async function compressDataUrlToJpeg(dataUrl: string, maxWidth = 1600, quality = 0.92): Promise<string> {
  const image = await loadImageElement(dataUrl);
  const scale = Math.min(1, maxWidth / image.width);
  const width = Math.max(1, Math.round(image.width * scale));
  const height = Math.max(1, Math.round(image.height * scale));

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Could not prepare invite image.");

  ctx.drawImage(image, 0, 0, width, height);
  return canvas.toDataURL("image/jpeg", quality);
}

export async function dataUrlToBlob(dataUrl: string): Promise<Blob> {
  const response = await fetch(dataUrl);
  if (!response.ok) throw new Error("Could not read invite image.");
  return response.blob();
}

function isIosDevice(): boolean {
  if (typeof navigator === "undefined") return false;
  const ua = navigator.userAgent;
  return (
    /iPad|iPhone|iPod/.test(ua) ||
    (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1)
  );
}

async function shareOrOpenImage(file: File): Promise<void> {
  if (typeof navigator !== "undefined" && navigator.share) {
    const payload: ShareData = { files: [file], title: "Boarding Pass" };
    if (!navigator.canShare || navigator.canShare(payload)) {
      await navigator.share(payload);
      return;
    }
  }

  const url = URL.createObjectURL(file);
  const opened = window.open(url, "_blank");
  if (!opened) {
    URL.revokeObjectURL(url);
    throw new Error("Could not open image. Allow popups or use Share on WhatsApp instead.");
  }
  setTimeout(() => URL.revokeObjectURL(url), 60000);
}

export async function downloadInviteImage(dataUrl: string, filename: string): Promise<void> {
  const jpegDataUrl = dataUrl.startsWith("data:image/jpeg")
    ? dataUrl
    : await compressDataUrlToJpeg(dataUrl);

  const blob = await dataUrlToBlob(jpegDataUrl);
  const file = new File([blob], filename.replace(/\.png$/i, ".jpg"), { type: "image/jpeg" });

  if (isIosDevice()) {
    try {
      await shareOrOpenImage(file);
    } catch (error) {
      if ((error as Error).name === "AbortError") return;
      throw error;
    }
    return;
  }

  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = file.name;
  link.style.display = "none";
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  setTimeout(() => URL.revokeObjectURL(url), 2000);
}

export function getCanvasImageDataUrl(canvas: HTMLCanvasElement | null): string | null {
  if (!canvas || canvas.width === 0 || canvas.height === 0) return null;
  try {
    return canvas.toDataURL("image/png");
  } catch {
    return null;
  }
}

function loadImageElement(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error("Could not load invite image."));
    image.src = src;
  });
}
