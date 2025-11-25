export function computeScore(inPerson, dbPerson, faceSimScore): number {
    let score = 0;

    // Face similarity: 0-10 points
    score += faceSimScore / 10; // 100% similarity → 10 points

    // Name similarity: 0-3 points
    const firstMatch =
        inPerson.first_name?.trim().toLowerCase() ===
        dbPerson.first_name?.trim().toLowerCase();
    const middleMatch =
        inPerson.middle_name?.trim().toLowerCase() ===
        dbPerson.middle_name?.trim().toLowerCase();
    const lastMatch =
        inPerson.last_name?.trim().toLowerCase() ===
        dbPerson.last_name?.trim().toLowerCase();

    const namePoints =
        (firstMatch ? 1.0 : 0) + (middleMatch ? 0.5 : 0) + (lastMatch ? 1.5 : 0);
    score += namePoints;

    // DOB similarity: 0-2 points
    if (inPerson.dob && dbPerson.dob && inPerson.dob === dbPerson.dob) {
        score += 2;
    }

    // Address similarity: 0-2 points
    if (
        inPerson.address &&
        dbPerson.address &&
        inPerson.address.trim().toLowerCase() === dbPerson.address.trim().toLowerCase()
    ) {
        score += 2;
  }
  return Math.round(score * 100) / 100; // round to 2 decimals
}

export function matchDecision(score: number, faceSimScore: number): string{
    if (faceSimScore < 40) return "Likely different person";
    if (score >= 12) return "Likely same person";
    if (score >= 8) return "Possible match";
    return "Likely different person";
}