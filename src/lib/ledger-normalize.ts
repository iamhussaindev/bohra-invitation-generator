import { capitalizeGuestName, formatGuestName } from "@/lib/name-utils";
import { withFilledInviteCounts } from "@/lib/invite-counts";
import type { GuestEntry, GuestGender, GuestSection } from "@/lib/types";

function toNumber(value: unknown, fallback = 0): number {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed >= 0 ? Math.round(parsed) : fallback;
}

function toGender(value: unknown): GuestGender {
  if (value === "ladies" || value === "gents" || value === "mixed") return value;
  return "mixed";
}

function normalizeEntry(raw: unknown, index: number, sectionIdx: number): GuestEntry | null {
  if (!raw || typeof raw !== "object") return null;

  const entry = raw as Record<string, unknown>;
  const originalText = String(
    entry.originalText ?? entry.name ?? entry.rawName ?? entry.text ?? ""
  ).trim();
  const ladiesCount = toNumber(entry.ladiesCount ?? entry.ladies);
  const gentsCount = toNumber(entry.gentsCount ?? entry.gents);
  const kidsCount = toNumber(entry.kidsCount ?? entry.kids ?? entry.reds);
  const totalCount = toNumber(entry.totalCount ?? entry.total, ladiesCount + gentsCount + kidsCount);
  const gender = toGender(entry.gender);

  const rawName = String(entry.cleanedNames ?? entry.name ?? entry.cleanedName ?? originalText).trim();
  const cleanedNames = formatGuestName(rawName, gender, ladiesCount, gentsCount);

  if (!cleanedNames) return null;

  return withFilledInviteCounts({
    id: String(entry.id ?? `ledger-${sectionIdx}-${index}-${Date.now()}`),
    originalText: originalText || cleanedNames,
    cleanedNames,
    gender,
    ladiesCount,
    gentsCount,
    kidsCount,
    totalCount,
  });
}

function normalizeSection(raw: unknown, sectionIdx: number): GuestSection | null {
  if (!raw || typeof raw !== "object") return null;

  const section = raw as Record<string, unknown>;
  const sectionName = capitalizeGuestName(
    String(section.sectionName ?? section.name ?? `Section ${sectionIdx + 1}`).trim()
  );
  const rawEntries = Array.isArray(section.entries)
    ? section.entries
    : Array.isArray(section.guests)
      ? section.guests
      : [];

  const entries = rawEntries
    .map((entry, entryIdx) => normalizeEntry(entry, entryIdx, sectionIdx))
    .filter((entry): entry is GuestEntry => entry !== null);

  if (!sectionName && entries.length === 0) return null;

  return {
    sectionName: sectionName || `Section ${sectionIdx + 1}`,
    entries,
  };
}

function extractRawSections(payload: unknown): unknown[] {
  if (Array.isArray(payload)) return payload;

  if (!payload || typeof payload !== "object") return [];

  const data = payload as Record<string, unknown>;
  if (Array.isArray(data.sections)) return data.sections;
  if (Array.isArray(data.guests)) return [{ sectionName: "Guests", entries: data.guests }];
  if (Array.isArray(data.entries)) return [{ sectionName: "Guests", entries: data.entries }];

  return [];
}

export function normalizeLedgerSections(payload: unknown): GuestSection[] {
  const sections = extractRawSections(payload)
    .map((section, sectionIdx) => normalizeSection(section, sectionIdx))
    .filter((section): section is GuestSection => section !== null && section.entries.length > 0);

  if (sections.length === 0) {
    throw new Error("No guest names were found in the photo. Try a clearer picture.");
  }

  return sections;
}

function normalizeSectionKey(name: string): string {
  return name.trim().toLowerCase().replace(/\s+/g, " ");
}

function ensureUniqueEntryIds(entries: GuestEntry[], usedIds: Set<string>): GuestEntry[] {
  return entries.map((entry, index) => {
    if (!usedIds.has(entry.id)) {
      usedIds.add(entry.id);
      return entry;
    }

    const id = `ledger-merge-${Date.now()}-${index}`;
    usedIds.add(id);
    return { ...entry, id };
  });
}

export function mergeGuestSections(
  existing: GuestSection[],
  incoming: GuestSection[]
): GuestSection[] {
  if (existing.length === 0) return incoming;

  const merged = existing.map((section) => ({
    ...section,
    entries: [...section.entries],
  }));

  const sectionIndexByKey = new Map<string, number>();
  merged.forEach((section, index) => {
    sectionIndexByKey.set(normalizeSectionKey(section.sectionName), index);
  });

  const usedIds = new Set<string>();
  merged.forEach((section) => {
    section.entries.forEach((entry) => usedIds.add(entry.id));
  });

  for (const incomingSection of incoming) {
    const entries = ensureUniqueEntryIds(incomingSection.entries, usedIds);
    const key = normalizeSectionKey(incomingSection.sectionName);
    const existingIndex = sectionIndexByKey.get(key);

    if (existingIndex !== undefined) {
      merged[existingIndex].entries.push(...entries);
    } else {
      sectionIndexByKey.set(key, merged.length);
      merged.push({
        sectionName: incomingSection.sectionName,
        entries,
      });
    }
  }

  return merged;
}
