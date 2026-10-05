import { CONFIG } from './config.js';

/**
 * Sanitizes parsed events:
 * 1. Guarantees that any date missing, invalid, or only mentioned as a registration deadline is set to 'TBD'.
 * 2. Preserves confirmed test/drive/interview dates.
 * 3. Deduplicates multiple identical events.
 */
export function sanitizeEvents(events, rawText = '') {
  if (!Array.isArray(events)) return events;

  const monthNames = {
    '01': ['january', 'jan'],
    '02': ['february', 'feb'],
    '03': ['march', 'mar'],
    '04': ['april', 'apr'],
    '05': ['may'],
    '06': ['june', 'jun'],
    '07': ['july', 'jul'],
    '08': ['august', 'aug'],
    '09': ['september', 'sept', 'sep'],
    '10': ['october', 'oct'],
    '11': ['november', 'nov'],
    '12': ['december', 'dec']
  };

  const deadlineKeywords = [
    'deadline', 'last date', 'register before', 'apply before',
    'registration closes', 'form closes', 'apply by', 'registration end', 'register by'
  ];

  const driveKeywords = [
    'oa', 'online assessment', 'written test', 'interview', 'drive',
    'ppt', 'pre-placement', 'presentation', 'hackathon', 'test date',
    'exam date', 'scheduled on', 'conducted on', 'held on', 'technical',
    'managerial', 'hr round', 'coding', 'assessment'
  ];

  events.forEach(ev => {
    if (!ev || typeof ev !== 'object') return;
    const d = (ev.date || '').toString().trim();
    if (!d || d.toUpperCase() === 'TBD') {
      ev.date = 'TBD';
      return;
    }

    const match = d.match(/^(\d{4})-(\d{2})-(\d{2})$/);
    if (!match) {
      ev.date = 'TBD';
      return;
    }

    const [, year, monthNum, dayRaw] = match;
    const dayNum = parseInt(dayRaw, 10).toString();
    const mAliases = monthNames[monthNum] || [];
    const lines = rawText.split(/\r?\n/);

    let dateAppearsOnDeadlineLine = false;
    let dateAppearsOnDriveLine = false;

    for (const line of lines) {
      const lLower = line.toLowerCase();
      const dayRegex = new RegExp(`\\b0?${dayNum}(st|nd|rd|th)?\\b`);
      const hasDay = dayRegex.test(lLower);
      const hasMonth = mAliases.some(alias => lLower.includes(alias)) ||
                       lLower.includes(`${year}-${monthNum}`) ||
                       lLower.includes(`${dayNum}/${monthNum}`) ||
                       lLower.includes(`${dayNum}-${monthNum}`);

      if (hasDay && hasMonth) {
        if (deadlineKeywords.some(k => lLower.includes(k))) dateAppearsOnDeadlineLine = true;
        if (driveKeywords.some(k => lLower.includes(k))) dateAppearsOnDriveLine = true;
      }
    }

    if (!dateAppearsOnDeadlineLine && !dateAppearsOnDriveLine) {
      const titleLower = (ev.title || '').toLowerCase();
      if (driveKeywords.some(k => titleLower.includes(k))) {
        dateAppearsOnDriveLine = true;
      }

      if (Array.isArray(ev.subtypes) && ev.subtypes.length > 0) {
        const subtypesLower = ev.subtypes.map(s => s.toLowerCase()).join(' ');
        if (driveKeywords.some(k => subtypesLower.includes(k))) {
          dateAppearsOnDriveLine = true;
        }
      }
    }

    // If date is exclusively on deadline lines and no drive context, set to TBD
    if (dateAppearsOnDeadlineLine && !dateAppearsOnDriveLine) {
      ev.date = 'TBD';
    }
  });

  // Deduplicate events with same title and date
  const seen = new Set();
  const deduped = [];
  for (const ev of events) {
    const key = `${(ev.title || '').trim().toLowerCase()}|${(ev.date || 'TBD').trim()}`;
    if (!seen.has(key)) {
      seen.add(key);
      deduped.push(ev);
    }
  }

  return deduped;
}

/**
 * Gemini Parser Helper
 * Direct call to Gemini 2.0 Flash Lite (aligned with fast-student-api/api/parse.js)
 */
export async function parseWithGeminiDirect(rawText, apiKey = CONFIG.GEMINI_API_KEY) {
  if (!apiKey) {
    throw new Error('GEMINI_API_KEY not found in environment variables or config.');
  }

  const prompt = `You are a strict parser that extracts placement drive updates from raw text and formats them as a JSON array of events.
Response must be ONLY a valid JSON array. Do not include markdown tags or surrounding text.

Each event object in the array must have:
- title: string (Format: "CompanyName – Activity" e.g. "Google – Online Assessment", "Amazon – Technical Interview", "Telstra – Pre-Placement Talk (PPT)")
- type: string ("exams" or "holidays")
- mode: string ("online" or "offline")
- location: string ("rvce", "rvitm", or "worksite")
- studentType: string ("BE", "MCA", or "BE | MCA" - optional, set null if not specified)
- date: string (date of THIS SPECIFIC event/activity in YYYY-MM-DD format, OR "TBD")
- subtypes: list of strings (e.g. ["PPT"], ["OA"], ["Technical"], ["HR"], ["Interview"])
- desc: string (detailed criteria, branches, stipend/package, registration deadline, link in clean markdown bullet points starting with •)

CRITICAL RULES:
1. EVERY DISTINCT DATE + ACTIVITY = A SEPARATE EVENT OBJECT:
   - If the announcement lists multiple scheduled dates (e.g. PPT on 5th Oct, OA on 6th Oct, Interviews on 8th Oct), create a SEPARATE event for EACH.
2. REGISTRATION DEADLINES ARE NOT DRIVE DATES:
   - Dates labeled as "Registration Deadline", "Deadline", "Last date to register", "Apply before", "Form closing date" specify when the registration form closes, NOT when the recruitment drive/test/interview is held.
   - Always put the registration deadline inside the "desc" field.
   - NEVER use the registration deadline as the event "date"!
3. WHEN TO SET "date": "TBD":
   - If the raw text does NOT explicitly state the date of the actual drive, Online Assessment (OA), written test, or interview.
   - If only a registration deadline is provided.
   - If the drive date is mentioned as TBD, to be decided, tentative, unconfirmed, to be announced, or will be communicated later.
   - In all these cases, you MUST set "date": "TBD".
4. WHEN TO SET A SPECIFIC YYYY-MM-DD DATE:
   - ONLY when the text explicitly specifies the date when the actual test, assessment, interview, or drive is conducted.
5. FORMAT CLEAN BULLETS:
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
  const eventsList = Array.isArray(parsed) ? parsed : [parsed];

  return sanitizeEvents(eventsList, rawText);
}
