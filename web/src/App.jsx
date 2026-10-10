import React, { useState, useEffect } from "react";
import NflApp from "./AppNfl.jsx";
import NbaApp from "./AppNba.jsx";
import NhlApp from "./AppNhl.jsx";
import CollegeApp from "./AppCollege.jsx";

export default function App() {
  const [sport, setSport] = useState(() => { try { return localStorage.getItem("rz_sport") || "nfl"; } catch (e) { return "nfl"; } });
  useEffect(() => { try { localStorage.setItem("rz_sport", sport); } catch (e) {} }, [sport]);
  const props = { sport, setSport };
  if (sport === "nba") return <NbaApp {...props} />;
  if (sport === "nhl") return <NhlApp {...props} />;
  if (sport === "ncaaf") return <CollegeApp {...props} league="cfb" />;
  if (sport === "ncaam") return <CollegeApp {...props} league="ncaam" />;
  return <NflApp {...props} />;
}
