
import './App.css';
import React, { useState } from "react";
import { BrowserRouter as Router, Routes, Route, useNavigate } from "react-router-dom";
import Results from "./Results";
import Diagnostics from "./Diagnostics";


function DOBPicker({ value, onChange }) {
  return (
    <input
      type="date"
      value={value}
      onChange={(e) => onChange(e.target.value)}
    />
  );
}



export default function App() {
  return (
<Router>
  <Routes>
    <Route path="/" element={<Home />} />
    <Route path="/results" element={<Results />} />
    <Route path="/diagnostics" element={<Diagnostics />} /> {/* new route */}
  </Routes>
</Router>
  );
}

function Home() {

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [dob, setDob] = useState("");
  const navigate = useNavigate();

  const handleClick = () => {
    if (firstName.trim() === "" || lastName.trim() === "") {
      alert("Please enter both first and last names.");
      return;
    } else {
      navigate("/results", { state: { firstName: firstName, lastName: lastName } });
    }
  };

    const diagnosticsClick = () => {
    navigate("/diagnostics");
  };
  return (
    <div className="App">
      <h1> Background Check</h1>
      

      <input
      type="text"
      placeholder="First Name"
      value={firstName}
      onChange={(e) => setFirstName(e.target.value)}
      />

      <input
      type="text"
      placeholder="Last Name"
      value={lastName}
      onChange={(e) => setLastName(e.target.value)}
      />

      <div style={{ padding: 16 }}>
      <label>
        Date of birth <DOBPicker value={dob} onChange={setDob} />
      </label>
      </div>
      

     {/* <p>Name: {firstName}</p> 
      <p>Name: {lastName}</p>
      <p>DOB: {dob}</p> */}

      <button className="btn" onClick={handleClick}>Run Search</button>
      <button className="btn btn-secondary" onClick={() => navigate("/diagnostics")}>
      Diagnostics
      </button>


    </div>

    
  );
}

