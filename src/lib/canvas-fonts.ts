export const INVITE_NAME_FONT = "InviteName";
export const INVITE_COUNT_FONT = "InviteCount";

export function buildNameFont(size: number): string {
  return `italic bold ${size}px ${INVITE_NAME_FONT}`;
}

export function buildCountFont(size: number): string {
  return `bold ${size}px ${INVITE_COUNT_FONT}`;
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
