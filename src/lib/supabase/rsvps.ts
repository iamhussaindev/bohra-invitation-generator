import { getSupabaseClient, getSupabaseServerClient } from "@/lib/supabase/client";
import type { RsvpRecord } from "@/lib/types";

type RsvpRow = {
  id: string;
  name: string;
  status: "Accepted" | "Declined";
  ladies: number;
  gents: number;
  kids: number;
  confirmation_code: string | null;
  guest_entry_id: string | null;
  created_at: string;
};

function toRsvp(row: RsvpRow): RsvpRecord {
  return {
    id: row.id,
    name: row.name,
    status: row.status,
    ladies: row.ladies,
    gents: row.gents,
    kids: row.kids,
    timestamp: formatTimestamp(row.created_at),
  };
}

function formatTimestamp(iso: string): string {
  const date = new Date(iso);
  const diffMs = Date.now() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);

  if (diffMins < 1) return "Just now";
  if (diffMins < 60) return `${diffMins} min${diffMins === 1 ? "" : "s"} ago`;

  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24) return `${diffHours} hour${diffHours === 1 ? "" : "s"} ago`;

  return date.toLocaleDateString();
}

export async function fetchRsvps(): Promise<RsvpRecord[]> {
  const supabase = getSupabaseClient();
  if (!supabase) return [];

  const { data, error } = await supabase
    .from("rsvp_records")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) throw new Error(error.message);
  return ((data ?? []) as RsvpRow[]).map(toRsvp);
}

export async function addRsvp(
  record: Omit<RsvpRecord, "timestamp"> & {
    confirmationCode?: string;
    guestEntryId?: string;
  }
): Promise<RsvpRecord> {
  const supabase = getSupabaseServerClient();
  if (!supabase) {
    return {
      ...record,
      timestamp: "Just now",
    };
  }

  const row = {
    id: record.id,
    name: record.name,
    status: record.status,
    ladies: record.ladies,
    gents: record.gents,
    kids: record.kids,
    confirmation_code: record.confirmationCode ?? null,
    guest_entry_id: record.guestEntryId ?? null,
  };

  const { data, error } = await supabase.from("rsvp_records").insert(row).select("*").single();
  if (error) throw new Error(error.message);

  return toRsvp(data as RsvpRow);
}

export async function clearRsvps(): Promise<void> {
  const supabase = getSupabaseClient();
  if (!supabase) return;

  const { error } = await supabase.from("rsvp_records").delete().neq("id", "__purge__");
  if (error) throw new Error(error.message);
}
