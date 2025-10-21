import React from "react";
import { useLocation} from "react-router-dom";
import "./Results.css";
import blankPhoto from "./Blank-Profile-Picture.webp";
import App from "./App";
import { BrowserRouter as Router, Routes, Route, useNavigate } from "react-router-dom";




export default function Results() {
    const location = useLocation();
    const navigate = useNavigate();
    const { firstName } = location.state || {};
    const { lastName } = location.state || {};
    const returnClick = () => {
        navigate("/"); 
    };
    return (
    <div className="results-page">
        <h1>Background Check Results for {firstName} {lastName}</h1>
        <div className = "photo-and-summary">  
            <img src={blankPhoto} alt="Profile" width="230" height="200" />
            <div className="summary-box"></div>
            AI generated summary will appear here (ex. "No criminal history found, would reccommend hiring based on available data")
        </div>

        <h4>Description:</h4>
        <p>Height: 5'10", Weight: 160 lbs, Hair Color: Brown, Eye Color: Blue</p>
        
        <h4>Last Known Address:</h4>
        <p>123 Main St, Springfield, IL 62701</p>

        <h4>Criminal History: </h4>
        <p>No criminal history found.</p>

        <button className="btn" onClick={returnClick}>Return</button>

    </div>
    
        
    );
}
