import type { GuestEntry, GuestSection } from "@/lib/types";
import { formatInviteCount } from "@/lib/canvas-fonts";

export function getLedgerAdults(entry: GuestEntry): number {
  return entry.ladiesCount + entry.gentsCount;
}

export function getLedgerKids(entry: GuestEntry): number {
  return entry.kidsCount;
}

export function getInviteAdultsLabel(entry: GuestEntry): string {
  if (entry.inviteAllAdults) return "All";
  if (entry.inviteAdultsCount != null) return String(entry.inviteAdultsCount);
  return String(getLedgerAdults(entry));
}

export function getInviteKidsLabel(entry: GuestEntry): string {
  if (entry.inviteAllKids) return "All";
  if (entry.inviteKidsCount != null) return String(entry.inviteKidsCount);
  return String(getLedgerKids(entry));
}

export function getInviteAdults(entry: GuestEntry): number {
  if (entry.inviteAdultsCount != null) return entry.inviteAdultsCount;
  return getLedgerAdults(entry);
}

export function getInviteKids(entry: GuestEntry): number {
  if (entry.inviteKidsCount != null) return entry.inviteKidsCount;
  return getLedgerKids(entry);
}

export function revertInviteCounts(entry: GuestEntry): Pick<
  GuestEntry,
  "inviteAdultsCount" | "inviteKidsCount" | "inviteAllAdults" | "inviteAllKids"
> {
  return {
    inviteAdultsCount: getLedgerAdults(entry),
    inviteKidsCount: getLedgerKids(entry),
    inviteAllAdults: false,
    inviteAllKids: false,
  };
}

export function getInviteAdultsInputValue(entry: GuestEntry): number {
  if (!entry.inviteAllAdults && entry.inviteAdultsCount != null) {
    return entry.inviteAdultsCount;
  }
  return getLedgerAdults(entry);
}

export function getInviteKidsInputValue(entry: GuestEntry): number {
  if (!entry.inviteAllKids && entry.inviteKidsCount != null) {
    return entry.inviteKidsCount;
  }
  return getLedgerKids(entry);
}

export function isInviteCountsModified(entry: GuestEntry): boolean {
  return (
    Boolean(entry.inviteAllAdults) ||
    Boolean(entry.inviteAllKids) ||
    (entry.inviteAdultsCount != null &&
      entry.inviteAdultsCount !== getLedgerAdults(entry)) ||
    (entry.inviteKidsCount != null && entry.inviteKidsCount !== getLedgerKids(entry))
  );
}

/** Add All — show "All" on the boarding pass for adults (and kids when ledger has kids). */
export function applyAddAllInvites(entry: GuestEntry): Pick<
  GuestEntry,
  "inviteAllAdults" | "inviteAllKids"
> {
  return {
    inviteAllAdults: true,
    inviteAllKids: getLedgerKids(entry) > 0,
  };
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
  }

  if (updatedFields.inviteAdultsCount != null && updatedFields.inviteAllAdults !== true) {
    nextEntry.inviteAllAdults = false;
  }

  if (updatedFields.inviteKidsCount != null && updatedFields.inviteAllKids !== true) {
    nextEntry.inviteAllKids = false;
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

export function applyAddAllInvitesToSections(sections: GuestSection[]): GuestSection[] {
  return sections.map((section) => ({
    ...section,
    entries: section.entries.map((entry) => ({
      ...entry,
      ...applyAddAllInvites(entry),
    })),
  }));
}

export function applyAddAllInvitesToGuest(
  sections: GuestSection[],
  guestId: string
): GuestSection[] {
  return sections.map((section) => ({
    ...section,
    entries: section.entries.map((entry) =>
      entry.id === guestId ? { ...entry, ...applyAddAllInvites(entry) } : entry
    ),
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
