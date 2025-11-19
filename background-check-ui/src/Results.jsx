// src/Results.jsx
import React, { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import "./Results.css";
import blankPhoto from "./Blank-Profile-Picture.webp";
import SelfieUploader from "./SelfieUploader";

export default function Results() {
  const { state } = useLocation();
  const navigate = useNavigate();
  const firstName = state?.firstName;
  const lastName  = state?.lastName;

  const [loading, setLoading] = useState(true);
  const [person, setPerson] = useState(null);
  const [error, setError] = useState("");
  const [uploadedSelfieKey, setUploadedSelfieKey] = useState(null);
  const [similarityResult, setSimilarityResult] = useState(null);

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
          throw new Error(`HTTP ${res.status}: ${text.slice(0,200)}`);
        }
        if (!ct.includes("application/json")) {
          const text = await res.text().catch(() => "");
          throw new Error(`Expected JSON, got: ${text.slice(0,120)}…`);
        }

        const json = await res.json();
        const firstMatch = json?.data?.[0] ?? null;
        if (!cancelled) setPerson(firstMatch);

        if(fistMatch?.photo_url){
            const similarityRes = await fetch(`${API}/similarity/check`, {

            });
        }
      } catch (e) {
        if (!cancelled) setError(e.message ?? "Failed to fetch");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [firstName, lastName, navigate, API]);

  // Run similarity check
  async function checkSimilarity(s3Key) {
    if (!person) return;

    const inputPerson = {
      first_name: person.first_name || "",
      last_name: person.last_name || "",
      dob: person.dob || "",
      photo_s3_key: s3Key
    };

    const dbPerson = {
      first_name: person.first_name,
      last_name: person.last_name,
      dob: person.dob,
      photo_s3_key: person.photo_url // existing DB photo S3 key or URL
    };

    try {
      const res = await fetch(`${API}/api/check_similarity`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ input_person: inputPerson, db_person: dbPerson })
      });
      const data = await res.json();
      setSimilarityResult(data);
    } catch (err) {
      console.error("Similarity check failed", err);
    }
  }

  if (loading) return <div className="results-page"><h1>Searching…</h1></div>;
  if (error) return (
    <div className="results-page">
      <h1>Error</h1>
      <p style={{color:"crimson"}}>{error}</p>
      <button className="btn" onClick={()=>navigate("/")}>Return</button>
    </div>
  );
  if (!person) return (
    <div className="results-page">
      <h1>No results</h1>
      <button className="btn" onClick={()=>navigate("/")}>Return</button>
    </div>
  );

  const photoSrc = person.photo_url || "/adam_jones.png";

  return (
    <div className="results-page">
      <h1>Background Check Results for {person.first_name ?? firstName} {person.last_name ?? lastName}</h1>

      {/* Selfie uploader */}
      <SelfieUploader
        personId={person.offender_id || "temp"}
        onUploadComplete={(s3Key) => {
          setUploadedSelfieKey(s3Key);
          checkSimilarity(s3Key);
        }}
      />

      <div className="photo-and-summary">
        <img
          src={photoSrc}
          onError={(e)=>{e.currentTarget.src = blankPhoto;}}
          alt="Profile"
          width="200"
          height="250"
        />
        <div className="summary-box">
          {"Do not hire: candidate has appeared in the New York Sex Offender Registry and is convicted of 3rd degree rape"}
          {similarityResult && (
            <div style={{marginTop:"8px"}}>
              <strong>Match Score:</strong> {similarityResult.score}/10<br/>
              <strong>Decision:</strong> {similarityResult.decision}
            </div>
          )}
        </div>
      </div>

      {/* The rest of your sections remain unchanged */}
      <Section title="Description">
        <p>Height: {person.height || "—"}, Weight: {person.weight ?? "—"} lbs, Hair: {person.hair || "—"}, Eyes: {person.eyes || "—"}</p>
        <p>Sex: {person.sex || "—"} | Race: {person.race || "—"} | Ethnicity: {person.ethnicity || "—"} | DOB: {fmt(person.dob)}</p>
        <p>Offender ID: {person.offender_id || "—"} | Risk Level: {person.risk_level ?? "—"} | Designation: {person.designation || "—"}</p>
        {person.photo_date && <p>Photo Date: {fmt(person.photo_date)}</p>}
        {person.last_updated && <p>Last Updated: {fmt(person.last_updated)}</p>}
      </Section>

      {/* ...keep all your other sections here as-is... */}

      <button className="btn" onClick={()=>navigate("/")} style={{marginTop:16}}>Return</button>
    </div>
  );
}

// Helper components
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
  const t = typeof d === "string" ? d : String(d);
  return t.length >= 10 ? t.slice(0,10) : t;
}
function bool(b) {
  return b === true ? "Yes" : b === false ? "No" : "—";
}
