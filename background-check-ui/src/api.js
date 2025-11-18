const BASE = process.env.REACT_APP_API_URL || 'http://localhost:4000';

export async function getAiSummary(personId) {
  const res = await fetch(`${BASE}/ai-summary`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ person_id: personId }),
  });

  if (!res.ok) throw new Error(`ai-summary failed: ${res.status}`);
  return res.json();
}
