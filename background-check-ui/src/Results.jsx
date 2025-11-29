import React, { useEffect, useState, useCallback } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import "./Results.css";
import blankPhoto from "./Blank-Profile-Picture.webp";
import { getAiSummary } from "./api";

export default function Results() {
    const { state } = useLocation();
    const navigate = useNavigate();
    const firstName = state?.firstName;
    const lastName = state?.lastName;
    const dob = state?.dob;
    const selfieKey = state?.selfieKey;

    const [loading, setLoading] = useState(true);
    const [people, setPeople] = useState([]);
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

                const url = `${API}/records/search/by-name?first=${encodeURIComponent(
                    firstName
                )}&last=${encodeURIComponent(lastName)}&limit=50&page=1`;

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
                //const firstMatch = json?.data?.[0] ?? null;
                const matches = json?.data ?? [];
                if (!cancelled) setPeople(matches);

            } catch (e) {
                if (!cancelled) setError(e.message ?? "Failed to fetch");
            } finally {
                if (!cancelled) setLoading(false);
            }
        })();
        return () => { cancelled = true; };
    }, [firstName, lastName, navigate, API]);

    const runSimilarityCheck = useCallback(async () => {
        const person = people[0];
        if (!person) {
            console.log("No person found, skipping similarity check");
            return;
        }

        const inputPerson = {
            first_name: firstName || "",
            last_name: lastName || "",
            middle_name: middleName || "",
            dob: dob || null,
            photo_s3_key: selfieKey || null
        };

        const dbPerson = {
            first_name: person.first_name,
            last_name: person.last_name,
            middle_name: person.middle_name,
            dob: person.dob,
            photo_s3_key: person.photo_s3_key || null
        };

        console.log("Running similarity check with:", { inputPerson, dbPerson });

        try {
            const res = await fetch(`${API}/similarity/check`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ input_person: inputPerson, db_person: dbPerson })
            });
            const data = await res.json();
            console.log("Similarity result data:", data);
            setSimilarityResult(data);
        } catch (err) {
            console.error("Similarity check failed", err);
        }
    }, [selfieKey, API, firstName, middleName, lastName, dob, people]);

    useEffect(() => {
        console.log("Person record:", people);
        if (people.length > 0) {
            runSimilarityCheck();
        }
    }, [people, runSimilarityCheck]);


    // When we have a person, fetch the AI summary
    useEffect(() => {
        if(people.length === 0) return;

        let cancelled = false;
        (async () => {
            try {
                setSummaryLoading(true);
                setSummary('');
                setSummaryError('');
                // your record’s id field might be id or person_id — handle both
                const pid = people[0].person_id;
                if (!pid) return;
                console.log("Sending person_id =", pid);
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
    }, [people]);


    if (loading) return <div className="results-page"><h1>Searching…</h1></div>;
    if (error) return (
        <div className="results-page">
            <h1>Error</h1>
            <p style={{ color: "crimson" }}>{error}</p>
            <button className="btn" onClick={() => navigate("/")}>Return</button>
        </div>
    );
    if (people.length === 0) return (
        <div className="results-page">
            <h1>No results</h1>
            <button className="btn" onClick={() => navigate("/")}>Return</button>
        </div>
    );

    //const photoSrc = getPhotoSrc(people[0]);


    return (
        <div className="results-page">
            <h1>Background Check Results</h1>
                        <div className="ai-summary" aria-live="polite" aria-busy={summaryLoading}>
                {summaryLoading ? (
                    <div className="summary-skeleton">
                        <span className="spinner" aria-label="Loading" role="status"></span>
                        <div className="bar"></div><div className="bar"></div><div className="bar"></div>
                    </div>
                ) : summary ? (
                    summary
                ) : summaryError ? (
                    <span className="muted">{summaryError}</span>
                ) : (
                    <span className="muted">AI summary not available</span>
                )}
            </div>

            {similarityResult && (
                <Section title="Similarity Check">
                    <p>Similarity Score: <strong>{similarityResult?.scoreBreakdown.total ?? "—"} / 12 </strong></p>
                    <p>Similarity Decision: <strong>{similarityResult?.decision ?? "—"}</strong></p>
                </Section>
            )}

            <h2>Matched Individuals ({people.length})</h2>

            {people.map((p, idx) => (
                <div key={p.person_id || idx} className="person-card">
                    <PersonEntry person={p} />
                </div>
            ))}

            <button className="btn" onClick={() => navigate("/")} style={{ marginTop: 16 }}>Return</button>
        </div>
    );
}

function PersonEntry({ person }) {
    const photoSrc =
        person.mugshot_front_url ||
        person.mugshot_side_url ||
        person.photo_url ||
        blankPhoto;

    return (
        <div className="person-entry">
            <h3>{person.first_name} {person.last_name}</h3>

            <div className="photo-and-summary">
                <img
                    src={photoSrc}
                    onError={(e) => { e.currentTarget.src = blankPhoto; }}
                    alt="Profile"
                    width="200"
                    height="250"
                />
            </div>

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
                        </li>
                    )}
                />
            </Section>

            <Section title="Previous Conviction(s) Requiring Registration">
                <List data={person.previous_convictions} empty="None Reported" render={(pc, i) => <li key={i}>{pc.title || "—"}</li>} />
            </Section>

            <Section title="Supervising Agency Information">
                <List data={person.supervising_agencies} empty="None Reported" render={(sa, i) => <li key={i}>{sa.agency_name || "—"}</li>} />
            </Section>

            <Section title="Special Conditions of Supervision">
                <List data={person.special_conditions} empty="None Reported" render={(sc, i) => <li key={i}>{sc.description || "—"}</li>} />
            </Section>

            <Section title="Maximum Expiration Date/Post Release Supervision Date of Sentence">
                <List data={person.max_expiration_dates} empty="None Reported" render={(me, i) => <li key={i}>{me.description || "—"}</li>} />
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
        </div>
    );
}

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

/*
function getPhotoSrc(person) {
  if (!person) return blankPhoto;

  const raw =
    person.mugshot_front_url ||
    person.mugshot_side_url ||
    person.photo_url ||
    null;

  if (!raw) return blankPhoto;

  if (raw.startsWith("data:image")) {
    return raw;
  }

  if (raw.startsWith("http")) {
    return raw.replace(/\\/g, "/");
  }

  return blankPhoto;
}

*/