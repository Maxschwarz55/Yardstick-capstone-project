
import './App.css';
import React, { useState } from "react";
import { BrowserRouter as Router, Routes, Route, useNavigate } from "react-router-dom";
import Results from "./Results";
import Diagnostics from "./Diagnostics";
import SelfieUploader from "./SelfieUploader";



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
  const [middleName, setMiddleName] = useState("");
  const [lastName, setLastName] = useState("");
  const [dob, setDob] = useState("");

  // NEW — address fields
  const [street, setStreet] = useState("");
  const [city, setCity] = useState("");
  const [stateAddr, setStateAddr] = useState("");
  const [zip, setZip] = useState("");
  const [selfieKey, setSelfieKey] = useState(null);

  const navigate = useNavigate();

  const handleClick = () => {
    if (firstName.trim() === "" || lastName.trim() === "") {
      alert("Please enter both first and last names.");
      return;
    }

    navigate("/results", {
      state: {
        firstName,
        middleName,
        lastName,
        dob,
        street,
        city,
        state: stateAddr,
        zip,
        selfieKey
      },
    });
  };

  return (
    <div className="App container">
      <h1 className='underline'>Background Check</h1>

      <div className="form">

        <input
          type="text"
          placeholder="First Name"
          value={firstName}
          onChange={(e) => setFirstName(e.target.value)}
        />

        <input
          type="text"
          placeholder="Middle Name (optional)"
          value={middleName}
          onChange={(e) => setMiddleName(e.target.value)}
        />

        <input
          type="text"
          placeholder="Last Name"
          value={lastName}
          onChange={(e) => setLastName(e.target.value)}
        />

        <label className="dob">
          Date of birth <DOBPicker value={dob} onChange={setDob} />
        </label>

        {/* NEW — Address block */}
        <input
          type="text"
          placeholder="Street Address"
          value={street}
          onChange={(e) => setStreet(e.target.value)}
        />

        <input
          type="text"
          placeholder="City"
          value={city}
          onChange={(e) => setCity(e.target.value)}
        />

        <input
          type="text"
          placeholder="State"
          value={stateAddr}
          onChange={(e) => setStateAddr(e.target.value)}
        />

        <input
          type="text"
          placeholder="Zip Code"
          value={zip}
          onChange={(e) => setZip(e.target.value)}
        />

        <h3>Upload a Selfie</h3>
        <SelfieUploader onUploadComplete={setSelfieKey} />

      </div>

      <button className="btn" onClick={handleClick}>Run Search</button>
      <button className="btn btn-secondary" onClick={() => navigate("/diagnostics")}>
        Diagnostics
      </button>
    </div>
  );
}



