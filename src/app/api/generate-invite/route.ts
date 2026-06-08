import { readFileSync } from "fs";
import { join } from "path";
import { NextRequest, NextResponse } from "next/server";
import { createCanvas, loadImage } from "canvas";
import type { GuestEntry, OverlayCoords } from "@/lib/types";
import { DEFAULT_COORDS } from "@/lib/types";
import {
  drawGuestOverlay,
  generateFallbackTemplate,
} from "@/lib/canvas-utils";
import { registerServerCanvasFonts } from "@/lib/server-canvas-fonts";

registerServerCanvasFonts();

function loadDefaultTemplate() {
  const templatePath = join(process.cwd(), "public", "invitation-template.jpg");
  const buffer = readFileSync(templatePath);
  return `data:image/jpeg;base64,${buffer.toString("base64")}`;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      guest,
      coords = DEFAULT_COORDS,
      templateImage,
    } = body as {
      guest: GuestEntry;
      coords?: OverlayCoords;
      templateImage?: string | null;
    };

    if (!guest) {
      return NextResponse.json({ error: "Guest data is required." }, { status: 400 });
    }

    let canvas;
    let ctx;

    const resolvedTemplate = templateImage ?? loadDefaultTemplate();

    if (resolvedTemplate) {
      const img = await loadImage(resolvedTemplate);
      canvas = createCanvas(img.width, img.height);
      ctx = canvas.getContext("2d");
      ctx.drawImage(img, 0, 0);
      drawGuestOverlay(ctx, guest, coords);
    } else {
      canvas = createCanvas(800, 1000);
      ctx = canvas.getContext("2d");
      generateFallbackTemplate(ctx, 800, 1000, guest.cleanedNames, {
        ladies: guest.ladiesCount,
        gents: guest.gentsCount,
        kids: guest.kidsCount,
      });
    }

    const jpegBuffer = canvas.toBuffer("image/jpeg", { quality: 0.9 });
    const base64 = `data:image/jpeg;base64,${jpegBuffer.toString("base64")}`;

    return NextResponse.json({ image: base64 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to generate invite.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
