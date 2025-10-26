import React from "react";
import { useLocation } from "react-router-dom";
import "./Diagnostics.css";
import { BrowserRouter as Router, Routes, Route, useNavigate } from "react-router-dom";


export default function Diagnostics() {
    const location = useLocation();
    const navigate = useNavigate();
    const returnClick = () => {
        navigate("/"); 
    };
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
            <p>Total records in database: 50,629</p>
            <p>Last crawled: 2025-10-11 14:23:45</p>
            <p>Records added in last crawl: 15</p>
            <p>Records updated in last crawl: 7</p>
            <p>Database last updated: 2025-10-10 </p>
            <p>Next scheduled crawl: 2025-10-21 10:00:00</p>
            
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



          </div>
          <footer className="card-ftr">
          </footer>
        </section>




        


      </div>
      <button className="btn" onClick={returnClick}>Return</button>

    </div>
  );
}
