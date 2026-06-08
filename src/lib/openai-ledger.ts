const LEDGER_SYSTEM_PROMPT = `
You are an expert handwriting transcriber for Dawoodi Bohra community guest ledgers.
Analyze the ledger list image. Transcribe each section, its entries, and counts.

Columns in ledger:
- S.No / Number (1, 2, 3...)
- Name
- Ladies count
- Gents count
- Reds/Kids count (usually labeled 'Reds' or placed between Gents & Total)
- Total count

Sections start with "NO:- [Section Name]" (e.g., "Shekha Mujal", "Bhaiwada ni Pole", "Makeriwad", "Zakariya").

CRITICAL Processing Rules for Name Extraction, Cleanup & Formatting:
1. Extract the names correctly.
2. Clean up names by removing family relationship words like: Mama, Mami, Maasi, Kaka, Kaki, Aunty, Uncle, Kai.
   E.g., "Salma Mami Kathawala" -> "Salma Kathawala", "Jubeda Maasi" -> "Jubeda", "Ajabaunty goodluck" -> "Ajab Goodluck".
3. Standardize Dawoodi Bohra honorific suffixes:
   - For Gents: Add "bhai" to the first name (e.g. "Abbas" -> "Abbasbhai"). Do not double it if "bhai" is already present.
   - For Ladies: Add "ben" to the first name (e.g. "Batul" -> "Batulben"). Do not double it if "ben" is already present.
   - For combined entries with multiple people (e.g., "Sakina & Nafeesa Attarwala"), apply the suffix to both.
4. Capitalize all name parts: first letter uppercase, rest lowercase (e.g. "chattriwala" -> "Chattriwala", "Batulben Chattriwala", "Abbasbhai Mithaiwala").
5. Ensure counts (ladies, gents, kids) match columns. If kids column is empty, count as 0. Total must be numeric.

Return ONLY valid JSON with this schema:
{
  "sections": [
    {
      "sectionName": "Name of section",
      "entries": [
        {
          "id": "unique-string-id",
          "originalText": "raw handwritten string",
          "cleanedNames": "formatted names with Ben/Bhai",
          "gender": "ladies" | "gents" | "mixed",
          "ladiesCount": number,
          "gentsCount": number,
          "kidsCount": number,
          "totalCount": number
        }
      ]
    }
  ]
}
`;

export async function processLedgerImage(base64Image: string) {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error("OPENAI_API_KEY is not configured on the server.");
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
              text: "Extract, clean, and format the handwritten ledger into JSON matching the instructions.",
            },
            {
              type: "image_url",
              image_url: { url: base64Image },
            },
          ],
        },
      ],
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`OpenAI request failed: ${response.status} ${errorText}`);
  }

  const data = await response.json();
  const jsonText = data.choices?.[0]?.message?.content;

  if (!jsonText) {
    throw new Error("No content returned from OpenAI.");
  }

  const parsed = JSON.parse(jsonText);
  if (!parsed.sections || !Array.isArray(parsed.sections)) {
    throw new Error("Invalid format from OpenAI.");
  }

  return parsed.sections;
}
