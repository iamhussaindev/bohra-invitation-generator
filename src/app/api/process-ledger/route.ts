import { NextRequest, NextResponse } from "next/server";
import { processLedgerImage } from "@/lib/openai-ledger";

export const maxDuration = 60;

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { image } = body as { image?: string };

    if (!image || typeof image !== "string") {
      return NextResponse.json({ error: "Photo is required." }, { status: 400 });
    }

    const sections = await processLedgerImage(image);
    return NextResponse.json({ sections });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to process ledger.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
