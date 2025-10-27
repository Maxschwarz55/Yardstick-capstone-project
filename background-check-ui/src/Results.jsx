// src/Results.jsx
import React, { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import "./Results.css";
import blankPhoto from "./Blank-Profile-Picture.webp";

export default function Results() {
  const { state } = useLocation();
  const navigate = useNavigate();
  const firstName = state?.firstName;
  const lastName  = state?.lastName;

  const [loading, setLoading] = useState(true);
  const [person, setPerson]   = useState(null);
  const [error, setError]     = useState("");

  const API = "http://localhost:4000";

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
          throw new Error(`HTTP ${res.status}: ${text.slice(0,200)}`);
        }
        if (!ct.includes("application/json")) {
          const text = await res.text().catch(() => "");
          throw new Error(`Expected JSON, got: ${text.slice(0,120)}…`);
        }

        const json = await res.json();
        const firstMatch = json?.data?.[0] ?? null;
        if (!cancelled) setPerson(firstMatch);
      } catch (e) {
        if (!cancelled) setError(e.message ?? "Failed to fetch");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [firstName, lastName, navigate, API]);

  if (loading) return <div className="results-page"><h1>Searching…</h1></div>;
  if (error)   return <div className="results-page"><h1>Error</h1><p style={{color:"crimson"}}>{error}</p><button className="btn" onClick={()=>navigate("/")}>Return</button></div>;
  if (!person) return <div className="results-page"><h1>No results</h1><button className="btn" onClick={()=>navigate("/")}>Return</button></div>;
  
  const photoSrc = "/adam_jones.png";

  return (
    <div className="results-page">
      <h1>Background Check Results for {person.first_name ?? firstName} {person.last_name ?? lastName}</h1>

      <div className="photo-and-summary">
        <img src={photoSrc} onError={(e)=>{e.currentTarget.src = blankPhoto;}} alt="Profile" width="200" height="250" />
        <div className="summary-box">
          {"Do not hire: candidate has appeared in the New York Sex Offender Registry and is convicted of 3rd degree rape"}
        </div>
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
          render={(a,i)=>(
            <li key={i}><strong>{a.type ?? "ADDR"}</strong>: {lineAddr(a)}</li>
          )}
        />
      </Section>

      <Section title="Current Convictions">
        <List
          data={person.convictions}
          empty="No convictions"
          render={(c,i)=>(
            <li key={i} style={{marginBottom:8}}>
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

      <Section title="Previous Convictions">
        <List
          data={person.previous_convictions}
          empty="None Reported"
          render={(pc,i)=> <li key={i}>{pc.title || "—"}</li>}
        />
      </Section>

      <Section title="Law Enforcement Agencies">
        <List
          data={person.law_enforcement_agencies}
          empty="None Reported"
          render={(lea,i)=> <li key={i}>{lea.agency_name || "—"}</li>}
        />
      </Section>

      <Section title="Supervising Agencies">
        <List
          data={person.supervising_agencies}
          empty="None Reported"
          render={(sa,i)=> <li key={i}>{sa.agency_name || "—"}</li>}
        />
      </Section>

      <Section title="Special Conditions">
        <List
          data={person.special_conditions}
          empty="None Reported"
          render={(sc,i)=> <li key={i}>{sc.description || "—"}</li>}
        />
      </Section>

      <Section title="Max Expiration / PRS Dates">
        <List
          data={person.max_expiration_dates}
          empty="None Reported"
          render={(me,i)=> <li key={i}>{me.description || "—"}</li>}
        />
      </Section>

      <Section title="Scars / Marks / Tattoos">
        <List
          data={person.scars_marks}
          empty="None Reported"
          render={(sm,i)=> <li key={i}>{sm.description || "—"}{sm.location ? ` — ${sm.location}` : ""}</li>}
        />
      </Section>

      <Section title="Aliases / Additional Names">
        <List
          data={person.aliases}
          empty="None Reported"
          render={(x,i)=> <li key={i}>{[x.first_name, x.middle_name, x.last_name].filter(Boolean).join(" ")}</li>}
        />
      </Section>

      <Section title="Vehicles">
        <List
          data={person.vehicles}
          empty="None Reported"
          render={(v,i)=> <li key={i}>{v.year || "—"} {v.make_model || ""} — {v.color || "—"} ({v.state || "—"} • {v.plate_number || "—"})</li>}
        />
      </Section>

      <button className="btn" onClick={()=>navigate("/")} style={{marginTop:16}}>Return</button>
    </div>
  );
}

function Section({ title, children }) {
  return <div className="section"><h4>{title}</h4>{children}</div>;
}
function List({ data, render, empty }) {
  if (!data?.length) return <p className="muted">{empty}</p>;
  return <ul className="list">{data.map(render)}</ul>;
}
function lineAddr(a={}) {
  const parts = [a.street, a.city, a.state, a.zip].filter(Boolean);
  const line = parts.join(", ");
  return a.county ? `${line} (${a.county})` : line || "—";
}
function formatPrimaryAddress(addrs=[]) {
  if (!addrs.length) return "—";
  const primary = addrs.find(a => (a.type||"").toUpperCase()==="RES") || addrs[0];
  return lineAddr(primary);
}
function fmt(d) {
  if (!d) return "—";
  // handle both string dates and ISO strings
  const t = typeof d === "string" ? d : String(d);
  // show YYYY-MM-DD if possible
  return t.length >= 10 ? t.slice(0,10) : t;
}
function bool(b) {
  return b === true ? "Yes" : b === false ? "No" : "—";
}
