// similarity_alg.ts

export interface ScoreBreakdown {
  total: number;
  faceScore: number;
  firstNameScore: number;
  middleNameScore: number;
  lastNameScore: number;
  dobScore: number;
  addressScore: number;
}

function normalizeDob(dob?: string): string | null {
  if (!dob) return null;

  // Try to detect formats: YYYY-MM-DD or MM/DD/YYYY
  if (dob.includes("-")) {
    // YYYY-MM-DD
    const [year, month, day] = dob.split("-");
    return `${year}-${month.padStart(2, "0")}-${day.padStart(2, "0")}`;
  } else if (dob.includes("/")) {
    // MM/DD/YYYY
    const [month, day, year] = dob.split("/");
    return `${year}-${month.padStart(2, "0")}-${day.padStart(2, "0")}`;
  }

  return null; // unknown format
}


/**
 * Compute similarity score and provide breakdown
 */
export function computeScoreWithBreakdown(inPerson, dbPerson, faceSimScore: number): ScoreBreakdown {
  let breakdown: ScoreBreakdown = {
    total: 0,
    faceScore: 0,
    firstNameScore: 0,
    middleNameScore: 0,
    lastNameScore: 0,
    dobScore: 0,
    addressScore: 0,
  };

  // 1. Face similarity (0–5)
  breakdown.faceScore = faceSimScore / 20;
  breakdown.total += breakdown.faceScore;

  // 2. Name similarity (0-3)
  breakdown.firstNameScore =
    inPerson.first_name?.trim().toLowerCase() ===
    dbPerson.first_name?.trim().toLowerCase()
      ? 1
      : 0;

  breakdown.middleNameScore =
    inPerson.middle_name && dbPerson.middle_name
        ? inPerson.middle_name.trim().toLowerCase() === dbPerson.middle_name.trim().toLowerCase()
        ? 0.5
        : 0
        : 0;


  breakdown.lastNameScore =
    inPerson.last_name?.trim().toLowerCase() ===
    dbPerson.last_name?.trim().toLowerCase()
      ? 1.5
      : 0;

  breakdown.total +=
    breakdown.firstNameScore + breakdown.middleNameScore + breakdown.lastNameScore;

  // 3. DOB similarity (0–2)
  const dobInput = normalizeDob(inPerson.dob);
  const dobDb = normalizeDob(dbPerson.dob);
  breakdown.dobScore = dobInput && dobDb && dobInput === dobDb ? 2 : 0;
  breakdown.total += breakdown.dobScore;

  // 4. Address similarity (0–2)
  breakdown.addressScore =
    inPerson.address &&
    dbPerson.address &&
    inPerson.address.trim().toLowerCase() ===
      dbPerson.address.trim().toLowerCase()
      ? 2
      : 0;
  breakdown.total += breakdown.addressScore;

  breakdown.total = Math.round(breakdown.total * 100) / 100; // round 2 decimals

  return breakdown;
}

/**
 * Decide match category
 */
export function matchDecision(score: number, faceSimScore: number): string {
  if (faceSimScore > 0 && faceSimScore < 40) return "Likely different person";
  if (score >= 7.5) return "Highly likely same person";
  if (score >= 6.5) return "Likely same person";
  if (score >= 2.5) return "Possible match";
  return "Likely different person";
}
