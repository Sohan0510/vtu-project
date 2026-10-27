function sanitizeEvents(events, rawText) {
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
  const deadlineKeywords = ['deadline', 'last date', 'register before', 'apply before', 'registration closes', 'form closes', 'apply by', 'registration end', 'register by'];
  const driveKeywords = ['oa', 'online assessment', 'written test', 'interview', 'drive', 'ppt', 'pre-placement', 'presentation', 'hackathon', 'test date', 'exam date', 'scheduled on', 'conducted on', 'held on', 'technical', 'managerial', 'hr round', 'coding', 'assessment'];

  events.forEach(ev => {
    if (!ev || typeof ev !== 'object') return;
    const d = (ev.date || '').toString().trim();
    if (!d || d.toUpperCase() === 'TBD') {
      ev.date = 'TBD';
      return;
    }
    const match = d.match(/^(\d{4})-(\d{2})-(\d{2})$/);
    if (match) {
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
        const hasMonth = mAliases.some(alias => lLower.includes(alias)) || lLower.includes(`${year}-${monthNum}`) || lLower.includes(`${dayNum}/${monthNum}`) || lLower.includes(`${dayNum}-${monthNum}`);

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

      if (dateAppearsOnDeadlineLine && !dateAppearsOnDriveLine) {
        ev.date = 'TBD';
      }
    }
  });

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

const systemInstruction = `You are a strict parser that extracts placement drive updates from raw text and formats them as a JSON array of events.
Response must be ONLY a valid JSON array. Do not include markdown tags or surrounding text.

Each event object in the array must have:
- title: string (Format: "CompanyName – Activity" e.g. "Google – Online Assessment", "Amazon – Technical Interview", "Telstra – Pre-Placement Talk (PPT)")
- type: string ("exams" or "holidays")
- mode: string ("online" or "offline")
- location: string ("rvce", "rvitm", or "worksite")
- studentType: string ("BE", "MCA", or "BE | MCA" - optional, set null if not specified)
- date: string (date of THIS SPECIFIC event/activity in YYYY-MM-DD format, OR "TBD")
- subtypes: list of strings (e.g. ["PPT"], ["OA"], ["Technical"], ["HR"], ["Interview"])
- desc: string (detailed criteria, branches, stipend/package, registration deadline, link in clean markdown bullet points)

CRITICAL RULES FOR MULTIPLE EVENTS:
1. EVERY DISTINCT DATE + ACTIVITY = A SEPARATE EVENT OBJECT:
   - If the announcement lists multiple scheduled dates (e.g. PPT on 5th Oct, OA on 6th Oct, Interviews on 8th Oct), you MUST create a SEPARATE event object for EACH date/activity.
   - Never collapse multiple dated activities into one event.
   - If there are 3 dates with 3 activities, output 3 events.
   - Look in sections titled "Hiring Schedule", "Selection Process", "Important Dates", "Schedule", "Timeline", "Process", etc.
   - Format each title as "CompanyName – ActivityName" to distinguish them.

2. PRESERVE EXACT TIMES:
   - If a time is specified (e.g. "09:00 AM", "6:00 PM", "09:00 AM – 04:00 PM"), include it in the description.
   - For time ranges like "09:00 AM – 04:00 PM", mention both start and end times in the description.

3. REGISTRATION DEADLINES ARE NOT DRIVE DATES:
   - Dates labeled as "Registration Deadline", "Deadline", "Last date to register", "Apply before", "Form closing date" specify when the registration form closes, NOT when the recruitment drive/test/interview is held.
   - Always put the registration deadline inside the "desc" field.
   - NEVER use the registration deadline as the event "date"!

4. WHEN TO SET "date": "TBD":
   - If the raw text does NOT explicitly state the date of the actual drive, Online Assessment (OA), written test, or interview.
   - If only a registration deadline is provided.
   - If the drive date is mentioned as TBD, to be decided, tentative, unconfirmed, to be announced, or will be communicated later.
   - In all these cases, you MUST set "date": "TBD".

5. WHEN TO SET A SPECIFIC YYYY-MM-DD DATE:
   - ONLY when the text explicitly specifies the date when the actual test, assessment, interview, or drive is conducted.

6. HANDLE ALL DATE FORMATS:
   - "5th October 2026", "5 October 2026", "05/10/2026", "October 5, 2026", "5 Oct 2026" should all parse to "2026-10-05".
   - Handle ordinal suffixes: 1st, 2nd, 3rd, 4th, 5th, etc.

7. DESCRIPTION CONTENT:
   - Each event's description should contain the placement context (company, role, CTC, eligibility) plus event-specific timing info.
   - Include the registration link if present.
   - Do not copy irrelevant info from other events into this event's description.`;

export async function parseTextWithAI(text) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    const error = new Error('GEMINI_API_KEY not configured in environment variables.');
    error.statusCode = 500;
    throw error;
  }

  if (!text) {
    const error = new Error('Missing text in request body');
    error.statusCode = 400;
    throw error;
  }

  const payload = {
    contents: [{
      parts: [{
        text: `${systemInstruction}\n\nRaw Text to Parse:\n${text}`
      }]
    }],
    generationConfig: {
      responseMimeType: "application/json"
    }
  };

  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-lite-latest:generateContent?key=${apiKey}`;

  const geminiRes = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });

  if (!geminiRes.ok) {
    const errorText = await geminiRes.text();
    console.error('Gemini API Error:', errorText);
    const error = new Error('AI service error');
    error.statusCode = geminiRes.status;
    throw error;
  }

  const data = await geminiRes.json();
  const textOut = data?.candidates?.[0]?.content?.parts?.[0]?.text;

  const parsedEvents = JSON.parse(textOut);
  return sanitizeEvents(parsedEvents, text);
}
