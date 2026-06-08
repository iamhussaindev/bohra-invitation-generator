function getAppBaseUrl(): string {
  if (typeof window !== "undefined") return window.location.origin;
  return process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
}

export function buildShareText(options: {
  guestName: string;
  invitees: number;
  kids: number;
  rsvpUrl: string;
}): string {
  return [
    "✈ Your boarding pass for Nafeesa's 1st Birthday!",
    "",
    `Passenger: ${options.guestName}`,
    `Invitees: ${options.invitees} | Kids: ${options.kids}`,
    "",
    `RSVP here: ${options.rsvpUrl}`,
  ].join("\n");
}

export function buildWhatsAppUrl(text: string): string {
  return `https://wa.me/?text=${encodeURIComponent(text)}`;
}

async function imageFileFromDataUrl(dataUrl: string, filename: string): Promise<File> {
  const image = await loadImage(dataUrl);
  const maxWidth = 1600;
  const scale = Math.min(1, maxWidth / image.width);
  const width = Math.max(1, Math.round(image.width * scale));
  const height = Math.max(1, Math.round(image.height * scale));

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Could not prepare image for sharing.");

  ctx.drawImage(image, 0, 0, width, height);

  const blob = await new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(
      (result) => (result ? resolve(result) : reject(new Error("Could not create share image."))),
      "image/jpeg",
      0.92
    );
  });

  return new File([blob], filename.replace(/\.png$/i, ".jpg"), { type: "image/jpeg" });
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error("Could not load invite image."));
    image.src = src;
  });
}

function triggerDownload(file: File) {
  const url = URL.createObjectURL(file);
  const link = document.createElement("a");
  link.href = url;
  link.download = file.name;
  link.click();
  URL.revokeObjectURL(url);
}

export type ShareInviteResult = "shared" | "whatsapp" | "downloaded";

export async function shareInviteWithImage(options: {
  imageDataUrl: string;
  guestName: string;
  invitees: number;
  kids: number;
  rsvpUrl: string;
}): Promise<ShareInviteResult> {
  const filename = `boarding-pass-${options.guestName.replace(/\s+/g, "_")}.png`;
  const file = await imageFileFromDataUrl(options.imageDataUrl, filename);
  const text = buildShareText(options);

  if (typeof navigator !== "undefined" && navigator.share) {
    const payload: ShareData = {
      title: "Nafeesa Airlines Boarding Pass",
      text,
      files: [file],
    };

    const canShareFiles = !navigator.canShare || navigator.canShare(payload);
    if (canShareFiles) {
      try {
        await navigator.share(payload);
        return "shared";
      } catch (error) {
        if ((error as Error).name === "AbortError") throw error;
      }
    }

    try {
      await navigator.share({ title: payload.title, text });
      return "shared";
    } catch (error) {
      if ((error as Error).name === "AbortError") throw error;
    }
  }

  triggerDownload(file);
  window.open(buildWhatsAppUrl(text), "_blank", "noopener,noreferrer");
  return "whatsapp";
}

export function getRsvpPageUrl(
  guest: { cleanedNames: string; ladiesCount: number; gentsCount: number; kidsCount: number },
  code: string
): string {
  const params = new URLSearchParams({
    code,
    g: guest.cleanedNames,
    l: String(guest.ladiesCount),
    gt: String(guest.gentsCount),
    k: String(guest.kidsCount),
  });
  return `${getAppBaseUrl()}/rsvp?${params.toString()}`;
}
