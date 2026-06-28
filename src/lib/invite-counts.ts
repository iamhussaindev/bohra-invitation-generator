import type { GuestEntry, GuestSection } from "@/lib/types";
import { formatInviteCount } from "@/lib/canvas-fonts";

export function getLedgerAdults(entry: GuestEntry): number {
  return entry.ladiesCount + entry.gentsCount;
}

export function getLedgerKids(entry: GuestEntry): number {
  return entry.kidsCount;
}

/** Label shown in invite count inputs. */
export function getInviteAdultsLabel(entry: GuestEntry): string {
  if (entry.inviteAllAdults) return "All";
  return String(entry.inviteAdultsCount ?? 0);
}

export function getInviteKidsLabel(entry: GuestEntry): string {
  if (entry.inviteAllKids) return "All";
  return String(entry.inviteKidsCount ?? 0);
}

/** Values rendered on the boarding pass (unset falls back to ledger). */
export function getInviteAdults(entry: GuestEntry): number {
  if (entry.inviteAdultsCount != null) return entry.inviteAdultsCount;
  return getLedgerAdults(entry);
}

export function getInviteKids(entry: GuestEntry): number {
  if (entry.inviteKidsCount != null) return entry.inviteKidsCount;
  return getLedgerKids(entry);
}

export function fillInviteCountsFromLedger(entry: GuestEntry): Pick<
  GuestEntry,
  "inviteAdultsCount" | "inviteKidsCount" | "inviteAllAdults" | "inviteAllKids"
> {
  const ledgerAdults = getLedgerAdults(entry);
  const ledgerKids = getLedgerKids(entry);

  if (ledgerAdults === 0 && ledgerKids === 0 && entry.totalCount > 0) {
    return {
      inviteAdultsCount: entry.totalCount,
      inviteKidsCount: 0,
      inviteAllAdults: true,
      inviteAllKids: false,
    };
  }

  return {
    inviteAdultsCount: ledgerAdults,
    inviteKidsCount: ledgerKids,
    inviteAllAdults: ledgerAdults > 0 || entry.totalCount > 0,
    inviteAllKids: ledgerKids > 0,
  };
}

export function withFilledInviteCounts(entry: GuestEntry): GuestEntry {
  return { ...entry, ...fillInviteCountsFromLedger(entry) };
}

export function applyEntryUpdate(
  sections: GuestSection[],
  sectionIdx: number,
  entryIdx: number,
  updatedFields: Partial<GuestEntry>
): GuestSection[] {
  const section = sections[sectionIdx];
  const entry = section?.entries[entryIdx];
  if (!section || !entry) return sections;

  const nextEntry: GuestEntry = {
    ...entry,
    ...updatedFields,
    totalCount:
      (updatedFields.ladiesCount ?? entry.ladiesCount) +
      (updatedFields.gentsCount ?? entry.gentsCount) +
      (updatedFields.kidsCount ?? entry.kidsCount),
  };

  if (
    updatedFields.ladiesCount != null ||
    updatedFields.gentsCount != null ||
    updatedFields.kidsCount != null
  ) {
    nextEntry.inviteAllAdults = false;
    nextEntry.inviteAllKids = false;
  } else {
    if (updatedFields.inviteAdultsCount != null && updatedFields.inviteAllAdults !== true) {
      nextEntry.inviteAllAdults = false;
    }
    if (updatedFields.inviteKidsCount != null && updatedFields.inviteAllKids !== true) {
      nextEntry.inviteAllKids = false;
    }
  }

  return sections.map((currentSection, sIdx) => {
    if (sIdx !== sectionIdx) return currentSection;

    return {
      ...currentSection,
      entries: currentSection.entries.map((currentEntry, eIdx) =>
        eIdx === entryIdx ? nextEntry : currentEntry
      ),
    };
  });
}

export function applyFillAllInvites(sections: GuestSection[]): GuestSection[] {
  return sections.map((section) => ({
    ...section,
    entries: section.entries.map((entry) => ({
      ...entry,
      ...fillInviteCountsFromLedger(entry),
    })),
  }));
}

export function findGuestEntry(
  sections: GuestSection[],
  guestId: string
): GuestEntry | null {
  for (const section of sections) {
    const entry = section.entries.find((candidate) => candidate.id === guestId);
    if (entry) return entry;
  }
  return null;
}

export function formatPassAdultInvite(entry: GuestEntry): string {
  if (entry.inviteAllAdults) return "All";
  return formatInviteCount(getInviteAdults(entry));
}

export function formatPassKidsInvite(entry: GuestEntry): string {
  if (entry.inviteAllKids) return "All";
  return formatInviteCount(getInviteKids(entry));
}

export function formatShareAdultInvite(entry: GuestEntry): string {
  if (entry.inviteAllAdults) return "All";
  return String(getInviteAdults(entry));
}

export function formatShareKidsInvite(entry: GuestEntry): string {
  if (entry.inviteAllKids) return "All";
  return String(getInviteKids(entry));
}
