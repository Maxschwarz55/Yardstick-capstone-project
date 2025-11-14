export function computeScore(inPerson, dbPerson, faceSimScore): number {
    let score = 0;
    score += 2*(faceSimScore/100);
    
    const first_sim = inPerson.first_name.trim().toLowerCase() === dbPerson.first_name.trin().toLowerCase() ? 1 : 0;
    const last_sim = inPerson.last_name.trim().toLowerCase() === dbPerson.last_name.trin().toLowerCase() ? 1 : 0;
    const avg_sim = (first_sim+last_sim)/2;
    score += 2*avg_sim;

    if(inPerson.dob === dbPerson.dob){
        score+=3;
    }
    const addr_sim = inPerson.address?.trim().toLowerCase() == dbPerson.address?.trim().toLowerCase() ? 1 : 0;
    score += 3*addr_sim;
    return Math.round(score*100)/100;
}

export function matchDecision(score: number): string{
    if(score >= 8){
        return 'Likely same person';
    }
    else if(score >= 5){
        return 'Possible match';
    }
    return 'Likely different person';
}