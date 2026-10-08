#!/usr/bin/env python3
"""
Redzone Labs - NBA data pull (sportsdataverse / ESPN bulk data).

Mirrors the NFL pull's output shape so the dashboard can share components:
  teamStats, teamRecent, schedule (with box + quarter linescores),
  players (per-game leaderboard), season, updated.

All data is free + keyless, loaded from the SportsDataverse GitHub data repos,
so it works from a GitHub Actions runner (no stats.nba.com IP blocking).
"""
import json
import re
import datetime
import warnings
warnings.filterwarnings("ignore")

_VAL_RE = re.compile(r"'value':\s*([0-9]+(?:\.[0-9]+)?)")

import pandas as pd
import numpy as np
from sportsdataverse import nba

# ---- NBA divisions (ESPN abbreviations) ----
DIVISION = {
    "BOS": ("East", "Atlantic"), "BKN": ("East", "Atlantic"), "NY": ("East", "Atlantic"),
    "PHI": ("East", "Atlantic"), "TOR": ("East", "Atlantic"),
    "CHI": ("East", "Central"), "CLE": ("East", "Central"), "DET": ("East", "Central"),
    "IND": ("East", "Central"), "MIL": ("East", "Central"),
    "ATL": ("East", "Southeast"), "CHA": ("East", "Southeast"), "MIA": ("East", "Southeast"),
    "ORL": ("East", "Southeast"), "WSH": ("East", "Southeast"),
    "DEN": ("West", "Northwest"), "MIN": ("West", "Northwest"), "OKC": ("West", "Northwest"),
    "POR": ("West", "Northwest"), "UTAH": ("West", "Northwest"),
    "GS": ("West", "Pacific"), "LAC": ("West", "Pacific"), "LAL": ("West", "Pacific"),
    "PHX": ("West", "Pacific"), "SAC": ("West", "Pacific"),
    "DAL": ("West", "Southwest"), "HOU": ("West", "Southwest"), "MEM": ("West", "Southwest"),
    "NO": ("West", "Southwest"), "SA": ("West", "Southwest"),
}


def pdf(x):
    import polars as pl
    return x.to_pandas() if isinstance(x, pl.DataFrame) else x


def pick_season():
    """Latest season that has completed regular-season games; else latest with any schedule."""
    now = datetime.date.today()
    # NBA season label = ending year. Season starting in Oct of year Y -> label Y+1.
    guess = now.year + 1 if now.month >= 9 else now.year
    for s in (guess, guess - 1):
        try:
            sch = pdf(nba.load_nba_schedule(seasons=[s]))
            if len(sch) and (sch["status_type_completed"] == True).any():
                return s, sch
        except Exception:
            continue
    # fall back to last known good
    s = guess - 1
    return s, pdf(nba.load_nba_schedule(seasons=[s]))


def f1(x):
    return round(float(x), 1) if x is not None and not pd.isna(x) else None


def pct(made, att):
    m, a = float(made), float(att)
    return round(100.0 * m / a, 1) if a else None


def build_team_meta(tb):
    meta = {}
    for team, g in tb.groupby("team_abbreviation"):
        r = g.iloc[-1]
        meta[team] = {
            "name": r.get("team_name") or r.get("team_display_name"),
            "city": r.get("team_location"),
            "color": "#" + str(r.get("team_color")).lstrip("#") if r.get("team_color") and not pd.isna(r.get("team_color")) else "#555",
            "logo": r.get("team_logo"),
        }
    return meta


def build_team_stats(tb):
    """Season team overview from per-game team box (regular season)."""
    out = {}
    for team, g in tb.groupby("team_abbreviation"):
        gp = len(g)
        if not gp:
            continue
        wins = int((g["team_winner"] == True).sum())
        losses = gp - wins
        ppg = f1(g["team_score"].mean())
        papg = f1(g["opponent_team_score"].mean())
        out[team] = {
            "record": f"{wins}-{losses}",
            "gp": gp, "ppg": ppg, "papg": papg,
            "diff": f1((ppg or 0) - (papg or 0)) if ppg is not None and papg is not None else None,
            "rpg": f1(g["total_rebounds"].mean()),
            "apg": f1(g["assists"].mean()),
            "spg": f1(g["steals"].mean()),
            "bpg": f1(g["blocks"].mean()),
            "topg": f1(g["total_turnovers"].mean()),
            "fgPct": f1(100 * g["field_goals_made"].sum() / g["field_goals_attempted"].sum()) if g["field_goals_attempted"].sum() else None,
            "fg3Pct": f1(100 * g["three_point_field_goals_made"].sum() / g["three_point_field_goals_attempted"].sum()) if g["three_point_field_goals_attempted"].sum() else None,
            "ftPct": f1(100 * g["free_throws_made"].sum() / g["free_throws_attempted"].sum()) if g["free_throws_attempted"].sum() else None,
        }
    return out


def build_team_recent(tb, n=10):
    """Last n games per team: opponent, home/away, score, result."""
    out = {}
    for team, g in tb.groupby("team_abbreviation"):
        g = g.sort_values("game_date", ascending=False).head(n)
        rows = []
        for _, r in g.iterrows():
            pf, pa = int(r["team_score"]), int(r["opponent_team_score"])
            rows.append({
                "opp": r["opponent_team_abbreviation"],
                "home": bool(r["team_home_away"] == "home"),
                "ptsFor": pf, "ptsAgainst": pa,
                "result": "W" if pf > pa else ("L" if pf < pa else "T"),
            })
        out[team] = rows
    return out


def _linescore(cell):
    """ESPN linescores (JSON string or array) -> list of per-quarter points."""
    try:
        if cell is None:
            return None
        if isinstance(cell, str):
            vals = [float(v) for v in _VAL_RE.findall(cell)]
        else:
            vals = [x.get("value") for x in list(cell) if x.get("value") is not None]
        vals = [int(round(float(v))) for v in vals if v is not None]
        return vals or None
    except Exception:
        return None


def _game_box_map(tb):
    """game_id -> per-side team box stats for the box-score view."""
    m = {}
    for gid, g in tb.groupby("game_id"):
        side = {}
        for _, r in g.iterrows():
            ha = "home" if r["team_home_away"] == "home" else "away"
            side[ha] = {
                "fgPct": pct(r["field_goals_made"], r["field_goals_attempted"]),
                "fg3Pct": pct(r["three_point_field_goals_made"], r["three_point_field_goals_attempted"]),
                "reb": int(r["total_rebounds"]) if not pd.isna(r["total_rebounds"]) else None,
                "ast": int(r["assists"]) if not pd.isna(r["assists"]) else None,
                "to": int(r["total_turnovers"]) if not pd.isna(r["total_turnovers"]) else None,
            }
        m[gid] = side
    return m


def build_schedule(sch, teams, boxmap):
    out = []
    sch = sch[sch["home_abbreviation"].isin(teams) & sch["away_abbreviation"].isin(teams)]
    for _, g in sch.iterrows():
        completed = bool(g.get("status_type_completed"))
        gid = g.get("id")
        row = {
            "away": g["away_abbreviation"], "home": g["home_abbreviation"],
            "date": str(g.get("date"))[:10],
            "venue": g.get("venue_full_name"),
            "final": completed,
        }
        if completed and not pd.isna(g.get("home_score")) and not pd.isna(g.get("away_score")):
            box = {
                "awayScore": int(g["away_score"]), "homeScore": int(g["home_score"]),
                "awayQ": _linescore(g.get("away_linescores")),
                "homeQ": _linescore(g.get("home_linescores")),
            }
            side = boxmap.get(gid) or boxmap.get(str(gid)) or {}
            if side.get("away"):
                box["awayStats"] = side["away"]
            if side.get("home"):
                box["homeStats"] = side["home"]
            row["box"] = box
        out.append(row)
    return out


def build_players(pb, teams, min_gp=3):
    """Per-game leaderboard: averages of the main stats + games played."""
    pb = pb.copy()
    # minutes can be string/float; coerce
    pb["min_num"] = pd.to_numeric(pb.get("minutes"), errors="coerce")
    played = pb[(pb.get("did_not_play") != True)]
    out = []
    for (aid, name), g in played.groupby(["athlete_id", "athlete_display_name"]):
        g = g[g["team_abbreviation"].isin(teams)]
        if not len(g):
            continue
        gp = int(g["game_id"].nunique())
        if gp < min_gp:
            continue
        team = g.sort_values("game_date")["team_abbreviation"].iloc[-1]
        pos = g["athlete_position_abbreviation"].dropna().iloc[-1] if g["athlete_position_abbreviation"].notna().any() else ""
        fga, fgm = g["field_goals_attempted"].sum(), g["field_goals_made"].sum()
        tpa, tpm = g["three_point_field_goals_attempted"].sum(), g["three_point_field_goals_made"].sum()
        fta, ftm = g["free_throws_attempted"].sum(), g["free_throws_made"].sum()
        pts = g["points"].sum()
        out.append({
            "name": name, "team": team, "pos": pos, "gp": gp,
            "mpg": f1(g["min_num"].mean()),
            "ppg": f1(g["points"].mean()),
            "rpg": f1(g["rebounds"].mean()),
            "apg": f1(g["assists"].mean()),
            "spg": f1(g["steals"].mean()),
            "bpg": f1(g["blocks"].mean()),
            "topg": f1(g["turnovers"].mean()),
            "fgPct": pct(fgm, fga),
            "fg3Pct": pct(tpm, tpa),
            "ftPct": pct(ftm, fta),
            "tsPct": round(100 * pts / (2 * (fga + 0.44 * fta)), 1) if (fga + 0.44 * fta) else None,
            "pts": int(pts), "reb": int(g["rebounds"].sum()), "ast": int(g["assists"].sum()),
        })
    return sorted(out, key=lambda p: -(p["ppg"] or 0))


def main():
    season, sch = pick_season()
    print(f"NBA season: {season}  (schedule rows {len(sch)})")

    tb = pdf(nba.load_nba_team_boxscore(seasons=[season]))
    pb = pdf(nba.load_nba_player_boxscore(seasons=[season]))
    # regular season only (season_type 2); fall back to all if column missing/empty
    if "season_type" in tb.columns and (tb["season_type"] == 2).any():
        tb = tb[tb["season_type"] == 2]
    if "season_type" in pb.columns and (pb["season_type"] == 2).any():
        pb = pb[pb["season_type"] == 2]

    teams = set(DIVISION.keys())
    tbt = tb[tb["team_abbreviation"].isin(teams)]
    team_stats = build_team_stats(tbt)
    team_meta = build_team_meta(tbt)
    team_recent = build_team_recent(tbt)
    boxmap = _game_box_map(tb)
    schedule = build_schedule(sch, teams, boxmap)
    players = build_players(pb, teams)
    print(f"teams {len(team_stats)} | games {len(schedule)} | players {len(players)}")

    out = {
        "sport": "nba",
        "season": season,
        "updated": datetime.datetime.utcnow().strftime("%Y-%m-%d"),
        "teamStats": team_stats,
        "teamMeta": team_meta,
        "teamRecent": team_recent,
        "schedule": schedule,
        "players": players,
    }
    with open("data/nba_data.json", "w") as f:
        json.dump(out, f, default=str)
    print("wrote nba_data.json")


if __name__ == "__main__":
    main()
