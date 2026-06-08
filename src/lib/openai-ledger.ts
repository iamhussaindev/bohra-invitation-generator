import { normalizeLedgerSections } from "@/lib/ledger-normalize";
import type { GuestSection } from "@/lib/types";

const LEDGER_SYSTEM_PROMPT = `
You transcribe Dawoodi Bohra handwritten guest ledger photos into structured guest data.

Your job:
1. Read all visible text from the image (OCR).
2. Group rows into sections when section headers appear (e.g. "NO:- Shekha Mujal").
3. If no sections are visible, put everyone in one section called "Guests".
4. For each family row, extract:
   - originalText: raw handwritten name line
   - cleanedNames: cleaned invite name
   - ladiesCount, gentsCount, kidsCount, totalCount

Name cleanup rules:
- Remove relation words: Mama, Mami, Maasi, Kaka, Kaki, Aunty, Uncle, Kai.
- Add "bhai" for gents first names (Abbas -> Abbasbhai). Do not double suffixes.
- Add "ben" for ladies first names (Batul -> Batulben). Do not double suffixes.
- For combined names like "Sakina & Nafeesa Attarwala", suffix both names.
- Capitalize each name part (e.g. "chattriwala" -> "Chattriwala").
- If counts are missing, use 0. totalCount = ladies + gents + kids.

Return ONLY valid JSON:
{
  "sections": [
    {
      "sectionName": "Section name",
      "entries": [
        {
          "id": "unique-id",
          "originalText": "raw text",
          "cleanedNames": "Cleaned Name",
          "gender": "ladies" | "gents" | "mixed",
          "ladiesCount": 0,
          "gentsCount": 0,
          "kidsCount": 0,
          "totalCount": 0
        }
      ]
    }
  ]
}
`;

function parseJsonFromAi(content: string): unknown {
  try {
    return JSON.parse(content);
  } catch {
    const fenced = content.match(/```(?:json)?\s*([\s\S]*?)```/i);
    if (fenced?.[1]) {
      return JSON.parse(fenced[1].trim());
    }

    const start = content.indexOf("{");
    const end = content.lastIndexOf("}");
    if (start !== -1 && end > start) {
      return JSON.parse(content.slice(start, end + 1));
    }

    throw new Error("AI could not parse the ledger text. Try a clearer photo.");
  }
}

export async function processLedgerImage(base64Image: string): Promise<GuestSection[]> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error("OPENAI_API_KEY is not configured on the server.");
  }

  if (!base64Image.startsWith("data:image/")) {
    throw new Error("Invalid image format. Please upload a photo.");
  }

  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "gpt-4o-mini",
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: LEDGER_SYSTEM_PROMPT },
        {
          role: "user",
          content: [
            {
              type: "text",
              text: "Read this ledger photo, extract all guest names and counts, clean the names, and return JSON only.",
            },
            {
              type: "image_url",
              image_url: { url: base64Image, detail: "high" },
            },
          ],
        },
      ],
    }),
  });

  if (!response.ok) {
    let message = `OpenAI request failed (${response.status}).`;
    try {
      const errorBody = await response.json();
      message = errorBody?.error?.message || message;
    } catch {
      // ignore non-json error body
    }
    throw new Error(message);
  }

  const data = await response.json();
  const jsonText = data.choices?.[0]?.message?.content;

  if (!jsonText || typeof jsonText !== "string") {
    throw new Error("AI did not return any ledger text.");
  }

  const parsed = parseJsonFromAi(jsonText);
  return normalizeLedgerSections(parsed);
}
