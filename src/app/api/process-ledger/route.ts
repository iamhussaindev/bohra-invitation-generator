import { NextRequest, NextResponse } from "next/server";
import { processLedgerImage } from "@/lib/openai-ledger";
import { MOCK_LEDGER_DATA } from "@/lib/mock-data";
import { capitalizeGuestSections } from "@/lib/name-utils";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { image, useDemo } = body as { image?: string; useDemo?: boolean };

    if (useDemo) {
      return NextResponse.json({ sections: capitalizeGuestSections(MOCK_LEDGER_DATA) });
    }

    if (!image) {
      return NextResponse.json({ error: "Image is required." }, { status: 400 });
    }

    const sections = await processLedgerImage(image);
    return NextResponse.json({ sections: capitalizeGuestSections(sections) });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to process ledger.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
