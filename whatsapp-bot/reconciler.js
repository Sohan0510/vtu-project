/**
 * Smart Reconciler & Deduplication Engine
 * Matches newly parsed WhatsApp events against current Calendar of Events (COE)
 * to decide whether to Create, Update (e.g., TBD -> Confirmed Date), or Skip (Duplicate).
 */

export function normalizeCompanyName(title) {
  if (!title) return '';
  // Extract company name before any dash/separator
  const mainPart = title.split(/[–—-]/)[0];
  return mainPart
    .toLowerCase()
    .replace(/\b(private|limited|ltd|pvt|india|technologies|solutions|corp|inc|co)\b/gi, '')
    .replace(/[^a-z0-9]/g, '')
    .trim();
}

/**
 * Checks similarity between two strings (0.0 to 1.0)
 */
function textSimilarity(strA, strB) {
  if (!strA || !strB) return 0;
  const a = strA.toLowerCase().replace(/[^a-z0-9]/g, '');
  const b = strB.toLowerCase().replace(/[^a-z0-9]/g, '');
  if (a === b) return 1.0;
  if (a.includes(b) || b.includes(a)) return 0.85;
  return 0;
}

/**
 * Reconciles parsed events against current COE events
 * @param {Array} newEvents Events extracted by parse.js
 * @param {Array} existingEvents Current events in COE
 * @returns {Array<{ action: string, eventPayload: Object, reason: string, targetId?: number }>}
 */
export function reconcileWithCOE(newEvents, existingEvents = []) {
  const plan = [];
  const existingMax = existingEvents.reduce((max, e) => Math.max(max, Number(e.id) || 0), 0);
  let highestId = existingMax > 0 ? existingMax : 1000;

  for (const newEv of newEvents) {
    const normNewCompany = normalizeCompanyName(newEv.title);
    
    // Find all existing events belonging to this company
    const companyMatches = existingEvents.filter(e => {
      const normExisting = normalizeCompanyName(e.title);
      return normNewCompany.length > 2 && normExisting.length > 2 &&
             (normNewCompany === normExisting || textSimilarity(normNewCompany, normExisting) > 0.8);
    });

    // 1. Check for Exact Duplicate
    const exactMatch = companyMatches.find(e => {
      const sameDate = e.date === newEv.date;
      const sameSubtype = (e.subtypes?.[0] || '').toLowerCase() === (newEv.subtypes?.[0] || '').toLowerCase();
      return sameDate && sameSubtype;
    });

    if (exactMatch) {
      // Check if new description has meaningful additions (e.g. added link or venue)
      const descDiff = (newEv.desc || '').length > (exactMatch.desc || '').length + 30;
      if (!descDiff) {
        plan.push({
          action: 'SKIP_DUPLICATE',
          eventPayload: exactMatch,
          targetId: exactMatch.id,
          reason: `Exact match already in COE for "${exactMatch.title}" on ${exactMatch.date}.`
        });
        continue;
      } else {
        // Detailed correction/update to existing event
        plan.push({
          action: 'UPDATE_DETAILS',
          targetId: exactMatch.id,
          eventPayload: {
            id: exactMatch.id,
            title: newEv.title || exactMatch.title,
            type: newEv.type || exactMatch.type || 'exams',
            mode: newEv.mode || exactMatch.mode,
            location: newEv.location || exactMatch.location,
            studentType: newEv.studentType || exactMatch.studentType,
            subtypes: Array.from(new Set([...(exactMatch.subtypes || []), ...(newEv.subtypes || [])])),
            date: exactMatch.date,
            desc: newEv.desc
          },
          reason: `Updated venue/details for existing drive "${exactMatch.title}" on ${exactMatch.date}.`
        });
        continue;
      }
    }

    // 2. Check for TBD -> Confirmed Date Promotion
    // If an existing event for this company is on 'TBD' and the new announcement provides a confirmed date
    const tbdMatch = companyMatches.find(e => !e.date || e.date.trim().toUpperCase() === 'TBD');
    if (tbdMatch && newEv.date && newEv.date.trim().toUpperCase() !== 'TBD') {
      plan.push({
        action: 'PROMOTE_TBD_TO_CONFIRMED',
        targetId: tbdMatch.id,
        eventPayload: {
          id: tbdMatch.id,
          title: newEv.title || tbdMatch.title,
          type: newEv.type || tbdMatch.type || 'exams',
          mode: newEv.mode || tbdMatch.mode,
          location: newEv.location || tbdMatch.location,
          studentType: newEv.studentType || tbdMatch.studentType,
          subtypes: newEv.subtypes?.length ? newEv.subtypes : tbdMatch.subtypes,
          date: newEv.date,
          desc: newEv.desc || tbdMatch.desc
        },
        reason: `Promoted "${tbdMatch.title}" from TBD to confirmed date ${newEv.date}.`
      });
      continue;
    }

    // 3. Brand New Drive or New Distinct Stage (e.g. OA vs Interview on different dates)
    highestId += 1;
    plan.push({
      action: 'CREATE_NEW',
      eventPayload: {
        id: highestId,
        title: newEv.title,
        type: newEv.type || 'exams',
        mode: newEv.mode || 'offline',
        location: newEv.location || 'rvitm',
        studentType: newEv.studentType || 'BE | MCA',
        subtypes: Array.isArray(newEv.subtypes) ? newEv.subtypes : [],
        date: newEv.date || 'TBD',
        desc: newEv.desc || ''
      },
      reason: `New placement drive detected for "${newEv.title}" on ${newEv.date || 'TBD'}.`
    });
  }

  return plan;
}
