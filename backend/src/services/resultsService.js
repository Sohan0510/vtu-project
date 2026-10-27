import { connectToDatabase } from '../config/db.js';

// --- SGPA / CGPA Calculator Logic ---
const SUBJECT_CREDITS = {
  // 3rd Semester Core
  "BCS301": 4, "BCS302": 4, "BCS303": 4, "BCS304": 3,
  "BCSL305": 1, "BSCK307": 1, "BCS306": 3, "BCS358": 1,
  "BNSK359": 0, "BPEK359": 0, "BYOK359": 0,

  // 4th Semester Core
  "BCS401": 3, "BCS402": 4, "BCS403": 4, "BCSL404": 1,
  "BBOC407": 2, "BUHK408": 1, "BCS405": 3, "BCS456": 1,
  "BNSK459": 0, "BPEK459": 0, "BYOK459": 0,

  // 5th Semester Core
  "BCS501": 4, "BCS502": 4, "BCS503": 4, "BCSL504": 1,
  "BCS586": 2, "BRMK557": 3, "BCS508": 1, "BCS515": 3,
  "BNSK559": 0, "BPEK559": 0, "BYOK559": 0,

  // 6th Semester
  "BCS601": 4, "BCS602": 4, "BCS613A": 3, "BCS613B": 3, "BCS613C": 3,
  "BCS613D": 3, "BME654B": 3, "BCS685": 2, "BCSL606": 1, "BAIL657C": 1,
  "BNSK659": 0, "BPEK659": 0, "BYOK659": 0,
};

export function getCredits(subjectCode) {
  const code = (subjectCode || '').toUpperCase();
  if (SUBJECT_CREDITS[code] !== undefined) return SUBJECT_CREDITS[code];

  if (code.startsWith("BMATS")) return 4;
  if (code.startsWith("BPHYS") || code.startsWith("BCHEM") || code.startsWith("BCHES")) return 4;
  if (code.startsWith("BPOPS") || code.startsWith("BCEDK")) return 3;
  if (code.startsWith("BESCK")) return 3;
  if (code.startsWith("BETCK") || code.startsWith("BPLCK")) return 3;
  if (code.startsWith("BENG") || code.startsWith("BPWSK")) return 1;
  if (code.startsWith("BKSKK") || code.startsWith("BKBK") || code.startsWith("BICOK")) return 1;
  if (code.startsWith("BIDTK") || code.startsWith("BSFHK")) return 1;

  if (code.startsWith("BCS306")) return 3;
  if (code.startsWith("BCS358")) return 1;
  if (code.startsWith("BCS405")) return 3;
  if (code.startsWith("BCS456")) return 1;
  if (code.startsWith("BCS515")) return 3;

  return 0;
}

export function getGradePoints(marks) {
  if (marks >= 90) return 10;
  if (marks >= 80) return 9;
  if (marks >= 70) return 8;
  if (marks >= 60) return 7;
  if (marks >= 50) return 6;
  if (marks >= 45) return 5;
  if (marks >= 40) return 4;
  return 0;
}

export function calculateSgpa(subjects, targetSem = null) {
  let totalGradePoints = 0;
  let totalCredits = 0;

  for (const code in subjects) {
    const sub = subjects[code];
    const sem = sub.semester || 0;
    if (targetSem !== null && sem !== targetSem) continue;

    const credits = getCredits(code);

    if (credits === 0 && !code.includes("359") && !code.includes("459") && !code.includes("559")) continue;

    if (sub.status === "F" || sub.status === "A") {
      totalCredits += credits;
      continue;
    }

    const marks = sub.total || 0;
    const gradePoints = getGradePoints(marks);

    totalGradePoints += (gradePoints * credits);
    totalCredits += credits;
  }

  if (totalCredits === 0) return 0.0;
  return Math.round((totalGradePoints / totalCredits) * 100) / 100;
}

export async function getStudentResult(usn) {
  if (!usn) {
    const error = new Error('USN parameter is missing');
    error.statusCode = 400;
    throw error;
  }

  const client = await connectToDatabase();
  const dbName = process.env.DB_NAME || 'vtu_database';
  const db = client.db(dbName);
  const collection = db.collection('results');

  const result = await collection.findOne({ usn: String(usn).toUpperCase() });

  if (!result) {
    const error = new Error('Student record not found in registry database.');
    error.statusCode = 404;
    throw error;
  }

  delete result._id;

  const subjects = result.subjects || {};
  for (const code in subjects) {
    subjects[code].credits = getCredits(code);
  }

  const semsSet = new Set(Object.values(subjects).map(s => s.semester || 0));
  const sems = Array.from(semsSet).filter(s => s > 0);
  const latestSem = sems.length > 0 ? Math.max(...sems) : 0;

  result.sgpa = calculateSgpa(subjects, latestSem);
  result.cgpa = calculateSgpa(subjects, null);

  result.sgpa_map = {};
  for (const sem of sems) {
    result.sgpa_map[sem] = calculateSgpa(subjects, sem);
  }

  return result;
}
