import { CONFIG } from './config.js';

/**
 * Gemini Parser Helper
 * Direct call to Gemini 2.0 Flash Lite (same model and prompt as fast-student-api/api/parse.js)
 * Allows local testing without needing remote Vercel admin tokens.
 */
export async function parseWithGeminiDirect(rawText, apiKey = CONFIG.GEMINI_API_KEY) {
  if (!apiKey) {
    throw new Error('GEMINI_API_KEY not found in environment variables or config.');
  }

  const prompt = `You are an expert AI parser for Indian engineering college campus placement announcements (RVCE, RVITM, and VTU affiliated colleges).
Your job is to read raw, unstructured text posted on WhatsApp / Telegram / Notice Boards by Placement Coordinators or Company HRs, and extract placement events into a clean, structured JSON array.

Return ONLY a valid JSON array of event objects. Do NOT include markdown code blocks, backticks (\`\`\`json), or any conversational filler. Return raw JSON text starting with [ and ending with ].

Each event object in the array MUST have the following schema:
- title: string (Format: "CompanyName – Activity" e.g. "Google – Online Assessment", "Amazon – Technical Interview", "Telstra – Pre-Placement Talk (PPT)")
- type: string (must be either "exams" for tests/interviews/assessments/drives, or "holidays" for breaks/vacations)
- mode: string ("online" or "offline")
- location: string ("rvce", "rvitm", or "worksite")
- studentType: string ("BE", "MCA", or "BE | MCA" - optional, set null if not specified)
- date: string (date of THIS SPECIFIC event/activity in YYYY-MM-DD format, OR "TBD")
- subtypes: list of strings (e.g. ["PPT"], ["OA"], ["Technical"], ["HR"], ["Interview"])
- desc: string (detailed criteria, branches, stipend/package, registration deadline, link as clean bullet points starting with •)

CRITICAL RULES:
1. MULTIPLE ACTIVITIES ON DIFFERENT DATES = SEPARATE EVENT OBJECTS:
   - If the announcement lists multiple dates (e.g. PPT on 5th Oct, OA on 6th Oct, Interviews on 8th Oct), output a SEPARATE event for EACH.
2. REGISTRATION DEADLINES ARE NOT DRIVE DATES:
   - Dates labeled "Registration Deadline" or "Deadline" go inside the "desc" field, NEVER as the event "date".
3. WHEN TO SET "date": "TBD":
   - If the drive/test date is not yet announced, or says TBD / to be announced / tentative, set "date": "TBD".
4. FORMAT CLEAN BULLETS:
   - Use clean bullet points (• ) for items in desc. Do NOT use asterisks (*) or double asterisks (**).
`;

  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-lite-latest:generateContent?key=${apiKey}`;

  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{
        parts: [
          { text: prompt },
          { text: `Raw Announcement Text:\n"""\n${rawText}\n"""` }
        ]
      }],
      generationConfig: {
        temperature: 0.1,
        responseMimeType: "application/json"
      }
    })
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Gemini API Error (${res.status}): ${errText}`);
  }

  const data = await res.json();
  const rawContent = data.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!rawContent) {
    throw new Error('Empty response from Gemini');
  }

  const cleaned = rawContent.replace(/^```json\s*/i, '').replace(/```\s*$/i, '').trim();
  const parsed = JSON.parse(cleaned);
  return Array.isArray(parsed) ? parsed : [parsed];
}
