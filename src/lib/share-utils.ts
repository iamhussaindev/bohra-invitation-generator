import { compressDataUrlToJpeg, dataUrlToBlob } from "@/lib/invite-image";

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
  const jpegDataUrl = await compressDataUrlToJpeg(dataUrl);
  const blob = await dataUrlToBlob(jpegDataUrl);
  return new File([blob], filename.replace(/\.png$/i, ".jpg"), { type: "image/jpeg" });
}

function triggerDownload(file: File) {
  const url = URL.createObjectURL(file);
  const link = document.createElement("a");
  link.href = url;
  link.download = file.name;
  link.style.display = "none";
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  setTimeout(() => URL.revokeObjectURL(url), 2000);
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

  const whatsappWindow = window.open(buildWhatsAppUrl(text), "_blank");
  if (!whatsappWindow) {
    await navigator.clipboard.writeText(text);
    throw new Error("Popup blocked. Image downloaded and RSVP text copied — paste in WhatsApp.");
  }

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
