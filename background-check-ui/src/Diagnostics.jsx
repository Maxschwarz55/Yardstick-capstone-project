import React from "react";
import { useLocation } from "react-router-dom";
import "./Diagnostics.css";


export default function Diagnostics() {
    const location = useLocation();
  return (
    <div className="diag-page">
      <h1>Diagnostics</h1>

      <div className="diag-grid">
        <section className="card">
          <header className="card-hdr">
            <h2>Databases crawled and when: </h2>
          </header>
          <div className="card-body">
            <h3>NY Sex offender Registry</h3>
            <p>Last crawled: 2025-10-11 14:23:45</p>
            <p>Database last updated: 2025-10-10 </p>
            
            <h3>NY Criminal Records</h3>
            <p>Last crawled: 2025-10-11 14:25:12</p>
            <p>Database last updated: 2025-10-10 </p>

            <h3>NY Civil Records</h3>
            <p>Last crawled: 2025-10-11 14:26:30</p>
            <p>Database last updated: 2025-10-09 </p>


          </div>
          <footer className="card-ftr">
          </footer>
        </section>


        


      </div>
    </div>
  );
}
