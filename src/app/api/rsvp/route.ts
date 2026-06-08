import { NextRequest, NextResponse } from "next/server";
import { addRsvp } from "@/lib/supabase/rsvps";
import { isSupabaseConfigured } from "@/lib/supabase/client";

export async function POST(request: NextRequest) {
  try {
    if (!isSupabaseConfigured()) {
      return NextResponse.json(
        { error: "Supabase is not configured on this app." },
        { status: 503 }
      );
    }

    const body = await request.json();
    const {
      id,
      name,
      status,
      ladies = 0,
      gents = 0,
      kids = 0,
      code,
      guestEntryId,
    } = body as {
      id?: string;
      name?: string;
      status?: "Accepted" | "Declined";
      ladies?: number;
      gents?: number;
      kids?: number;
      code?: string;
      guestEntryId?: string;
    };

    if (!name || !status) {
      return NextResponse.json({ error: "Name and status are required." }, { status: 400 });
    }

    const record = await addRsvp({
      id: id || `rsvp-${Date.now()}`,
      name,
      status,
      ladies,
      gents,
      kids,
      confirmationCode: code,
      guestEntryId,
    });

    return NextResponse.json({ record });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to save RSVP.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
