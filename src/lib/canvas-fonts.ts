export const INVITE_NAME_FONT = "InviteName";
export const INVITE_COUNT_FONT = "InviteCount";

export function buildNameFont(size: number): string {
  return `italic bold ${size}px ${INVITE_NAME_FONT}`;
}

export function buildCountFont(size: number): string {
  return `bold ${size}px ${INVITE_COUNT_FONT}`;
}

/** Slightly smaller count font when the label is "All" so it fits the brackets. */
export function buildPassCountFont(baseSize: number, displayValue: string): string {
  const size = displayValue === "All" ? Math.round(baseSize * 0.72) : baseSize;
  return buildCountFont(size);
}

export function formatInviteCount(count: number): string {
  return count === 0 ? "-" : String(count);
}

export async function ensureInviteFontsLoaded(): Promise<void> {
  if (typeof document === "undefined") return;

  await Promise.all([
    document.fonts.load(buildNameFont(83)),
    document.fonts.load(buildCountFont(90)),
  ]);
}
