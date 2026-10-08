import React, { useState, useEffect } from "react";
import NflApp from "./AppNfl.jsx";
import NbaApp from "./AppNba.jsx";

// Redzone Labs — multi-sport shell. One app, league switcher in the header.
export default function App() {
  const [sport, setSport] = useState(() => {
    try { return localStorage.getItem("rz_sport") || "nfl"; } catch (e) { return "nfl"; }
  });
  useEffect(() => { try { localStorage.setItem("rz_sport", sport); } catch (e) {} }, [sport]);
  return sport === "nba"
    ? <NbaApp sport={sport} setSport={setSport} />
    : <NflApp sport={sport} setSport={setSport} />;
}
