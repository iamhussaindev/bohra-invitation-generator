import { getSupabaseClient } from "@/lib/supabase/client";
import type { GuestEntry, GuestGender, GuestSection } from "@/lib/types";

type GuestSectionRow = {
  id: string;
  section_name: string;
  sort_order: number;
};

type GuestEntryRow = {
  id: string;
  section_id: string;
  original_text: string;
  cleaned_names: string;
  gender: GuestGender;
  ladies_count: number;
  gents_count: number;
  kids_count: number;
  total_count: number;
  sort_order: number;
};

function toEntry(row: GuestEntryRow): GuestEntry {
  return {
    id: row.id,
    originalText: row.original_text,
    cleanedNames: row.cleaned_names,
    gender: row.gender,
    ladiesCount: row.ladies_count,
    gentsCount: row.gents_count,
    kidsCount: row.kids_count,
    totalCount: row.total_count,
  };
}

export async function fetchGuestSections(): Promise<GuestSection[]> {
  const supabase = getSupabaseClient();
  if (!supabase) return [];

  const [{ data: sections, error: sectionsError }, { data: entries, error: entriesError }] =
    await Promise.all([
      supabase.from("guest_sections").select("*").order("sort_order"),
      supabase.from("guest_entries").select("*").order("sort_order"),
    ]);

  if (sectionsError) throw new Error(sectionsError.message);
  if (entriesError) throw new Error(entriesError.message);

  const sectionRows = (sections ?? []) as GuestSectionRow[];
  const entryRows = (entries ?? []) as GuestEntryRow[];

  if (sectionRows.length === 0) return [];

  return sectionRows.map((section) => ({
    sectionName: section.section_name,
    entries: entryRows
      .filter((entry) => entry.section_id === section.id)
      .map(toEntry),
  }));
}

export async function saveGuestSections(sections: GuestSection[]): Promise<void> {
  const supabase = getSupabaseClient();
  if (!supabase) return;

  const sectionRows: GuestSectionRow[] = [];
  const entryRows: GuestEntryRow[] = [];

  sections.forEach((section, sectionIdx) => {
    const sectionId = `section-${sectionIdx}-${slugify(section.sectionName)}`;

    sectionRows.push({
      id: sectionId,
      section_name: section.sectionName,
      sort_order: sectionIdx,
    });

    section.entries.forEach((entry, entryIdx) => {
      entryRows.push({
        id: entry.id,
        section_id: sectionId,
        original_text: entry.originalText,
        cleaned_names: entry.cleanedNames,
        gender: entry.gender,
        ladies_count: entry.ladiesCount,
        gents_count: entry.gentsCount,
        kids_count: entry.kidsCount,
        total_count: entry.totalCount,
        sort_order: entryIdx,
      });
    });
  });

  const { error: deleteEntriesError } = await supabase
    .from("guest_entries")
    .delete()
    .neq("id", "__purge__");

  if (deleteEntriesError) throw new Error(deleteEntriesError.message);

  const { error: deleteSectionsError } = await supabase
    .from("guest_sections")
    .delete()
    .neq("id", "__purge__");

  if (deleteSectionsError) throw new Error(deleteSectionsError.message);

  if (sectionRows.length > 0) {
    const { error: insertSectionsError } = await supabase.from("guest_sections").insert(sectionRows);
    if (insertSectionsError) throw new Error(insertSectionsError.message);
  }

  if (entryRows.length > 0) {
    const { error: insertEntriesError } = await supabase.from("guest_entries").insert(entryRows);
    if (insertEntriesError) throw new Error(insertEntriesError.message);
  }
}

function slugify(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "section";
}
