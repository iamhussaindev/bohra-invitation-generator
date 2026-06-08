import { createCanvas, loadImage } from "canvas";
import { writeFileSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const templatePath = join(__dirname, "../public/invitation-template.jpg");

// Estimated positions for 3296x4157 template (PASSANGER NAME top, INVITEES/KIDS bottom)
const coords = {
  nameX: 1482,
  nameY: 672,
  inviteesX: 1529,
  inviteesY: 3893,
  kidsX: 2141,
  kidsY: 3898,
  fontSize: 83,
  countFontSize: 90,
  fontFamily: '"Times New Roman", Georgia, serif',
};

const img = await loadImage(templatePath);
const canvas = createCanvas(img.width, img.height);
const ctx = canvas.getContext("2d");
ctx.drawImage(img, 0, 0);

ctx.strokeStyle = "rgba(255,0,0,0.5)";
ctx.lineWidth = 4;
ctx.strokeRect(coords.nameX - 200, coords.nameY - 60, 400, 80);
ctx.strokeRect(coords.inviteesX - 40, coords.inviteesY - 40, 80, 60);
ctx.strokeRect(coords.kidsX - 40, coords.kidsY - 40, 80, 60);

ctx.fillStyle = "#C2362B";
ctx.font = `italic bold ${coords.fontSize}px ${coords.fontFamily}`;
ctx.textAlign = "center";
ctx.fillText("Abbasbhai Mithaiwala", coords.nameX, coords.nameY);

ctx.fillStyle = "#BF3B2B";
ctx.font = "bold 54px Courier New, monospace";
ctx.textAlign = "left";
ctx.fillText("4", coords.inviteesX, coords.inviteesY);
ctx.fillText("1", coords.kidsX, coords.kidsY);

const out = join(__dirname, "../public/calibration-preview.png");
writeFileSync(out, canvas.toBuffer("image/png"));
console.log(`Saved ${out} (${img.width}x${img.height})`);
