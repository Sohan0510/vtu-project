const jwt = require('jsonwebtoken');

function verifyAdmin(req) {
  const authHeader = req.headers['authorization'];
  if (!authHeader || !authHeader.startsWith('Bearer ')) return false;
  
  const token = authHeader.split(' ')[1];
  const jwtSecret = process.env.JWT_SECRET;
  
  if (!jwtSecret) {
    console.error('JWT_SECRET environment variable is not set.');
    return false;
  }
  
  try {
    const decoded = jwt.verify(token, jwtSecret);
    return decoded && decoded.admin === true;
  } catch (err) {
    return false;
  }
}

module.exports = async function (req, res) {
  // CORS Headers
  res.setHeader('Access-Control-Allow-Credentials', true);
  const origin = req.headers.origin || '*';
  res.setHeader('Access-Control-Allow-Origin', origin);
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ detail: 'Method not allowed' });
  }

  if (!verifyAdmin(req)) {
    return res.status(401).json({ detail: 'Unauthorized. Invalid or missing admin token.' });
  }

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ detail: 'GEMINI_API_KEY not configured in environment variables.' });
  }

  const { text } = req.body || {};
  if (!text) {
    return res.status(400).json({ detail: 'Missing text in request body' });
  }

  const systemInstruction = `You are a strict parser that extracts placement drive updates from raw text and formats them as a JSON array of events.
Response must be ONLY a valid JSON array. Do not include markdown tags or surrounding text.
Each event object in the array must have:
- title: string (the company name, e.g. "Google India")
- type: string ("exams" or "holidays")
- mode: string ("online" or "offline")
- location: string ("rvce", "rvitm", or "worksite")
- studentType: string ("BE", "MCA", or "BE | MCA" - optional, set null if not specified)
- date: string (date of the event in YYYY-MM-DD format)
- subtypes: list of strings (e.g. ["OA"], ["Technical"], ["HR"])
- desc: string (detailed criteria, branches, package, etc. in a clean, indented markdown bullet points list)

If there are multiple rounds on different days, create separate event objects for each day.
Example Output format:
[
  {
    "title": "Google",
    "type": "exams",
    "mode": "online",
    "location": "rvce",
    "studentType": "BE | MCA",
    "date": "2026-08-10",
    "subtypes": ["OA"],
    "desc": "* **Package**: 35 LPA\\n* **Eligibility**: CGPA >= 7.5\\n* **Eligible Branches**: CSE, ISE"
  }
]`;

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

  try {
    const geminiRes = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    if (!geminiRes.ok) {
      const errorText = await geminiRes.text();
      console.error('Gemini API Error:', errorText);
      return res.status(geminiRes.status).json({ detail: 'AI service error' });
    }

    const data = await geminiRes.json();
    const textOut = data.candidates[0].content.parts[0].text;
    
    // Parse the JSON string returned by Gemini to validate it
    const parsedEvents = JSON.parse(textOut);
    return res.status(200).json(parsedEvents);
  } catch (error) {
    console.error('Error parsing events with AI:', error);
    return res.status(500).json({ detail: 'Failed to parse AI response' });
  }
};
