import type { GuestEntry, OverlayCoords } from "@/lib/types";
import {
  buildCountFont,
  buildNameFont,
  formatInviteCount,
} from "@/lib/canvas-fonts";
import {
  formatPassAdultInvite,
  formatPassKidsInvite,
} from "@/lib/invite-counts";
import { registerServerCanvasFonts } from "@/lib/server-canvas-fonts";

registerServerCanvasFonts();

type CanvasContext = import("canvas").CanvasRenderingContext2D;

export function generateFallbackTemplate(
  ctx: CanvasContext,
  width: number,
  height: number,
  guestName = "Passenger Name",
  counts = { ladies: 0, gents: 0, kids: 0 },
) {
  const w = width;
  const h = height;

  ctx.fillStyle = "#FAF6F0";
  ctx.fillRect(0, 0, w, h);

  ctx.fillStyle = "#BF3B2B";
  ctx.fillRect(0, 0, 160, h);

  ctx.save();
  ctx.translate(90, h / 2);
  ctx.rotate(-Math.PI / 2);
  ctx.fillStyle = "#FFFFFF";
  ctx.font = "bold 36px Courier New, monospace";
  ctx.textAlign = "center";
  ctx.fillText("BOARDING PASS", 0, 0);
  ctx.restore();

  ctx.strokeStyle = "rgba(255,255,255,0.3)";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(80, 180, 50, 0, Math.PI * 2);
  ctx.stroke();

  ctx.fillStyle = "#BF3B2B";
  ctx.font = "48px serif";
  ctx.fillText("✈", 220, 110);

  ctx.fillStyle = "#2C3E50";
  ctx.font = "bold 32px serif";
  ctx.fillText("Nafeesa's 1st Birthday", 300, 100);

  ctx.fillStyle = "#7F8C8D";
  ctx.font = "14px Courier New";
  ctx.fillText("NAFEESA AIRLINES", 300, 130);

  ctx.strokeStyle = "#BDC3C7";
  ctx.setLineDash([5, 5]);
  ctx.beginPath();
  ctx.moveTo(270, 120);
  ctx.lineTo(700, 120);
  ctx.stroke();
  ctx.setLineDash([]);

  ctx.fillStyle = "#FFFFFF";
  ctx.shadowColor = "rgba(0,0,0,0.05)";
  ctx.shadowBlur = 10;
  ctx.fillRect(200, 170, 550, 680);
  ctx.shadowColor = "transparent";

  ctx.fillStyle = "#BF3B2B";
  ctx.font = "bold 16px Courier New";
  ctx.fillText("PASSENGER NAME:-", 230, 220);

  ctx.fillStyle = "#2C3E50";
  ctx.font = 'italic bold 24px "Times New Roman", Georgia, serif';
  ctx.fillText(guestName, 230, 260);

  ctx.fillStyle = "#555555";
  ctx.font = "16px serif";
  ctx.fillText("Destination:  Panje-Saheed Hall, Khanpur", 230, 320);
  ctx.fillText("Your Departure: Tue, 7th July 2026, 08:00 PM", 230, 350);

  ctx.strokeStyle = "#E0DCD3";
  ctx.beginPath();
  ctx.moveTo(230, 390);
  ctx.lineTo(720, 390);
  ctx.stroke();

  ctx.fillStyle = "#7F8C8D";
  ctx.font = "italic 16px serif";
  ctx.textAlign = "center";
  ctx.fillText("بِسْمِ اللهِ الرَّحْمٰنِ الرَّحِيْمِ", 475, 420);
  ctx.textAlign = "left";

  ctx.fillStyle = "#333333";
  ctx.font = "14px serif";
  ctx.fillText("شریف محفل میں تشریف لا کر ہماری رونق کو بڑھائیے", 260, 460);
  ctx.fillText(
    "نعتوں کے مطار میں لینڈنگ کریں، خوشیوں میں اڑان بھریں",
    260,
    490,
  );

  ctx.fillStyle = "#000000";
  for (let i = 0; i < 40; i++) {
    const barWidth = i % 3 === 0 ? 4 : 1;
    ctx.fillRect(230 + i * 6, 540, barWidth, 50);
  }
  ctx.font = "10px Courier New";
  ctx.fillText("* NAFEESA-AIR-01 *", 310, 605);

  ctx.fillStyle = "#F5F5F5";
  ctx.fillRect(230, 650, 490, 80);
  ctx.strokeStyle = "#D0C0B0";
  ctx.strokeRect(230, 650, 490, 80);

  ctx.fillStyle = "#BF3B2B";
  ctx.font = "bold 16px Courier New";
  const totalInvitees = counts.ladies + counts.gents;
  ctx.fillText(`INVITEES: ( ${formatInviteCount(totalInvitees)} )`, 260, 695);
  ctx.fillText(`KIDS: ( ${formatInviteCount(counts.kids)} )`, 500, 695);

  ctx.fillStyle = "#7F8C8D";
  ctx.font = "12px Courier New";
  ctx.fillText("Thank you for joining our family celebrations!", 230, 770);
  ctx.fillText("Please scan the RSVP Link to confirm attendance.", 230, 790);
}

export function drawGuestOverlay(
  ctx: CanvasContext,
  guest: GuestEntry,
  coords: OverlayCoords,
) {
  ctx.fillStyle = "#C2362B";
  ctx.font = buildNameFont(coords.fontSize);
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(guest.cleanedNames, coords.nameX, coords.nameY);

  ctx.fillStyle = "#BF3B2B";
  ctx.font = buildCountFont(coords.countFontSize);
  ctx.textAlign = "center";
  ctx.fillText(formatPassAdultInvite(guest), coords.inviteesX, coords.inviteesY);
  ctx.fillText(formatPassKidsInvite(guest), coords.kidsX, coords.kidsY);

  ctx.textAlign = "left";
  ctx.textBaseline = "alphabetic";
}
