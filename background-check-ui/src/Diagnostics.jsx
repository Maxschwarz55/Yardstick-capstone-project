// src/Diagnostics.jsx
import React, { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import "./Diagnostics.css";
import { BrowserRouter as Router, Routes, Route, useNavigate } from "react-router-dom";

const API = process.env.REACT_APP_API_URL || "http://localhost:4000";

export default function Diagnostics() {
  const location = useLocation();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState("");
  const [diag, setDiag]       = useState(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        setLoading(true);
        setError("");
        const res = await fetch(`${API}/diagnostics`);
        const ct = res.headers.get("content-type") || "";
        if (!res.ok) {
          const text = await res.text().catch(()=>"");
          throw new Error(`HTTP ${res.status}: ${text.slice(0,120)}`);
        }
        if (!ct.includes("application/json")) {
          const text = await res.text().catch(()=>"");
          throw new Error(`Expected JSON, got: ${text.slice(0,120)}…`);
        }
        const json = await res.json();
        if (!cancelled) setDiag(json);
      } catch (e) {
        if (!cancelled) setError(e.message ?? "Failed to fetch diagnostics");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  const returnClick = () => navigate("/");

  if (loading) return <div className="diag-page"><h1>Diagnostics</h1><p>Loading…</p></div>;
  if (error)   return <div className="diag-page"><h1>Diagnostics</h1><p style={{color:"crimson"}}>{error}</p><button className="btn" onClick={returnClick}>Return</button></div>;
  if (!diag)   return <div className="diag-page"><h1>Diagnostics</h1><p>No data</p><button className="btn" onClick={returnClick}>Return</button></div>;

  const totalPersons  = diag?.totals?.person ?? 0;
  const lastCrawled   = fmt(diag?.lastCrawled);
  const nextScheduled = fmt(diag?.nextSched);
  const zips          = diag?.zips ?? [];

  return (
    <div className="diag-page">
      <h1>Diagnostics</h1>

      <div className="diag-grid">
        <section className="card">
          <header className="card-hdr">
            <h2>Databases & Crawl Status</h2>
          </header>
          <div className="card-body">
            <h3>NY Sex Offender Registry</h3>
            <p>Total records in database: {num(totalPersons)}</p>
            <p>Last crawled: {lastCrawled}</p>
            <p>Next scheduled crawl: {nextScheduled}</p>
            <p>Records added in last crawl: 15</p>
            <p>Records updated in last crawl: 7</p>
            <p>Database last updated: 2025-10-10 </p>
            
            <h3>NY Criminal Records</h3>
            <p>Total records in database: 438,529</p>
            <p>Last crawled: 2025-10-11 14:25:12</p>
            <p>Records added in last crawl: 13</p>
            <p>Records updated in last crawl: 54</p>
            <p>Database last updated: 2025-10-10 </p>
            <p>Next scheduled crawl: 2025-10-21 10:00:00</p>


            <h3>NY Civil Records</h3>
            <p>Total records in database: 39,619</p>
            <p>Last crawled: 2025-10-11 14:26:30</p>
            <p>Records added in last crawl: 63</p>
            <p>Records updated in last crawl: 29</p>
            <p>Database last updated: 2025-10-09 </p>
            <p>Next scheduled crawl: 2025-10-21 10:00:00</p>



            {zips.length > 0 && (
              <>
                <h3 style={{marginTop:16}}>Recent ZIP Activity</h3>
                <table className="zip-table">
                  <thead>
                    <tr>
                      <th>ZIP</th>
                      <th>Last Crawled</th>
                      <th>Next Scheduled</th>
                      <th>Total Records</th>
                      <th>Added (last crawl)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {zips.slice(0,10).map((z, i) => (
                      <tr key={i}>
                        <td>{z.zip}</td>
                        <td>{fmt(z.lastCrawled)}</td>
                        <td>{fmt(z.nextScheduled)}</td>
                        <td>{num(z.totalRecords)}</td>
                        <td>{num(z.recordsAdded)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </>
            )}
          </div>
          <footer className="card-ftr"></footer>
        </section>
      </div>

      <button className="btn" onClick={returnClick}>Return</button>
    </div>
  );
}

function fmt(d) {
  if (!d) return "—";
  const date = new Date(d);
  if (isNaN(date.getTime())) return String(d);
  const pad = (n) => String(n).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth()+1)}-${pad(date.getDate())} ${pad(date.getHours())}:${pad(date.getMinutes())}`;
}
function num(n) {
  if (n === null || n === undefined) return "—";
  return Number(n).toLocaleString();
}
