import { existsSync } from "fs";
import { join } from "path";
import { registerFont } from "canvas";
import { INVITE_COUNT_FONT, INVITE_NAME_FONT } from "@/lib/canvas-fonts";

let fontsRegistered = false;

export function registerServerCanvasFonts(): void {
  if (fontsRegistered) return;

  const fontsDir = join(process.cwd(), "public", "fonts");
  const nameFontPath = join(fontsDir, "LibreBaskerville-BoldItalic.ttf");
  const countFontPath = join(fontsDir, "RobotoMono-Bold.ttf");

  if (!existsSync(nameFontPath) || !existsSync(countFontPath)) {
    throw new Error(
      "Invite fonts missing on server. Ensure public/fonts is deployed with the app."
    );
  }

  registerFont(nameFontPath, {
    family: INVITE_NAME_FONT,
    weight: "bold",
    style: "italic",
  });

  registerFont(countFontPath, {
    family: INVITE_COUNT_FONT,
    weight: "bold",
  });

  fontsRegistered = true;
}
