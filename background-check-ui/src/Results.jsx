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
        const bodyText = ct.includes("application/json")
  
        if (!res.ok) {
          throw new Error(
            `HTTP ${res.status}$`
          );
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

    return () => {
      cancelled = true;
    };
  }, [firstName, lastName, navigate, API]);

  if (loading) return <div className="results-page"><h1>Searching…</h1></div>;
  if (error)   return <div className="results-page"><h1>Error</h1><p style={{color:"crimson"}}>{error}</p><button className="btn" onClick={()=>navigate("/")}>Return</button></div>;
  if (!person) return <div className="results-page"><h1>No results</h1><button className="btn" onClick={()=>navigate("/")}>Return</button></div>;

  return (
    <div className="results-page">
<<<<<<< HEAD
      <h1>Background Check Results for {person.first_name} {person.last_name}</h1>

      <div className="photo-and-summary">
        <img src={blankPhoto} alt="Profile" width="230" height="200" />
        <div className="summary-box">
          {person.convictions?.length ? "Convictions found" : "No convictions in current data"}
        </div>
      </div>

      <h4>Description</h4>
      <p>
        Height: {person.height || "—"}, Weight: {person.weight ?? "—"} lbs, Hair: {person.hair || "—"}, Eyes: {person.eyes || "—"}
      </p>
      <p>
        Sex: {person.sex || "—"} | Race: {person.race || "—"} | Ethnicity: {person.ethnicity || "—"} | DOB: {person.dob || "—"}
      </p>
      <p>
        Offender ID: {person.offender_id || "—"} | Risk Level: {person.risk_level ?? "—"} | Designation: {person.designation || "—"}
      </p>

      <h4>Last Known Address</h4>
      <p>{formatPrimaryAddress(person.addresses)}</p>

      <Section title="All Addresses">
        <List data={person.addresses} empty="No addresses" render={(a,i)=>
          <li key={i}><strong>{a.type ?? "ADDR"}</strong>: {lineAddr(a)}</li>} />
      </Section>
=======
        <h1>Background Check Results for {firstName} {lastName}</h1>
        <div className="photo-and-summary">
        <img src={blankPhoto} alt="Profile" width="230" height="200" />
        <div className="summary-box">
            AI generated summary will appear here (ex. "No criminal history found...")
        </div>
        </div>

>>>>>>> 344ac6d6a9699355c0a32465e6e6f2956e40ad48

      <Section title="Current Convictions">
        <List data={person.convictions} empty="No convictions" render={(c,i)=>
          <li key={i} style={{marginBottom:8}}>
            <div><strong>{c.title || "—"}</strong> {c.class ? `Class ${c.class}` : ""} {c.category ? `(${c.category})` : ""}</div>
            {c.description && <div>{c.description}</div>}
            <small>
              PL {c.pl_section || "—"} | Counts: {c.counts ?? "—"} | Crime: {c.date_of_crime || "—"} | Convicted: {c.date_convicted || "—"}
            </small>
          </li>} />
      </Section>

      <Section title="Aliases / Additional Names">
        <List data={person.aliases} empty="None" render={(x,i)=>
          <li key={i}>{[x.first_name, x.middle_name, x.last_name].filter(Boolean).join(" ")}</li>} />
      </Section>

      <Section title="Vehicles">
        <List data={person.vehicles} empty="None" render={(v,i)=>
          <li key={i}>{v.year || "—"} {v.make_model || ""} — {v.color || "—"} ({v.state || "—"} • {v.plate_number || "—"})</li>} />
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
