import { capitalizeGuestName, formatGuestName } from "@/lib/name-utils";
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

  return {
    id: String(entry.id ?? `ledger-${sectionIdx}-${index}-${Date.now()}`),
    originalText: originalText || cleanedNames,
    cleanedNames,
    gender,
    ladiesCount,
    gentsCount,
    kidsCount,
    totalCount,
  };
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
