/**
 * Smart Placement Gatekeeper Filter
 * Rapidly evaluates incoming WhatsApp messages to detect if a message
 * is a company recruitment / placement drive announcement before triggering AI.
 */

// Core placement intent signals with weights
const PLACEMENT_SIGNALS = [
  { pattern: /\b(placement|drive|recruitment|hiring|pool\s*campus)\b/i, weight: 3 },
  { pattern: /\b(ctc|lpa|stipend|package|compensation|per\s*month|per\s*annum)\b/i, weight: 3 },
  { pattern: /\b(eligibility|cutoff|cut-off|cgpa|backlogs|aggregate)\b/i, weight: 2 },
  { pattern: /\b(registration\s*(link|deadline|form)|apply\s*(link|before|by))\b/i, weight: 3 },
  { pattern: /\b(online\s*assessment|oa|ppt|pre-placement|technical\s*interview|hr\s*interview)\b/i, weight: 2 },
  { pattern: /\b(company|role|designation|job\s*role|intern|internship|fte)\b/i, weight: 2 },
  { pattern: /\b(graduating\s*batch|202[4-9]\s*batch|be\b|mca\b|m\.?tech|cse|ise|ece|aiml)\b/i, weight: 2 },
  { pattern: /https?:\/\/[^\s]+/i, weight: 1 }
];

// Negative signals that indicate chatter or non-drive messages
const NOISE_SIGNALS = [
  { pattern: /^(hi|hello|hey|good\s*morning|gm|good\s*night|gn|ok|okay|thank\s*you|thanks)[\s.!]*$/i, weight: -5 },
  { pattern: /\b(class\s*room|lab\s*timing|attendance|syllabus|timetable|assignment)\b/i, weight: -3 },
  { pattern: /\b(who\s*is|anyone\s*know|please\s*send\s*notes)\b/i, weight: -4 }
];

/**
 * Evaluates whether message text is a placement drive announcement
 * @param {string} text Raw message text
 * @returns {{ isPlacement: boolean, score: number, matchedSignals: string[], reason: string }}
 */
export function isPlacementDriveMessage(text) {
  if (!text || typeof text !== 'string') {
    return { isPlacement: false, score: 0, matchedSignals: [], reason: 'Empty or invalid text' };
  }

  const cleaned = text.trim();
  if (cleaned.length < 30) {
    return { isPlacement: false, score: 0, matchedSignals: [], reason: 'Message too short (< 30 chars)' };
  }

  let score = 0;
  const matchedSignals = [];

  for (const signal of PLACEMENT_SIGNALS) {
    if (signal.pattern.test(cleaned)) {
      score += signal.weight;
      matchedSignals.push(signal.pattern.toString());
    }
  }

  for (const noise of NOISE_SIGNALS) {
    if (noise.pattern.test(cleaned)) {
      score += noise.weight;
    }
  }

  // Structural signal: multi-line announcements with labels like "Company:" or "Role:"
  const labelMatches = cleaned.match(/^[*\s-]*[A-Za-z\s()&/-]{3,25}\s*:/gm);
  if (labelMatches && labelMatches.length >= 2) {
    score += 3;
    matchedSignals.push('multi-field-labels');
  }

  // Threshold: score >= 4 indicates high likelihood of a placement drive announcement
  const isPlacement = score >= 4;

  return {
    isPlacement,
    score,
    matchedSignals,
    reason: isPlacement
      ? `Placement announcement detected (score: ${score})`
      : `Non-placement message / low score (score: ${score})`
  };
}
