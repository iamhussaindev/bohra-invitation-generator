import type { GuestGender } from "@/lib/types";

type Honorific = "bhai" | "ben";

function capitalizeWord(word: string): string {
  if (!word) return word;
  return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
}

function parseHonorific(word: string): { base: string; honorific: Honorific | null } {
  const lower = word.toLowerCase();
  if (lower.endsWith("bhai")) {
    return { base: word.slice(0, -4), honorific: "bhai" };
  }
  if (lower.endsWith("ben")) {
    return { base: word.slice(0, -3), honorific: "ben" };
  }
  return { base: word, honorific: null };
}

function attachHonorific(base: string, honorific: Honorific): string {
  const parsed = parseHonorific(base);
  if (parsed.honorific || !parsed.base) return base;
  return `${parsed.base}${honorific}`;
}

function inferHonorific(
  gender: GuestGender,
  ladiesCount = 0,
  gentsCount = 0
): Honorific | null {
  if (gender === "ladies") return "ben";
  if (gender === "gents") return "bhai";
  if (ladiesCount > 0 && gentsCount === 0) return "ben";
  if (gentsCount > 0 && ladiesCount === 0) return "bhai";
  return null;
}

function formatNameWords(words: string[], honorific: Honorific | null): string {
  if (words.length === 0) return "";

  const normalized = [...words];

  if (normalized.length > 1) {
    const lastParsed = parseHonorific(normalized[normalized.length - 1]);
    if (lastParsed.honorific) {
      normalized[normalized.length - 1] = lastParsed.base;
      const firstParsed = parseHonorific(normalized[0]);
      normalized[0] = attachHonorific(
        firstParsed.base || normalized[0],
        lastParsed.honorific
      );
    }
  }

  const firstParsed = parseHonorific(normalized[0]);
  if (!firstParsed.honorific && honorific) {
    normalized[0] = attachHonorific(firstParsed.base || normalized[0], honorific);
  }

  return normalized.map(capitalizeWord).join(" ");
}

function formatNamePart(
  part: string,
  honorific: Honorific | null
): string {
  const trimmed = part.trim();
  if (!trimmed) return "";

  const words = trimmed.split(/\s+/).filter(Boolean);
  if (words.length === 0) return "";

  if (words.length === 1) {
    const word = words[0];
    const parsed = parseHonorific(word);
    if (!parsed.honorific && honorific) {
      return capitalizeWord(attachHonorific(parsed.base || word, honorific));
    }
    return capitalizeWord(word);
  }

  const lastWord = words[words.length - 1];
  const sharedSurname = parseHonorific(lastWord).honorific === null;

  if (sharedSurname && words.length >= 2) {
    const surname = lastWord;
    const firstNames = words.slice(0, -1);
    const formattedFirstNames = firstNames.map((name) => {
      const parsed = parseHonorific(name);
      if (parsed.honorific) return capitalizeWord(name);
      if (honorific) return capitalizeWord(attachHonorific(parsed.base || name, honorific));
      return capitalizeWord(name);
    });
    return `${formattedFirstNames.join(" ")} ${capitalizeWord(surname)}`;
  }

  return formatNameWords(words, honorific);
}

export function formatGuestHonorific(
  name: string,
  gender: GuestGender = "mixed",
  ladiesCount = 0,
  gentsCount = 0
): string {
  const honorific = inferHonorific(gender, ladiesCount, gentsCount);

  return name
    .split("&")
    .map((part) => formatNamePart(part, honorific))
    .join(" & ");
}

export function capitalizeGuestName(name: string): string {
  return name
    .split("&")
    .map((part) =>
      part
        .trim()
        .split(/\s+/)
        .map(capitalizeWord)
        .join(" ")
    )
    .join(" & ");
}

export function formatGuestName(
  name: string,
  gender: GuestGender = "mixed",
  ladiesCount = 0,
  gentsCount = 0
): string {
  return formatGuestHonorific(name, gender, ladiesCount, gentsCount);
}

export function capitalizeGuestSections<T extends { sectionName: string; entries: { cleanedNames: string }[] }>(
  sections: T[]
): T[] {
  return sections.map((section) => ({
    ...section,
    sectionName: capitalizeGuestName(section.sectionName),
    entries: section.entries.map((entry) => ({
      ...entry,
      cleanedNames: capitalizeGuestName(entry.cleanedNames),
    })),
  }));
}
