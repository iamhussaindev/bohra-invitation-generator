function capitalizeWord(word: string): string {
  if (!word) return word;
  return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
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
