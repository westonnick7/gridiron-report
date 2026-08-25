import React, { useState, useEffect, useContext, createContext } from "react";
import { ArrowLeft } from "lucide-react";

// ---------- Theme tokens ----------
const T = {
  field: "#0B1210",
  panel: "#121C17",
  turf: "#1C2F22",
  chalk: "#F0EDE4",
  steel: "#8A9A90",
  brass: "#C9A24B",
  clay: "#A8471F",
};
const FONT_DISPLAY = "'Oswald', sans-serif";
const FONT_MONO = "'IBM Plex Mono', monospace";

function f1(v) { return typeof v === "number" ? v.toFixed(1) : "—"; }
function f2(v) { return typeof v === "number" ? v.toFixed(2) : "—"; }
function fSign(v, digits = 1) { return typeof v === "number" ? (v > 0 ? "+" : "") + v.toFixed(digits) : "—"; }

const NFL_OPPONENTS = ["DAL", "KC", "PHI", "SF", "BUF", "MIA", "GB", "SEA", "BAL", "DET"];
const TEAM_NAMES = {
  DAL: "Dallas", KC: "Kansas City", PHI: "Philadelphia", SF: "San Francisco", BUF: "Buffalo",
  MIA: "Miami", GB: "Green Bay", SEA: "Seattle", BAL: "Baltimore", DET: "Detroit",
};

// Where the nightly GitHub Action commits fresh data. Point this at your repo
// once it's set up — see the README in the automation scaffold.
const LIVE_DATA_URL = "https://raw.githubusercontent.com/westonnick7/gridiron-report/main/data/gridiron_report_data.json";

// ---------- Seeded generators (fallback/demo data only — used until live data loads) ----------
function mulberry32(seed) {
  return function () {
    seed |= 0; seed = (seed + 0x6D2B79F5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
function hashStr(s) { let h = 0; for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0; return h; }
function opp(rng) { return NFL_OPPONENTS[Math.floor(rng() * NFL_OPPONENTS.length)]; }

function genQBLog(seed) {
  const rng = mulberry32(seed); const log = [];
  for (let w = 1; w <= 17; w++) {
    const att = 28 + Math.floor(rng() * 12);
    const cmp = Math.min(att, Math.round(att * (0.58 + rng() * 0.15)));
    const yds = Math.round(cmp * (9 + rng() * 4));
    const td = rng() < 0.15 ? 3 : rng() < 0.5 ? 2 : rng() < 0.8 ? 1 : 0;
    const int = rng() < 0.22 ? 1 : rng() < 0.04 ? 2 : 0;
    log.push({ week: w, opp: opp(rng), cmp, att, yds, td, int, result: rng() < 0.5 ? "W" : "L" });
  }
  return log.reverse();
}
function genRBLog(seed) {
  const rng = mulberry32(seed); const log = [];
  for (let w = 1; w <= 17; w++) {
    const att = 12 + Math.floor(rng() * 10);
    const yds = Math.round(att * (3.3 + rng() * 2.6));
    const td = rng() < 0.35 ? 1 : rng() < 0.06 ? 2 : 0;
    const rec = Math.floor(rng() * 5);
    log.push({ week: w, opp: opp(rng), att, yds, td, rec, result: rng() < 0.5 ? "W" : "L" });
  }
  return log.reverse();
}
function genWRLog(seed) {
  const rng = mulberry32(seed); const log = [];
  for (let w = 1; w <= 17; w++) {
    const tgt = 5 + Math.floor(rng() * 7);
    const rec = Math.min(tgt, Math.round(tgt * (0.55 + rng() * 0.3)));
    const yds = Math.round(rec * (9 + rng() * 7));
    const td = rng() < 0.3 ? 1 : rng() < 0.04 ? 2 : 0;
    log.push({ week: w, opp: opp(rng), tgt, rec, yds, td, result: rng() < 0.5 ? "W" : "L" });
  }
  return log.reverse();
}

const POS_ORDER = ["QB", "RB", "WR", "TE"];
const INITIAL_OFFENSE = [
  { name: "Jalen Cross", team: "DAL", pos: "QB", yds: 4120, td: 29, gameLog: genQBLog(11) },
  { name: "Marcus Reed", team: "DAL", pos: "RB", yds: 1330, td: 10, gameLog: genRBLog(22) },
  { name: "Cole Ferris", team: "DAL", pos: "RB", yds: 412, td: 3, gameLog: genRBLog(66) },
  { name: "Tyrell Combs", team: "DAL", pos: "WR", yds: 1145, td: 8, gameLog: genWRLog(33) },
  { name: "Deshawn Price", team: "DAL", pos: "WR", yds: 612, td: 4, gameLog: genWRLog(77) },
  { name: "Miles Vantana", team: "DAL", pos: "WR", yds: 388, td: 2, gameLog: genWRLog(88) },
  { name: "Grant Aoki", team: "DAL", pos: "TE", yds: 498, td: 3, gameLog: genWRLog(99) },
  { name: "Beau Whitfield", team: "KC", pos: "QB", yds: 4380, td: 33, gameLog: genQBLog(44) },
  { name: "Trevor Nash", team: "KC", pos: "RB", yds: 980, td: 7, gameLog: genRBLog(111) },
  { name: "Deion Marsh", team: "KC", pos: "RB", yds: 355, td: 2, gameLog: genRBLog(122) },
  { name: "Xavier Lang", team: "KC", pos: "WR", yds: 1310, td: 11, gameLog: genWRLog(55) },
  { name: "Reese Calder", team: "KC", pos: "WR", yds: 745, td: 5, gameLog: genWRLog(133) },
  { name: "Corey Blaine", team: "KC", pos: "WR", yds: 340, td: 2, gameLog: genWRLog(144) },
  { name: "Sammy Okoye", team: "KC", pos: "TE", yds: 560, td: 4, gameLog: genWRLog(155) },
];

const INITIAL_TEAM_STATS = {
  DAL: { record: "5-2", ppg: 27.4, papg: 21.1, ypg: 378, ypgAllow: 334, offEpa: .09, defEpa: -.04, thirdDownPct: 44.2, redZonePct: 61.3, toMargin: 4 },
  KC: { record: "6-1", ppg: 29.8, papg: 18.6, ypg: 392, ypgAllow: 308, offEpa: .14, defEpa: -.09, thirdDownPct: 47.5, redZonePct: 66.0, toMargin: 7 },
  PHI: { record: "4-3", ppg: 24.6, papg: 22.9, ypg: 355, ypgAllow: 349, offEpa: .05, defEpa: -.01, thirdDownPct: 41.0, redZonePct: 58.2, toMargin: 1 },
  SF: { record: "5-2", ppg: 26.1, papg: 19.4, ypg: 361, ypgAllow: 318, offEpa: .08, defEpa: -.07, thirdDownPct: 43.8, redZonePct: 59.7, toMargin: 5 },
  BUF: { record: "5-2", ppg: 28.9, papg: 20.3, ypg: 384, ypgAllow: 327, offEpa: .12, defEpa: -.05, thirdDownPct: 46.1, redZonePct: 63.4, toMargin: 3 },
  MIA: { record: "3-4", ppg: 22.0, papg: 24.8, ypg: 342, ypgAllow: 361, offEpa: .01, defEpa: .03, thirdDownPct: 38.9, redZonePct: 52.1, toMargin: -2 },
  GB: { record: "4-3", ppg: 23.7, papg: 21.6, ypg: 349, ypgAllow: 336, offEpa: .04, defEpa: -.02, thirdDownPct: 40.5, redZonePct: 56.8, toMargin: 2 },
  SEA: { record: "3-4", ppg: 21.3, papg: 23.5, ypg: 331, ypgAllow: 352, offEpa: -.02, defEpa: .02, thirdDownPct: 37.6, redZonePct: 51.0, toMargin: -3 },
  BAL: { record: "5-2", ppg: 27.0, papg: 20.9, ypg: 372, ypgAllow: 330, offEpa: .10, defEpa: -.06, thirdDownPct: 45.3, redZonePct: 62.0, toMargin: 4 },
  DET: { record: "6-1", ppg: 30.2, papg: 19.9, ypg: 398, ypgAllow: 321, offEpa: .16, defEpa: -.08, thirdDownPct: 48.2, redZonePct: 68.5, toMargin: 6 },
};

function genTeamDetail(code) {
  const base = INITIAL_TEAM_STATS[code];
  const rng = mulberry32(hashStr(code + "-detail"));
  const off = base.offEpa, def = base.defEpa;
  return {
    passing: {
      cpoe: off * 40 + (rng() - 0.5) * 4 + 2, epaDropback: off + (rng() - 0.5) * 0.05, timeToThrow: 2.6 + rng() * 0.5,
      deepBallPct: 10 + rng() * 8, pressureToSackPct: 18 + rng() * 10, toWorthyPct: 3 + rng() * 3,
    },
    rushing: {
      ryoe: off * 3 + (rng() - 0.5) * 0.5, explosiveRunPct: 8 + rng() * 6, successRate: 42 + rng() * 10,
      ypc: 4.0 + rng() * 1.2, brokenTacklePct: 10 + rng() * 8, stuffPct: Math.max(8, 16 - off * 10 + rng() * 4),
    },
    receiving: { yprr: 1.6 + rng() * 1.0, separation: 2.8 + rng() * 1.0, cROE: -3 + rng() * 8, dropPct: 3 + rng() * 4, yacPerRec: 4.5 + rng() * 3 },
    defense: {
      pressureRate: 28 - def * 40 + rng() * 6, sackRate: 6 - def * 20 + rng() * 2, missedTacklePct: Math.max(6, 10 + def * 40 + rng() * 5),
      havocRate: 12 - def * 20 + rng() * 3, ptsPerDriveAllowed: 1.6 + def * 4 + rng() * 0.3,
      coverageGrade: Math.min(99, Math.max(30, 60 - def * 100 + rng() * 10)),
      passEpaAllowed: def + (rng() - 0.5) * 0.04, rushEpaAllowed: def * 0.7 + (rng() - 0.5) * 0.04,
    },
    situational: { fourthDownPct: 50 + rng() * 20, timeOfPossession: 28 + rng() * 4, playsPerDrive: 5.5 + rng() * 1.2, penaltiesPerGm: 5 + rng() * 3, secPerPlay: 24 + rng() * 6 },
  };
}
const INITIAL_TEAM_DETAIL = Object.fromEntries(NFL_OPPONENTS.map((c) => [c, genTeamDetail(c)]));

function genInjuryReport(code) {
  const rng = mulberry32(hashStr(code + "-inj"));
  const qbStatus = rng() < 0.75 ? "Healthy" : rng() < 0.5 ? "Questionable" : "Out";
  const oLineHealth = Math.round(65 + rng() * 30);
  const secondaryDepth = Math.round(50 + rng() * 40);
  const posPool = ["WR", "CB", "LB", "OT", "S", "TE", "RB"];
  const n = Math.floor(rng() * 3);
  const keyInjuries = [];
  for (let i = 0; i < n; i++) keyInjuries.push({ pos: posPool[Math.floor(rng() * posPool.length)], status: rng() < 0.5 ? "Questionable" : "Out" });
  return { qbStatus, oLineHealth, secondaryDepth, keyInjuries };
}
const INITIAL_TEAM_INJURIES = Object.fromEntries(NFL_OPPONENTS.map((c) => [c, genInjuryReport(c)]));

function genH2H(a, b) {
  const rng = mulberry32(hashStr(a + b));
  const meetings = 3 + Math.floor(rng() * 6);
  const aWins = Math.floor(rng() * (meetings + 1));
  return { meetings, aWins, bWins: meetings - aWins, avgCombinedPts: Math.round((38 + rng() * 20) * 10) / 10, avgMarginA: Math.round(((rng() - 0.5) * 14) * 10) / 10 };
}

function genTeamRecentLog(code) {
  const rng = mulberry32(hashStr(code + "-recent"));
  const base = INITIAL_TEAM_STATS[code];
  const log = [];
  for (let w = 1; w <= 6; w++) {
    const ptsFor = Math.max(0, Math.round(base.ppg + (rng() - 0.5) * 14));
    const ptsAgainst = Math.max(0, Math.round(base.papg + (rng() - 0.5) * 14));
    const ydsFor = Math.round(base.ypg + (rng() - 0.5) * 100);
    const ydsAgainst = Math.round(base.ypgAllow + (rng() - 0.5) * 100);
    const offEpa = base.offEpa + (rng() - 0.5) * 0.15;
    const defEpa = base.defEpa + (rng() - 0.5) * 0.1;
    log.push({ week: w, opp: opp(rng), ptsFor, ptsAgainst, ydsFor, ydsAgainst, offEpa, defEpa, result: ptsFor >= ptsAgainst ? "W" : "L" });
  }
  return log.reverse();
}
const INITIAL_TEAM_RECENT = Object.fromEntries(NFL_OPPONENTS.map((c) => [c, genTeamRecentLog(c)]));

function computeRecentSummary(teamRecent, code, n) {
  const log = (teamRecent[code] || []).slice(0, n);
  if (!log.length) return { ppg: 0, papg: 0, ypg: 0, ypgAllow: 0, offEpa: 0, defEpa: 0, wins: 0, losses: 0 };
  const avg = (key) => log.reduce((s, g) => s + g[key], 0) / log.length;
  return {
    ppg: avg("ptsFor"), papg: avg("ptsAgainst"), ypg: Math.round(avg("ydsFor")), ypgAllow: Math.round(avg("ydsAgainst")),
    offEpa: avg("offEpa"), defEpa: avg("defEpa"),
    wins: log.filter((g) => g.result === "W").length, losses: log.filter((g) => g.result === "L").length,
  };
}

const INITIAL_WEEK = 8;
const INITIAL_SCHEDULE = [
  { away: "KC", home: "DAL", kickoff: "SUN 4:25 PM ET", weather: { temp: 71, wind: 6, precip: "0%" }, surface: "Grass", roof: "Outdoor", awayRestDays: 7, homeRestDays: 7, awayTravelMiles: 452, divisional: false },
  { away: "PHI", home: "SF", kickoff: "SUN 4:05 PM ET", weather: { temp: 64, wind: 11, precip: "10%" }, surface: "Grass", roof: "Outdoor", awayRestDays: 7, homeRestDays: 10, awayTravelMiles: 2148, divisional: false },
  { away: "BUF", home: "MIA", kickoff: "SUN 1:00 PM ET", weather: { temp: 82, wind: 9, precip: "20%" }, surface: "Grass", roof: "Outdoor", awayRestDays: 7, homeRestDays: 7, awayTravelMiles: 1276, divisional: true },
  { away: "GB", home: "SEA", kickoff: "SUN 1:00 PM ET", weather: { temp: 58, wind: 4, precip: "40%" }, surface: "Turf", roof: "Outdoor", awayRestDays: 7, homeRestDays: 7, awayTravelMiles: 1866, divisional: false },
  { away: "BAL", home: "DET", kickoff: "MON 8:15 PM ET", weather: { temp: 70, wind: 0, precip: "0%" }, surface: "Turf", roof: "Dome", awayRestDays: 6, homeRestDays: 10, awayTravelMiles: 528, divisional: false },
];

const INITIAL_REFEREES = [
  { name: "Kevin Marsh", gamesCalled: 112, flagsPerGameIdx: 108, homeAdvAdj: -0.6, overPct: 44 },
  { name: "Denise Okafor", gamesCalled: 96, flagsPerGameIdx: 93, homeAdvAdj: 1.1, overPct: 57 },
  { name: "Roland Petit", gamesCalled: 128, flagsPerGameIdx: 101, homeAdvAdj: 0.2, overPct: 50 },
  { name: "Ayesha Kahn", gamesCalled: 84, flagsPerGameIdx: 116, homeAdvAdj: -1.3, overPct: 39 },
];

// ================= Data context — everything below reads from here, not the constants above =================
const DataContext = createContext(null);
function useData() { return useContext(DataContext); }

// ================= Shared small components =================
function MiniTable({ columns, rows }) {
  return (
    <table className="w-full text-xs" style={{ fontFamily: FONT_MONO }}>
      <thead>
        <tr style={{ borderBottom: `1px solid ${T.turf}` }}>
          {columns.map((c) => <th key={c.key} className="text-left px-3 py-2" style={{ color: T.steel, fontWeight: 500 }}>{c.label}</th>)}
        </tr>
      </thead>
      <tbody>
        {rows.map((r, i) => (
          <tr key={i} style={{ borderBottom: `1px solid ${T.turf}` }}>
            {columns.map((c) => <td key={c.key} className="px-3 py-2" style={{ color: T.chalk }}>{c.fmt ? c.fmt(r[c.key]) : r[c.key]}</td>)}
          </tr>
        ))}
      </tbody>
    </table>
  );
}

function TeamStatLine({ code, onSelect }) {
  const { teamStats } = useData();
  const s = teamStats[code];
  return (
    <div onClick={() => onSelect(code)} className="cursor-pointer flex-1 min-w-0">
      <div className="text-lg truncate" style={{ fontFamily: FONT_DISPLAY, fontWeight: 600, color: T.chalk }}>
        {TEAM_NAMES[code] || code} <span className="text-xs" style={{ color: T.steel, fontWeight: 400 }}>({code})</span>
      </div>
      {s ? (
        <>
          <div className="mt-1 text-xs" style={{ color: T.steel, fontFamily: FONT_MONO }}>{s.record}</div>
          <div className="mt-1.5 text-xs flex gap-3 flex-wrap" style={{ fontFamily: FONT_MONO, color: T.brass }}>
            <span>{f1(s.ppg)} PPG</span>
            <span>{s.ypg} YPG</span>
            <span>{f2(s.offEpa)} EPA/Play</span>
          </div>
        </>
      ) : <div className="mt-1.5 text-xs" style={{ color: T.steel }}>No team stats loaded</div>}
    </div>
  );
}

// ---------- Category comparison tables ----------
function getPath(obj, path) { return path.split(".").reduce((o, k) => (o == null ? o : o[k]), obj); }

const CATEGORY_ROWS = {
  Overview: [
    { label: "Record", path: "record" }, { label: "PPG", path: "ppg", fmt: f1 }, { label: "PAPG", path: "papg", fmt: f1 },
    { label: "YPG", path: "ypg" }, { label: "YPG Allowed", path: "ypgAllow" }, { label: "Off EPA/Play", path: "offEpa", fmt: f2 },
    { label: "Def EPA/Play", path: "defEpa", fmt: f2 }, { label: "TO Margin", path: "toMargin", fmt: (v) => fSign(v, 0) },
  ],
  Passing: [
    { label: "CPOE", path: "passing.cpoe", fmt: (v) => fSign(v) }, { label: "EPA/Dropback", path: "passing.epaDropback", fmt: f2 },
    { label: "Time to Throw", path: "passing.timeToThrow", fmt: (v) => (typeof v === "number" ? f2(v) + "s" : "—") }, { label: "Deep Ball %", path: "passing.deepBallPct", fmt: f1 },
    { label: "Pressure-to-Sack %", path: "passing.pressureToSackPct", fmt: f1 }, { label: "TO-Worthy Play %", path: "passing.toWorthyPct", fmt: f1 },
  ],
  Rushing: [
    { label: "Rush Yds Over Exp", path: "rushing.ryoe", fmt: (v) => fSign(v, 2) }, { label: "Explosive Run %", path: "rushing.explosiveRunPct", fmt: f1 },
    { label: "Success Rate", path: "rushing.successRate", fmt: f1 }, { label: "YPC", path: "rushing.ypc", fmt: f1 },
    { label: "Broken Tackle %", path: "rushing.brokenTacklePct", fmt: f1 }, { label: "Stuff Rate", path: "rushing.stuffPct", fmt: f1 },
  ],
  Receiving: [
    { label: "Yds/Route Run", path: "receiving.yprr", fmt: f2 }, { label: "Avg Separation", path: "receiving.separation", fmt: f1 },
    { label: "Catch Rate Over Exp", path: "receiving.cROE", fmt: (v) => fSign(v) }, { label: "Drop %", path: "receiving.dropPct", fmt: f1 },
    { label: "YAC/Reception", path: "receiving.yacPerRec", fmt: f1 },
  ],
  Defense: [
    { label: "Pressure Rate", path: "defense.pressureRate", fmt: f1 }, { label: "Sack Rate", path: "defense.sackRate", fmt: f1 },
    { label: "Missed Tackle %", path: "defense.missedTacklePct", fmt: f1 }, { label: "Havoc Rate", path: "defense.havocRate", fmt: f1 },
    { label: "Pts/Drive Allowed", path: "defense.ptsPerDriveAllowed", fmt: f2 }, { label: "Coverage Grade", path: "defense.coverageGrade", fmt: f1 },
  ],
  Situational: [
    { label: "3rd Down %", path: "thirdDownPct", fmt: f1 }, { label: "4th Down %", path: "situational.fourthDownPct", fmt: f1 },
    { label: "Red Zone TD %", path: "redZonePct", fmt: f1 }, { label: "Time of Possession", path: "situational.timeOfPossession", fmt: (v) => (typeof v === "number" ? f1(v) + " min" : "—") },
    { label: "Plays/Drive", path: "situational.playsPerDrive", fmt: f1 }, { label: "Penalties/Gm", path: "situational.penaltiesPerGm", fmt: f1 },
    { label: "Sec/Play (Pace)", path: "situational.secPerPlay", fmt: f1 },
  ],
};

function CategoryCompareTable({ codes, rows, teamStats, teamDetail }) {
  function teamValue(code, path) {
    return path.includes(".") ? getPath(teamDetail[code], path) : teamStats[code]?.[path];
  }
  return (
    <table className="w-full text-xs" style={{ fontFamily: FONT_MONO }}>
      <thead>
        <tr style={{ borderBottom: `1px solid ${T.turf}` }}>
          <th className="text-left px-3 py-2" style={{ color: T.steel, fontWeight: 500 }}>Stat</th>
          {codes.map((c) => <th key={c} className="text-left px-3 py-2" style={{ color: T.brass, fontWeight: 600, fontFamily: FONT_DISPLAY }}>{TEAM_NAMES[c] || c}</th>)}
        </tr>
      </thead>
      <tbody>
        {rows.map((r) => (
          <tr key={r.label} style={{ borderBottom: `1px solid ${T.turf}` }}>
            <td className="px-3 py-2" style={{ color: T.steel }}>{r.label}</td>
            {codes.map((c) => {
              const v = teamValue(c, r.path);
              return <td key={c} className="px-3 py-2" style={{ color: T.chalk }}>{r.fmt ? r.fmt(v) : v}</td>;
            })}
          </tr>
        ))}
      </tbody>
    </table>
  );
}

function FullTeamStats({ codes }) {
  const { teamStats, teamDetail } = useData();
  return (
    <div className="space-y-5">
      {Object.entries(CATEGORY_ROWS).map(([cat, rows]) => (
        <div key={cat}>
          <div className="text-[11px] uppercase tracking-widest mb-1.5" style={{ color: T.steel }}>{cat}</div>
          <CategoryCompareTable codes={codes} rows={rows} teamStats={teamStats} teamDetail={teamDetail} />
        </div>
      ))}
    </div>
  );
}

function InjuryReport({ codes }) {
  const { teamInjuries } = useData();
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
      {codes.map((code) => {
        const inj = teamInjuries[code] || { qbStatus: "Unknown", oLineHealth: 0, secondaryDepth: 0, keyInjuries: [] };
        return (
          <div key={code}>
            <div className="text-sm mb-1.5" style={{ fontFamily: FONT_DISPLAY, fontWeight: 600, color: T.chalk }}>{TEAM_NAMES[code] || code}</div>
            <div className="text-xs space-y-1" style={{ fontFamily: FONT_MONO, color: T.steel }}>
              <div>QB Status: <span style={{ color: inj.qbStatus === "Healthy" ? T.brass : T.clay }}>{inj.qbStatus}</span></div>
              <div>O-Line Health Idx: <span style={{ color: T.chalk }}>{inj.oLineHealth}</span></div>
              <div>Secondary Depth Idx: <span style={{ color: T.chalk }}>{inj.secondaryDepth}</span></div>
              {inj.keyInjuries.length > 0 ? (
                <div>Key Injuries: {inj.keyInjuries.map((k, i) => (
                  <span key={i} style={{ color: T.clay }}>{k.pos} ({k.status}){i < inj.keyInjuries.length - 1 ? ", " : ""}</span>
                ))}</div>
              ) : <div>Key Injuries: <span style={{ color: T.brass }}>None reported</span></div>}
            </div>
          </div>
        );
      })}
    </div>
  );
}

function MatchupEdgePanel({ away, home }) {
  const { teamDetail } = useData();
  const a = teamDetail[away], h = teamDetail[home];
  if (!a || !h) return <div className="text-xs" style={{ color: T.steel }}>Not enough team data loaded for this matchup yet.</div>;
  const passEdgeAway = a.passing.epaDropback - h.defense.passEpaAllowed;
  const passEdgeHome = h.passing.epaDropback - a.defense.passEpaAllowed;
  const rushEdgeAway = a.rushing.ryoe / 5 - h.defense.rushEpaAllowed;
  const rushEdgeHome = h.rushing.ryoe / 5 - a.defense.rushEpaAllowed;
  const paceMismatch = a.situational.secPerPlay - h.situational.secPerPlay;
  const rows = [
    { label: `Pass Edge (${away})`, val: fSign(passEdgeAway, 2) },
    { label: `Pass Edge (${home})`, val: fSign(passEdgeHome, 2) },
    { label: `Rush Edge (${away})`, val: fSign(rushEdgeAway, 2) },
    { label: `Rush Edge (${home})`, val: fSign(rushEdgeHome, 2) },
    { label: "Pace Mismatch (sec/play diff)", val: fSign(paceMismatch, 1) },
  ];
  return (
    <div className="text-xs space-y-1.5" style={{ fontFamily: FONT_MONO }}>
      {rows.map((r) => (
        <div key={r.label} className="flex justify-between max-w-sm">
          <span style={{ color: T.steel }}>{r.label}</span>
          <span style={{ color: T.brass, fontWeight: 500 }}>{r.val}</span>
        </div>
      ))}
      <div className="text-[11px] pt-1" style={{ color: T.steel }}>Positive = advantage to that team's unit.</div>
    </div>
  );
}

function EnvironmentPanel({ game }) {
  return (
    <div className="text-xs space-y-1.5" style={{ fontFamily: FONT_MONO, color: T.steel }}>
      <div>Weather: <span style={{ color: T.chalk }}>
        {game.weather && game.weather.temp != null ? `${game.weather.temp}°F, ${game.weather.wind} mph wind, ${game.weather.precip} precip` : "Forecast not available"}
      </span></div>
      <div>Surface: <span style={{ color: T.chalk }}>{game.surface || "Unknown"}</span> · Roof: <span style={{ color: T.chalk }}>{game.roof || "Unknown"}</span></div>
      <div>Rest: <span style={{ color: T.chalk }}>{game.away} {game.awayRestDays ?? "—"}d / {game.home} {game.homeRestDays ?? "—"}d</span></div>
      <div>{game.away} Travel: <span style={{ color: T.chalk }}>{game.awayTravelMiles != null ? `${game.awayTravelMiles} mi` : "—"}</span></div>
      <div>Divisional Game: <span style={{ color: game.divisional ? T.brass : T.steel }}>{game.divisional ? "Yes" : "No"}</span></div>
    </div>
  );
}

function PlayerPropsList({ code }) {
  const { offense } = useData();
  const [level, setLevel] = useState("L4");
  const n = Number(level.slice(1));
  const players = offense
    .filter((p) => p.team === code)
    .map((p) => {
      const recent = p.gameLog ? p.gameLog.slice(0, n) : [];
      const avgYds = recent.length ? Math.round(recent.reduce((s, g) => s + g.yds, 0) / recent.length) : null;
      const avgTd = recent.length ? recent.reduce((s, g) => s + g.td, 0) / recent.length : null;
      return { ...p, avgYds, avgTd };
    })
    .sort((a, b) => POS_ORDER.indexOf(a.pos) - POS_ORDER.indexOf(b.pos));
  if (!players.length) return <div className="text-xs" style={{ color: T.steel }}>No player prop data available for this team yet.</div>;
  return (
    <div>
      <div className="flex gap-1.5 mb-3">
        {["L2", "L4", "L6"].map((l) => (
          <button key={l} onClick={() => setLevel(l)} className="px-2.5 py-1 rounded-sm text-xs"
            style={{ background: l === level ? T.brass : T.turf, color: l === level ? T.field : T.steel, fontFamily: FONT_DISPLAY, fontWeight: 500 }}>
            {l.replace("L", "Last ")}
          </button>
        ))}
      </div>
      <MiniTable
        columns={[
          { key: "name", label: "Player" }, { key: "pos", label: "Pos" }, { key: "yds", label: "Season YDS" },
          { key: "td", label: "Season TD" }, { key: "avgYds", label: `${level} Avg YDS`, fmt: (v) => (v == null ? "—" : v) },
          { key: "avgTd", label: `${level} Avg TD`, fmt: (v) => (v == null ? "—" : v.toFixed(1)) },
        ]}
        rows={players}
      />
    </div>
  );
}

function H2HPanel({ away, home, real }) {
  const h = real || genH2H(away, home);
  return (
    <div className="text-xs" style={{ fontFamily: FONT_MONO, color: T.chalk }}>
      <div className="mb-1">
        Last {h.meetings} meetings: <span style={{ color: T.brass }}>{TEAM_NAMES[away]} {h.aWins}–{h.bWins} {TEAM_NAMES[home]}</span>
      </div>
      <div className="flex gap-4 flex-wrap" style={{ color: T.steel }}>
        <span>Avg combined pts: <span style={{ color: T.brass }}>{h.avgCombinedPts}</span></span>
        <span>Avg margin ({away}): <span style={{ color: h.avgMarginA >= 0 ? T.brass : T.clay }}>{h.avgMarginA > 0 ? "+" : ""}{h.avgMarginA}</span></span>
      </div>
      {!real && <div className="text-[11px] mt-1" style={{ color: T.steel }}>Demo data — connect live data for real head-to-head history.</div>}
    </div>
  );
}

const RECENT_ROWS = [
  { label: "Record (window)", get: (s) => `${s.wins}-${s.losses}` },
  { label: "PPG", get: (s) => f1(s.ppg) },
  { label: "PAPG", get: (s) => f1(s.papg) },
  { label: "YPG", get: (s) => s.ypg },
  { label: "YPG Allowed", get: (s) => s.ypgAllow },
  { label: "Off EPA/Play", get: (s) => f2(s.offEpa) },
  { label: "Def EPA/Play", get: (s) => f2(s.defEpa) },
];

function resultColor(result) { return result === "W" ? T.brass : T.clay; }

function RecentFormPanel({ codes }) {
  const { teamRecent } = useData();
  const [level, setLevel] = useState("L4");
  const n = Number(level.slice(1));
  const summaries = Object.fromEntries(codes.map((c) => [c, computeRecentSummary(teamRecent, c, n)]));
  return (
    <div>
      <div className="flex gap-1.5 mb-4">
        {["L2", "L4", "L6"].map((l) => (
          <button key={l} onClick={() => setLevel(l)} className="px-2.5 py-1 rounded-sm text-xs"
            style={{ background: l === level ? T.brass : T.turf, color: l === level ? T.field : T.steel, fontFamily: FONT_DISPLAY, fontWeight: 500 }}>
            {l.replace("L", "Last ")}
          </button>
        ))}
      </div>
      <table className="w-full text-xs" style={{ fontFamily: FONT_MONO }}>
        <thead>
          <tr style={{ borderBottom: `1px solid ${T.turf}` }}>
            <th className="text-left px-3 py-2" style={{ color: T.steel, fontWeight: 500 }}>Stat</th>
            {codes.map((c) => <th key={c} className="text-left px-3 py-2" style={{ color: T.brass, fontWeight: 600, fontFamily: FONT_DISPLAY }}>{TEAM_NAMES[c] || c}</th>)}
          </tr>
        </thead>
        <tbody>
          {RECENT_ROWS.map((r) => (
            <tr key={r.label} style={{ borderBottom: `1px solid ${T.turf}` }}>
              <td className="px-3 py-2" style={{ color: T.steel }}>{r.label}</td>
              {codes.map((c) => <td key={c} className="px-3 py-2" style={{ color: T.chalk }}>{r.get(summaries[c])}</td>)}
            </tr>
          ))}
        </tbody>
      </table>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-5">
        {codes.map((code) => (
          <div key={code}>
            <div className="text-xs mb-1.5" style={{ fontFamily: FONT_DISPLAY, fontWeight: 600, color: T.chalk }}>{TEAM_NAMES[code] || code} Game Log</div>
            <table className="w-full text-xs" style={{ fontFamily: FONT_MONO }}>
              <thead>
                <tr style={{ borderBottom: `1px solid ${T.turf}` }}>
                  {["Wk", "Opp", "PF", "PA", "Res"].map((h) => <th key={h} className="text-left px-3 py-2" style={{ color: T.steel, fontWeight: 500 }}>{h}</th>)}
                </tr>
              </thead>
              <tbody>
                {(teamRecent[code] || []).slice(0, n).map((g, i) => (
                  <tr key={i} style={{ borderBottom: `1px solid ${T.turf}` }}>
                    <td className="px-3 py-2" style={{ color: T.chalk }}>{g.week}</td>
                    <td className="px-3 py-2" style={{ color: T.chalk }}>{g.opp}</td>
                    <td className="px-3 py-2" style={{ color: T.chalk }}>{g.ptsFor}</td>
                    <td className="px-3 py-2" style={{ color: T.chalk }}>{g.ptsAgainst}</td>
                    <td className="px-3 py-2 font-semibold" style={{ color: resultColor(g.result) }}>{g.result}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ))}
      </div>
    </div>
  );
}

function Panel({ title, children }) {
  return (
    <div className="rounded-sm p-5" style={{ background: T.panel }}>
      <div className="text-xs uppercase tracking-widest mb-3" style={{ color: T.steel }}>{title}</div>
      {children}
    </div>
  );
}

// ================= Pages =================
function SchedulePage({ onSelectTeam, onPreviewGame }) {
  const { schedule, week } = useData();
  return (
    <section className="px-6 py-6">
      <h3 className="text-xs uppercase tracking-widest mb-3" style={{ color: T.steel }}>Week {week} Schedule</h3>
      <div className="space-y-3">
        {schedule.map((g, i) => (
          <div key={i} className="rounded-sm p-4" style={{ background: T.panel }}>
            <div className="flex items-center justify-between text-xs mb-3" style={{ color: T.steel, fontFamily: FONT_MONO }}>
              <span>{g.away} @ {g.home}</span>
              <span>{g.kickoff}</span>
            </div>
            <div className="flex gap-6">
              <TeamStatLine code={g.away} onSelect={(code) => onSelectTeam(code, g.home)} />
              <div className="w-px" style={{ background: T.turf }} />
              <TeamStatLine code={g.home} onSelect={(code) => onSelectTeam(code, g.away)} />
            </div>
            <button
              onClick={() => onPreviewGame(g)}
              className="mt-3 text-xs px-3 py-1.5 rounded-sm font-medium"
              style={{ background: T.brass, color: T.field, fontFamily: FONT_DISPLAY, fontWeight: 500 }}
            >
              Preview Matchup
            </button>
          </div>
        ))}
      </div>
    </section>
  );
}

function TeamPage({ team, opponent, onBack }) {
  return (
    <>
      <div className="px-6 pt-5 flex items-center gap-3 flex-wrap">
        <button onClick={onBack} className="flex items-center gap-1 text-xs" style={{ color: T.steel }}><ArrowLeft size={13} /> Schedule</button>
        <h2 className="text-xl" style={{ fontFamily: FONT_DISPLAY, fontWeight: 600 }}>
          {TEAM_NAMES[team] || team} <span className="text-xs" style={{ color: T.steel, fontWeight: 400 }}>vs {TEAM_NAMES[opponent] || opponent} this week</span>
        </h2>
      </div>
      <section className="px-6 py-6 space-y-6">
        <Panel title={`Team Stats — ${team} vs ${opponent}`}><FullTeamStats codes={[team, opponent]} /></Panel>
        <Panel title="Recent Form"><RecentFormPanel codes={[team, opponent]} /></Panel>
        <Panel title="Injury / Personnel Report"><InjuryReport codes={[team, opponent]} /></Panel>
        <Panel title="Player Prop Watchlist"><PlayerPropsList code={team} /></Panel>
      </section>
    </>
  );
}

function GamePage({ game, onBack }) {
  const { away, home, kickoff, h2h } = game;
  return (
    <>
      <div className="px-6 pt-5 flex items-center gap-3 flex-wrap">
        <button onClick={onBack} className="flex items-center gap-1 text-xs" style={{ color: T.steel }}><ArrowLeft size={13} /> Schedule</button>
        <h2 className="text-xl" style={{ fontFamily: FONT_DISPLAY, fontWeight: 600 }}>{TEAM_NAMES[away] || away} @ {TEAM_NAMES[home] || home}</h2>
        <span className="text-xs" style={{ color: T.steel }}>{kickoff}</span>
      </div>
      <section className="px-6 py-6 space-y-6">
        <Panel title="Head-to-Head"><H2HPanel away={away} home={home} real={h2h} /></Panel>
        <Panel title="Game Environment"><EnvironmentPanel game={game} /></Panel>
        <Panel title="Matchup Edge"><MatchupEdgePanel away={away} home={home} /></Panel>
        <Panel title="Team Stats"><FullTeamStats codes={[away, home]} /></Panel>
        <Panel title="Recent Form"><RecentFormPanel codes={[away, home]} /></Panel>
        <Panel title="Injury / Personnel Report"><InjuryReport codes={[away, home]} /></Panel>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Panel title={`${TEAM_NAMES[away] || away} Player Props`}><PlayerPropsList code={away} /></Panel>
          <Panel title={`${TEAM_NAMES[home] || home} Player Props`}><PlayerPropsList code={home} /></Panel>
        </div>
      </section>
    </>
  );
}

function RefereePage() {
  const { referees } = useData();
  return (
    <section className="px-6 py-6">
      <Panel title="Referee Tendencies">
        <MiniTable
          columns={[
            { key: "name", label: "Referee" }, { key: "gamesCalled", label: "Games" },
            { key: "flagsPerGameIdx", label: "Flags Idx (100=avg)" },
            { key: "homeAdvAdj", label: "Home Adv Adj", fmt: (v) => fSign(v) },
            { key: "overPct", label: "Over %" },
          ]}
          rows={referees}
        />
      </Panel>
    </section>
  );
}

// ================= App =================
function initialData() {
  return {
    teamStats: INITIAL_TEAM_STATS, teamDetail: INITIAL_TEAM_DETAIL, teamInjuries: INITIAL_TEAM_INJURIES,
    teamRecent: INITIAL_TEAM_RECENT, schedule: INITIAL_SCHEDULE, offense: INITIAL_OFFENSE, referees: INITIAL_REFEREES, week: INITIAL_WEEK,
  };
}

export default function NFLDashboard() {
  const [view, setView] = useState("schedule"); // schedule | team | game | referees
  const [selectedTeam, setSelectedTeam] = useState(null);
  const [selectedOpponent, setSelectedOpponent] = useState(null);
  const [selectedGame, setSelectedGame] = useState(null);
  const [data, setData] = useState(initialData);
  const [liveStatus, setLiveStatus] = useState("loading"); // loading | live | failed
  const [lastUpdated, setLastUpdated] = useState(null);

  async function loadLiveData() {
    setLiveStatus("loading");
    try {
      const res = await fetch(`${LIVE_DATA_URL}?t=${Date.now()}`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const live = await res.json();
      setData((prev) => ({
        teamStats: live.teamStats && Object.keys(live.teamStats).length ? live.teamStats : prev.teamStats,
        teamDetail: live.teamDetail && Object.keys(live.teamDetail).length ? live.teamDetail : prev.teamDetail,
        teamInjuries: live.teamInjuries && Object.keys(live.teamInjuries).length ? live.teamInjuries : prev.teamInjuries,
        teamRecent: live.teamRecent && Object.keys(live.teamRecent).length ? live.teamRecent : prev.teamRecent,
        schedule: Array.isArray(live.schedule) && live.schedule.length ? live.schedule : prev.schedule,
        offense: Array.isArray(live.offense) && live.offense.length ? live.offense : prev.offense,
        referees: Array.isArray(live.referees) && live.referees.length ? live.referees : prev.referees,
        week: live.week ?? prev.week,
      }));
      setLiveStatus("live");
      setLastUpdated(new Date());
    } catch (err) {
      console.warn("Live NFL data fetch failed, staying on demo data:", err);
      setLiveStatus("failed");
    }
  }

  useEffect(() => {
    loadLiveData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const navSection = view === "referees" ? "referees" : "schedule";

  function selectTeam(code, opponent) { setSelectedTeam(code); setSelectedOpponent(opponent); setView("team"); }
  function previewGame(game) { setSelectedGame(game); setView("game"); }

  return (
    <DataContext.Provider value={data}>
      <div className="min-h-screen w-full" style={{ background: T.field, color: T.chalk, fontFamily: "'Inter', sans-serif" }}>
        <style>{`@import url('https://fonts.googleapis.com/css2?family=Oswald:wght@500;600;700&family=Inter:wght@400;500;600&family=IBM+Plex+Mono:wght@400;500&display=swap');`}</style>

        <header className="border-b px-6 py-5 flex items-center justify-between flex-wrap gap-3" style={{ borderColor: T.turf }}>
          <div>
            <h1 className="text-2xl tracking-tight" style={{ fontFamily: FONT_DISPLAY, fontWeight: 600 }}>
              GRIDIRON<span style={{ color: T.brass }}>REPORT</span>
            </h1>
            <p className="text-xs mt-0.5" style={{ color: T.steel }}>Team stats, matchups, injuries &amp; player props</p>
            <p className="text-[11px] mt-1" style={{ color: liveStatus === "live" ? T.brass : liveStatus === "failed" ? T.clay : T.steel }}>
              {liveStatus === "loading" && "Loading live data…"}
              {liveStatus === "live" && `Live data as of ${lastUpdated ? lastUpdated.toLocaleString() : ""}`}
              {liveStatus === "failed" && "Live data unavailable — showing demo data"}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={loadLiveData} className="text-xs px-3 py-2 rounded-sm border" style={{ borderColor: T.turf, color: T.steel }}>
              Refresh
            </button>
            <div className="flex rounded-sm overflow-hidden" style={{ border: `1px solid ${T.turf}` }}>
              {["schedule", "referees"].map((v) => (
                <button key={v} onClick={() => setView(v)} className="px-3 py-2 text-xs capitalize"
                  style={{ background: navSection === v ? T.brass : "transparent", color: navSection === v ? T.field : T.steel, fontFamily: FONT_DISPLAY, fontWeight: 500 }}>
                  {v}
                </button>
              ))}
            </div>
          </div>
        </header>

        {view === "schedule" && <SchedulePage onSelectTeam={selectTeam} onPreviewGame={previewGame} />}
        {view === "team" && <TeamPage team={selectedTeam} opponent={selectedOpponent} onBack={() => setView("schedule")} />}
        {view === "game" && <GamePage game={selectedGame} onBack={() => setView("schedule")} />}
        {view === "referees" && <RefereePage />}
      </div>
    </DataContext.Provider>
  );
}
