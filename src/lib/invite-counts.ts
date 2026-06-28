import type { GuestEntry } from "@/lib/types";

export function getLedgerAdults(entry: GuestEntry): number {
  return entry.ladiesCount + entry.gentsCount;
}

/** Values shown in invite count inputs (unset = 0). */
export function getInviteAdultsDisplay(entry: GuestEntry): number {
  return entry.inviteAdultsCount ?? 0;
}

export function getInviteKidsDisplay(entry: GuestEntry): number {
  return entry.inviteKidsCount ?? 0;
}

/** Values rendered on the boarding pass (unset falls back to ledger). */
export function getInviteAdults(entry: GuestEntry): number {
  return entry.inviteAdultsCount ?? getLedgerAdults(entry);
}

export function getInviteKids(entry: GuestEntry): number {
  return entry.inviteKidsCount ?? entry.kidsCount;
}

export function fillInviteCountsFromLedger(entry: GuestEntry): Pick<
  GuestEntry,
  "inviteAdultsCount" | "inviteKidsCount"
> {
  return {
    inviteAdultsCount: getLedgerAdults(entry),
    inviteKidsCount: entry.kidsCount,
  };
}

export function withFilledInviteCounts(entry: GuestEntry): GuestEntry {
  return { ...entry, ...fillInviteCountsFromLedger(entry) };
}
