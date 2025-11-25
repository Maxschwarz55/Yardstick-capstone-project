import React, { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import "./Results.css";
import blankPhoto from "./Blank-Profile-Picture.webp";
import { getAiSummary } from "./api";

export default function Results() {
    const { state } = useLocation();
    const navigate = useNavigate();
    const firstName = state?.firstName;
    const lastName = state?.lastName;
    const selfieKey = state?.selfieKey;

    const [loading, setLoading] = useState(true);
    const [person, setPerson] = useState(null);
    const [error, setError] = useState("");
    const [similarityResult, setSimilarityResult] = useState(null);
    const [summary, setSummary] = useState('');
    const [summaryLoading, setSummaryLoading] = useState(false);
    const [summaryError, setSummaryError] = useState('');
    const middleName = state?.middleName;

    const API = "http://localhost:4000";

    // Fetch person record by name
    useEffect(() => {
        if (!firstName || !lastName) {
            navigate("/");
            return;
        }
        let cancelled = false;
        (async () => {
            try {
                setLoading(true);
                setError("");
                setPerson(null);

                const url = `${API}/records/search/by-name?first=${encodeURIComponent(
                    firstName
                )}&last=${encodeURIComponent(lastName)}&limit=1&page=1`;

                const res = await fetch(url);
                const ct = res.headers.get("content-type") || "";
                if (!res.ok) {
                    const text = await res.text().catch(() => "");
                    throw new Error(`HTTP ${res.status}: ${text.slice(0, 200)}`);
                }
                if (!ct.includes("application/json")) {
                    const text = await res.text().catch(() => "");
                    throw new Error(`Expected JSON, got: ${text.slice(0, 120)}…`);
                }

                const json = await res.json();
                const firstMatch = json?.data?.[0] ?? null;
                if (!cancelled) setPerson(firstMatch);

                /*
                if (firstMatch?.photo_file_name) {
                    const similarityRes = await fetch(`${API}/similarity/check`, {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({
                            input_person: inputPerson,
                            db_person: dbPerson
                        })
                    });
                }
                */
            } catch (e) {
                if (!cancelled) setError(e.message ?? "Failed to fetch");
            } finally {
                if (!cancelled) setLoading(false);
            }
        })();
        return () => { cancelled = true; };
    }, [firstName, lastName, navigate, API]);

    async function runSimilarityCheck() {
        if (!person.photo_s3_key) return;
        if (!selfieKey) return;

        const inputPerson = {
            first_name: person.first_name || "",
            last_name: person.last_name || "",
            dob: person.dob || "",
            photo_s3_key: selfieKey
        };

        const dbPerson = {
            first_name: person.first_name,
            last_name: person.last_name,
            dob: person.dob,
            photo_s3_key: person.photo_s3_key
        };

        try {
            const res = await fetch(`${API}/similarity/check`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    input_person: inputPerson,
                    db_person: dbPerson
                })
            });
            const data = await res.json();
            setSimilarityResult(data);
        } catch (err) {
            console.error("Similarity check failed", err);
        }
    }

    // run similarity when person loads & only if selfie uploaded
    useEffect(() => {
        if (person.photo_s3_key && selfieKey) {
            runSimilarityCheck();
        }
    }, [person, selfieKey]);

    // When we have a person, fetch the AI summary
    useEffect(() => {
        let cancelled = false;
        (async () => {
            if (!person) return;
            try {
                setSummaryLoading(true);
                setSummary('');
                setSummaryError('');
                // your record’s id field might be id or person_id — handle both
                const pid = person.id ?? person.person_id;
                if (!pid) return;
                const ai = await getAiSummary(pid);
                if (!cancelled) setSummary(ai.summary || "");
            } catch (e) {
                console.error("ai-summary failed:", e);
                if (!cancelled) setSummaryError('AI summary failed');
            } finally {
                if (!cancelled) setSummaryLoading(false);
            }
        })();
        return () => { cancelled = true; };
    }, [person]);


    if (loading) return <div className="results-page"><h1>Searching…</h1></div>;
    if (error) return (
        <div className="results-page">
            <h1>Error</h1>
            <p style={{ color: "crimson" }}>{error}</p>
            <button className="btn" onClick={() => navigate("/")}>Return</button>
        </div>
    );
    if (!person) return (
        <div className="results-page">
            <h1>No results</h1>
            <button className="btn" onClick={() => navigate("/")}>Return</button>
        </div>
    );

    const photoSrc = person.photo_url || "/adam_jones.png";

    return (
        <div className="results-page">
            <h1>Background Check Results for {person.first_name ?? firstName} {person.last_name ?? lastName}</h1>

            <div className="photo-and-summary">
                <img
                    src={photoSrc}
                    onError={(e) => { e.currentTarget.src = blankPhoto; }}
                    alt="Profile"
                    width="200"
                    height="250"
                />
                <div className="summary-box" aria-live="polite" aria-busy={summaryLoading}>
                    {summaryLoading ? (
                        <div className="summary-skeleton">
                            <span className="spinner" aria-label="Loading" role="status"></span>
                            <div className="bar"></div>
                            <div className="bar"></div>
                            <div className="bar"></div>
                        </div>
                    ) : summary ? (
                        summary
                    ) : summaryError ? (
                        <span className="muted">{summaryError}</span>
                    ) : (
                        <span className="muted">AI summary not available</span>
                    )}
                </div>
            </div>

            {selfieKey && similarityResult && (
                <Section title="Similarity Check">
                    <p>Similarity Score: <strong>{similarityResult?.score ?? "—"}</strong></p>
                    <p>Status: {similarityResult?.status ?? "—"}</p>
                </Section>
            )}

            <Section title="Description">
                <p>Height: {person.height || "—"}, Weight: {person.weight ?? "—"} lbs, Hair: {person.hair || "—"}, Eyes: {person.eyes || "—"}</p>
                <p>Sex: {person.sex || "—"} | Race: {person.race || "—"} | Ethnicity: {person.ethnicity || "—"} | DOB: {fmt(person.dob)}</p>
                <p>Offender ID: {person.offender_id || "—"} | Risk Level: {person.risk_level ?? "—"} | Designation: {person.designation || "—"}</p>
                {person.photo_date && <p>Photo Date: {fmt(person.photo_date)}</p>}
                {person.last_updated && <p>Last Updated: {fmt(person.last_updated)}</p>}
            </Section>

            <Section title="Last Known Address">
                <p>{formatPrimaryAddress(person.addresses)}</p>
            </Section>

            <Section title="All Addresses">
                <List
                    data={person.addresses}
                    empty="None Reported"
                    render={(a, i) => (
                        <li key={i}><strong>{a.type ?? "ADDR"}</strong>: {lineAddr(a)}</li>
                    )}
                />
            </Section>

            <Section title="Current Convictions">
                <List
                    data={person.convictions}
                    empty="No convictions"
                    render={(c, i) => (
                        <li key={i} style={{ marginBottom: 8 }}>
                            <div><strong>{c.title || "—"}</strong> {c.class ? `Class ${c.class}` : ""} {c.category ? `(${c.category})` : ""}</div>
                            {c.description && <div>{c.description}</div>}
                            <small>
                                PL {c.pl_section || "—"}{c.subsection ? `(${c.subsection})` : ""} | Counts: {c.counts ?? "—"} |
                                Crime: {fmt(c.date_of_crime)} | Convicted: {fmt(c.date_convicted)} |
                                Computer used: {bool(c.computer_used)} | Pornography involved: {bool(c.pornography_involved)}
                            </small>
                            {c.victim_sex_age && <div><small>Victim: {c.victim_sex_age}</small></div>}
                            {(c.arresting_agency || c.relationship_to_victim || c.weapon_used || c.force_used) && (
                                <div>
                                    <small>
                                        {c.arresting_agency ? `Arresting agency: ${c.arresting_agency}` : ""}
                                        {c.relationship_to_victim ? ` | Relationship: ${c.relationship_to_victim}` : ""}
                                        {c.weapon_used ? ` | Weapon: ${c.weapon_used}` : ""}
                                        {c.force_used ? ` | Force: ${c.force_used}` : ""}
                                    </small>
                                </div>
                            )}
                            {c.sentence_term || c.sentence_type ? (
                                <div><small>Sentence: {c.sentence_term || "—"} {c.sentence_type ? `(${c.sentence_type})` : ""}</small></div>
                            ) : null}
                        </li>
                    )}
                />
            </Section>

            <Section title="Previous Conviction(s) Requiring Registration">
                <List
                    data={person.previous_convictions}
                    empty="None Reported"
                    render={(pc, i) => <li key={i}>{pc.title || "—"}</li>}
                />
            </Section>

            <Section title="Supervising Agency Information">
                <List
                    data={person.supervising_agencies}
                    empty="None Reported"
                    render={(sa, i) => <li key={i}>{sa.agency_name || "—"}</li>}
                />
            </Section>

            <Section title="Special Conditions of Supervision">
                <List
                    data={person.special_conditions}
                    empty="None Reported"
                    render={(sc, i) => <li key={i}>{sc.description || "—"}</li>}
                />
            </Section>

            <Section title="Maximum Expiration Date/Post Release Supervision Date of Sentence">
                <List
                    data={person.max_expiration_dates}
                    empty="None Reported"
                    render={(me, i) => <li key={i}>{me.description || "—"}</li>}
                />
            </Section>

            <Section title="Scars / Marks / Tattoos">
                <List
                    data={person.scars_marks}
                    empty="None Reported"
                    render={(sm, i) => <li key={i}>{sm.description || "—"}{sm.location ? ` — ${sm.location}` : ""}</li>}
                />
            </Section>

            <Section title="Aliases / Additional Names">
                <List
                    data={person.aliases}
                    empty="None Reported"
                    render={(x, i) => <li key={i}>{[x.first_name, x.middle_name, x.last_name].filter(Boolean).join(" ")}</li>}
                />
            </Section>

            <Section title="Vehicles">
                <List
                    data={person.vehicles}
                    empty="None Reported"
                    render={(v, i) => <li key={i}>{v.year || "—"} {v.make_model || ""} — {v.color || "—"} ({v.state || "—"} • {v.plate_number || "—"})</li>}
                />
            </Section>

            <button className="btn" onClick={() => navigate("/")} style={{ marginTop: 16 }}>Return</button>
        </div>
    );
}

// Helper components
function Section({ title, children }) {
  return (
    <div className="section">
      <h4>{title}</h4>
      {children}
    </div>
  );
}
function List({ data, render, empty }) {
    if (!data?.length) return <p className="muted">{empty}</p>;
    return <ul className="list">{data.map(render)}</ul>;
}
function lineAddr(a = {}) {
    const parts = [a.street, a.city, a.state, a.zip].filter(Boolean);
    const line = parts.join(", ");
    return a.county ? `${line} (${a.county})` : line || "—";
}
function formatPrimaryAddress(addrs = []) {
    if (!addrs.length) return "—";
    const primary = addrs.find(a => (a.type || "").toUpperCase() === "RES") || addrs[0];
    return lineAddr(primary);
}
function fmt(d) {
    if (!d) return "—";
    const t = typeof d === "string" ? d : String(d);
    return t.length >= 10 ? t.slice(0, 10) : t;
}
function bool(b) {
    return b === true ? "Yes" : b === false ? "No" : "—";
}
