"""
Pull real NFL data with nfl_data_py and export a JSON file shaped for the
Gridiron Report dashboard's live-fetch (see web/src/App.jsx's LIVE_DATA_URL).

SETUP (run locally — this needs internet access to nflverse's data releases):
    pip install nfl_data_py pandas --upgrade

USAGE:
    Edit SEASON / WEEK / TEAMS below, then:
    python pull_nfl_data.py

OUTPUT:
    data/gridiron_report_data.json

WHAT'S REAL VS. APPROXIMATED VS. NOT AVAILABLE (read before trusting the numbers):
  - Team record, PPG, PAPG, YPG, YPG allowed: real, from nflverse schedules +
    play-by-play.
  - Off/Def EPA per play, 3rd/4th down %, turnover margin: real, computed
    from play-by-play (nflfastR-derived).
  - Red zone TD %: real, computed per-drive from play-by-play.
  - Passing CPOE, time to throw, intended air yards: real, from nflverse's
    Next Gen Stats export (import_ngs_data).
  - Rushing rush-yards-over-expected: real, from NGS rushing.
  - Receiving average separation, YAC over expectation: real, from NGS
    receiving.
  - Pressure rate / sack rate (defense): real-ish — computed from pbp's
    sack and qb_hit flags, which is the standard public proxy for pressure
    (not official PFF pressure grading, but directionally solid).
  - NOT AVAILABLE anywhere in public data: pressure-to-sack% and TO-worthy
    play% (subjective charting, PFF/ESPN proprietary), broken tackle %,
    drop %, yards/route run (needs route participation data nobody publishes
    for free), missed tackle %, coverage grade, havoc rate, points/drive
    allowed, time of possession, pace (sec/play). These come back as `null`
    in the JSON and the dashboard already renders "—" for those — expect a
    fair number of dashes in Rushing/Receiving/Defense/Situational until
    you wire in a paid data source (PFF, SIS, etc.) for those specific
    fields.
  - Injuries: real, from nflverse's official injury report data
    (import_injuries). QB status / O-line health / secondary depth indices
    are a simple formula built from real report_status values, not an
    official "health index" — treat as directional.
  - Schedule: real matchups, rest days, surface, and roof all come straight
    from nflverse schedules. Weather forecasts for UPCOMING games are NOT
    available here — nflverse only has historical temp/wind for completed
    games. Wire in a weather API (e.g. OpenWeather) if you want that live;
    left as null otherwise.
  - Travel miles: approximated via straight-line (haversine) distance
    between team home stadiums — real geography, but not actual flight
    distance.
  - Head-to-head history: real, computed from multi-season schedules.
  - Player props (season totals + weekly game log): real, from
    import_weekly_data. Covers QB/RB/WR/TE, top 7 by yards per team.
  - Referee tendencies: attempted via import_officials() joined to
    penalties (pbp) and results (schedules) — real if your nfl_data_py
    version has import_officials; if not, this section comes back empty
    and the dashboard falls back to its demo referee rows. This is
    observed-outcome data (flags/results in games they officiated), not
    betting-market data.
"""

import json
import math

import numpy as np
import pandas as pd
import nfl_data_py as nfl

# --- nflverse compatibility patch (added) ---------------------------------
# nfl_data_py 0.3.3 is deprecated and still requests weekly player stats from
# the old nflverse path (player_stats/player_stats_{year}.parquet), which now
# returns 404. nflverse moved this dataset to
# stats_player/stats_player_week_{year}.parquet and renamed two columns
# (recent_team -> team, interceptions -> passing_interceptions). This shim
# restores import_weekly_data from the new location and maps the columns back
# to the names this script expects. Works locally and in GitHub Actions.
_NFLVERSE_WEEKLY_URL = ('https://github.com/nflverse/nflverse-data/releases/download/'
                        'stats_player/stats_player_week_{0}.parquet')
def _import_weekly_data(years, columns=None, downcast=True):
    frames = [pd.read_parquet(_NFLVERSE_WEEKLY_URL.format(y)) for y in years]
    df = pd.concat(frames, ignore_index=True)
    df = df.rename(columns={'team': 'recent_team', 'passing_interceptions': 'interceptions'})
    if columns:
        df = df[columns]
    return df
nfl.import_weekly_data = _import_weekly_data
# --- end nflverse compatibility patch -------------------------------------

SEASON = 2025
WEEK = 8
TEAMS = ["DAL", "KC", "PHI", "SF", "BUF", "MIA", "GB", "SEA", "BAL", "DET"]
H2H_SEASONS = list(range(SEASON - 4, SEASON + 1))  # last 5 seasons for head-to-head history

# Approximate home-stadium coordinates for the teams above (for travel-distance math).
STADIUM_COORDS = {
    "DAL": (32.7473, -97.0945), "KC": (39.0489, -94.4839), "PHI": (39.9008, -75.1675),
    "SF": (37.4030, -121.9700), "BUF": (42.7738, -78.7870), "MIA": (25.9580, -80.2389),
    "GB": (44.5013, -88.0622), "SEA": (47.5952, -122.3316), "BAL": (39.2780, -76.6227),
    "DET": (42.3400, -83.0456),
}


def haversine_miles(a, b):
    if a is None or b is None:
        return None
    lat1, lon1, lat2, lon2 = map(math.radians, [a[0], a[1], b[0], b[1]])
    dlat, dlon = lat2 - lat1, lon2 - lon1
    h = math.sin(dlat / 2) ** 2 + math.cos(lat1) * math.cos(lat2) * math.sin(dlon / 2) ** 2
    return round(2 * 3958.8 * math.asin(math.sqrt(h)))


def safe_mean(series):
    return round(float(series.mean()), 4) if len(series) else 0


# ================= team-level stats =================
def team_record_scoring(team, schedules):
    games = schedules[((schedules.home_team == team) | (schedules.away_team == team)) & schedules.result.notna()]
    wins = losses = 0
    pf, pa = [], []
    for _, g in games.iterrows():
        if g.home_team == team:
            f, a = g.home_score, g.away_score
        else:
            f, a = g.away_score, g.home_score
        pf.append(f); pa.append(a)
        if f > a: wins += 1
        elif f < a: losses += 1
    return f"{wins}-{losses}", (round(sum(pf) / len(pf), 1) if pf else 0), (round(sum(pa) / len(pa), 1) if pa else 0)


def yards_per_game(team, pbp):
    off, defn = pbp[pbp.posteam == team], pbp[pbp.defteam == team]
    go, gd = off.game_id.nunique(), defn.game_id.nunique()
    return (round(off.yards_gained.sum() / go) if go else 0), (round(defn.yards_gained.sum() / gd) if gd else 0)


def epa_per_play(team, pbp):
    off = pbp[(pbp.posteam == team) & pbp.play_type.isin(["pass", "run"])]
    defn = pbp[(pbp.defteam == team) & pbp.play_type.isin(["pass", "run"])]
    return safe_mean(off.epa), safe_mean(defn.epa)


def third_down_pct(team, pbp):
    thirds = pbp[(pbp.posteam == team) & (pbp.down == 3)]
    if not len(thirds) or "third_down_converted" not in thirds:
        return 0
    return round(100 * thirds.third_down_converted.sum() / len(thirds), 1)


def fourth_down_pct(team, pbp):
    fourths = pbp[(pbp.posteam == team) & (pbp.down == 4)]
    if not len(fourths) or "fourth_down_converted" not in fourths:
        return 0
    return round(100 * fourths.fourth_down_converted.sum() / len(fourths), 1)


def red_zone_td_pct(team, pbp):
    rz = pbp[(pbp.posteam == team) & (pbp.yardline_100 <= 20) & pbp.play_type.isin(["pass", "run"])]
    if not len(rz):
        return 0
    td_by_drive = rz.groupby(["game_id", "drive"])["touchdown"].max()
    return round(100 * td_by_drive.mean(), 1) if len(td_by_drive) else 0


def turnover_margin(team, pbp):
    takeaways = len(pbp[(pbp.defteam == team) & ((pbp.interception == 1) | (pbp.fumble_lost == 1))])
    giveaways = len(pbp[(pbp.posteam == team) & ((pbp.interception == 1) | (pbp.fumble_lost == 1))])
    return takeaways - giveaways


def build_team_stats(team, schedules, pbp):
    record, ppg, papg = team_record_scoring(team, schedules)
    ypg, ypg_allow = yards_per_game(team, pbp)
    off_epa, def_epa = epa_per_play(team, pbp)
    return {
        "record": record, "ppg": ppg, "papg": papg, "ypg": ypg, "ypgAllow": ypg_allow,
        "offEpa": off_epa, "defEpa": def_epa, "thirdDownPct": third_down_pct(team, pbp),
        "redZonePct": red_zone_td_pct(team, pbp), "toMargin": turnover_margin(team, pbp),
    }


def build_team_detail(team, pbp, ngs_pass, ngs_rush, ngs_rec):
    pass_plays = pbp[(pbp.posteam == team) & (pbp.play_type == "pass")]
    rush_plays = pbp[(pbp.posteam == team) & (pbp.play_type == "run")]
    def_pass = pbp[(pbp.defteam == team) & (pbp.play_type == "pass")]
    def_rush = pbp[(pbp.defteam == team) & (pbp.play_type == "run")]

    t_ngs_pass = ngs_pass[ngs_pass.team_abbr == team] if "team_abbr" in ngs_pass.columns else ngs_pass.iloc[0:0]
    t_ngs_rush = ngs_rush[ngs_rush.team_abbr == team] if "team_abbr" in ngs_rush.columns else ngs_rush.iloc[0:0]
    t_ngs_rec = ngs_rec[ngs_rec.team_abbr == team] if "team_abbr" in ngs_rec.columns else ngs_rec.iloc[0:0]

    deep_pct = round(100 * len(pass_plays[pass_plays.air_yards >= 20]) / len(pass_plays), 1) if len(pass_plays) else 0
    explosive_pct = round(100 * len(rush_plays[rush_plays.yards_gained >= 10]) / len(rush_plays), 1) if len(rush_plays) else 0
    success_rate = round(100 * len(rush_plays[rush_plays.epa > 0]) / len(rush_plays), 1) if len(rush_plays) else 0
    stuff_pct = round(100 * len(rush_plays[rush_plays.yards_gained <= 0]) / len(rush_plays), 1) if len(rush_plays) else 0
    ypc = round(float(rush_plays.yards_gained.mean()), 1) if len(rush_plays) else 0

    pressure = len(def_pass[(def_pass.sack == 1) | (def_pass.qb_hit == 1)])
    pressure_rate = round(100 * pressure / len(def_pass), 1) if len(def_pass) else 0
    sack_rate = round(100 * len(def_pass[def_pass.sack == 1]) / len(def_pass), 1) if len(def_pass) else 0

    def col_mean(df, col):
        return round(float(df[col].mean()), 2) if col in df.columns and len(df) and df[col].notna().any() else None

    return {
        "passing": {
            "cpoe": col_mean(t_ngs_pass, "completion_percentage_above_expectation"),
            "epaDropback": safe_mean(pass_plays.epa),
            "timeToThrow": col_mean(t_ngs_pass, "avg_time_to_throw"),
            "deepBallPct": deep_pct,
            "pressureToSackPct": None,   # not publicly available
            "toWorthyPct": None,         # not publicly available
        },
        "rushing": {
            "ryoe": col_mean(t_ngs_rush, "rush_yards_over_expected_per_att"),
            "explosiveRunPct": explosive_pct, "successRate": success_rate, "ypc": ypc,
            "brokenTacklePct": None,     # not publicly available
            "stuffPct": stuff_pct,
        },
        "receiving": {
            "yprr": None,                # needs route data, not publicly available
            "separation": col_mean(t_ngs_rec, "avg_separation"),
            "cROE": None,                # not a direct NGS field
            "dropPct": None,             # not publicly available
            "yacPerRec": col_mean(t_ngs_rec, "avg_yac_above_expectation"),
        },
        "defense": {
            "pressureRate": pressure_rate, "sackRate": sack_rate,
            "missedTacklePct": None, "havocRate": None, "ptsPerDriveAllowed": None, "coverageGrade": None,
            "passEpaAllowed": safe_mean(def_pass.epa), "rushEpaAllowed": safe_mean(def_rush.epa),
        },
        "situational": {
            "fourthDownPct": fourth_down_pct(team, pbp),
            "timeOfPossession": None, "playsPerDrive": None, "penaltiesPerGm": None, "secPerPlay": None,
        },
    }


# ================= injuries =================
def build_injury_report(team, injuries, latest_week):
    wk = injuries[(injuries.team == team) & (injuries.week == latest_week)] if len(injuries) else injuries.iloc[0:0]
    qb_rows = wk[wk.position == "QB"]
    if len(qb_rows) and qb_rows.iloc[0].report_status in ("Out", "Doubtful"):
        qb_status = qb_rows.iloc[0].report_status
    elif len(qb_rows) and qb_rows.iloc[0].report_status == "Questionable":
        qb_status = "Questionable"
    else:
        qb_status = "Healthy"

    def health_index(pos_list):
        rows = wk[wk.position.isin(pos_list)]
        out = len(rows[rows.report_status.isin(["Out", "Doubtful"])])
        q = len(rows[rows.report_status == "Questionable"])
        return max(0, round(100 - 15 * out - 7 * q))

    key = wk[wk.report_status.isin(["Out", "Doubtful", "Questionable"]) & (wk.position != "QB")]
    key_injuries = [{"pos": r.position, "status": r.report_status} for _, r in key.head(3).iterrows()]
    return {
        "qbStatus": qb_status,
        "oLineHealth": health_index(["T", "G", "C", "OL"]),
        "secondaryDepth": health_index(["CB", "S", "DB"]),
        "keyInjuries": key_injuries,
    }


# ================= schedule / H2H / recent form =================
def build_schedule(schedules, week, teams):
    wk = schedules[(schedules.week == week) & schedules.home_team.isin(teams) & schedules.away_team.isin(teams)]
    out = []
    for _, g in wk.iterrows():
        out.append({
            "away": g.away_team, "home": g.home_team,
            "kickoff": f"{g.gameday} {g.gametime}" if pd.notna(g.get('gametime')) else str(g.gameday),
            "weather": {"temp": None, "wind": None, "precip": None},  # forecast not available; see docstring
            "surface": g.surface if pd.notna(g.get("surface")) else "Unknown",
            "roof": g.roof if pd.notna(g.get("roof")) else "Unknown",
            "awayRestDays": int(g.away_rest) if pd.notna(g.get("away_rest")) else None,
            "homeRestDays": int(g.home_rest) if pd.notna(g.get("home_rest")) else None,
            "awayTravelMiles": haversine_miles(STADIUM_COORDS.get(g.away_team), STADIUM_COORDS.get(g.home_team)),
            "divisional": bool(g.div_game) if pd.notna(g.get("div_game")) else False,
            "h2h": real_h2h(schedules, g.away_team, g.home_team),
        })
    return out


def real_h2h(all_schedules, away, home):
    games = all_schedules[
        (((all_schedules.home_team == away) & (all_schedules.away_team == home))
         | ((all_schedules.home_team == home) & (all_schedules.away_team == away)))
        & all_schedules.result.notna()
    ]
    meetings = len(games)
    if not meetings:
        return None
    away_wins, combined, margins = 0, [], []
    for _, g in games.iterrows():
        a_score, h_score = (g.home_score, g.away_score) if g.home_team == away else (g.away_score, g.home_score)
        combined.append(a_score + h_score)
        margins.append(a_score - h_score)
        if a_score > h_score:
            away_wins += 1
    return {
        "meetings": meetings, "aWins": away_wins, "bWins": meetings - away_wins,
        "avgCombinedPts": round(sum(combined) / meetings, 1), "avgMarginA": round(sum(margins) / meetings, 1),
    }


def build_team_recent(team, schedules, pbp, n=6):
    games = schedules[
        ((schedules.home_team == team) | (schedules.away_team == team)) & schedules.result.notna()
    ].sort_values("gameday", ascending=False).head(n)
    rows = []
    for _, g in games.iterrows():
        pf, pa, opp = (g.home_score, g.away_score, g.away_team) if g.home_team == team else (g.away_score, g.home_score, g.home_team)
        gp = pbp[pbp.game_id == g.game_id]
        off, defn = gp[gp.posteam == team], gp[gp.defteam == team]
        rows.append({
            "week": int(g.week), "opp": opp, "ptsFor": int(pf), "ptsAgainst": int(pa),
            "ydsFor": int(off.yards_gained.sum()) if len(off) else 0, "ydsAgainst": int(defn.yards_gained.sum()) if len(defn) else 0,
            "offEpa": safe_mean(off.epa), "defEpa": safe_mean(defn.epa),
            "result": "W" if pf > pa else "L",
        })
    return rows  # already most-recent-first from the descending sort


# ================= player props =================
def build_player_props(team, weekly, positions=("QB", "RB", "WR", "TE"), top_n=7):
    tw = weekly[(weekly.recent_team == team) & weekly.position.isin(positions) & (weekly.season_type == "REG")]
    players = []
    for (name, pos), grp in tw.groupby(["player_display_name", "position"]):
        grp = grp.sort_values("week", ascending=False)
        if pos == "QB":
            season_yds, season_td = int(grp.passing_yards.sum()), int(grp.passing_tds.sum())
            log = [{"week": int(r.week), "opp": r.opponent_team, "cmp": int(r.completions), "att": int(r.attempts),
                    "yds": int(r.passing_yards), "td": int(r.passing_tds), "int": int(r.interceptions), "result": "ND"} for _, r in grp.iterrows()]
        elif pos == "RB":
            season_yds, season_td = int(grp.rushing_yards.sum()), int(grp.rushing_tds.sum())
            log = [{"week": int(r.week), "opp": r.opponent_team, "att": int(r.carries), "yds": int(r.rushing_yards),
                    "td": int(r.rushing_tds), "rec": int(r.receptions), "result": "ND"} for _, r in grp.iterrows()]
        else:
            season_yds, season_td = int(grp.receiving_yards.sum()), int(grp.receiving_tds.sum())
            log = [{"week": int(r.week), "opp": r.opponent_team, "tgt": int(r.targets), "rec": int(r.receptions),
                    "yds": int(r.receiving_yards), "td": int(r.receiving_tds), "result": "ND"} for _, r in grp.iterrows()]
        players.append({"name": name, "team": team, "pos": pos, "yds": season_yds, "td": season_td, "gameLog": log})
    return sorted(players, key=lambda p: -p["yds"])[:top_n]


# ================= referees =================
def build_referees(season, pbp, schedules):
    try:
        officials = nfl.import_officials([season])
    except Exception as e:
        print(f"  officials data unavailable ({e}) — skipping, dashboard will use demo referee rows")
        return []
    role_col = "off_pos" if "off_pos" in officials.columns else ("position" if "position" in officials.columns else None)
    if role_col is None:
        print("  officials data has no recognizable role column — skipping")
        return []
    refs = officials[officials[role_col].astype(str).str.contains("Referee", case=False, na=False)]
    if not len(refs):
        return []

    league_flags = pbp[pbp.penalty == 1].groupby("game_id").size()
    league_avg_flags = league_flags.mean() if len(league_flags) else 1
    league_avg_total = (schedules.dropna(subset=["result"]).home_score + schedules.dropna(subset=["result"]).away_score).mean()

    out = []
    for name, grp in refs.groupby("name" if "name" in refs.columns else refs.columns[0]):
        game_ids = grp.game_id.unique() if "game_id" in grp.columns else []
        if not len(game_ids):
            continue
        flags = pbp[pbp.game_id.isin(game_ids) & (pbp.penalty == 1)].groupby("game_id").size()
        flags_per_game = flags.mean() if len(flags) else 0
        idx = round(100 * flags_per_game / league_avg_flags) if league_avg_flags else 100
        gsched = schedules[schedules.game_id.isin(game_ids) & schedules.result.notna()]
        home_win_pct = float((gsched.home_score > gsched.away_score).mean()) if len(gsched) else 0.5
        home_adv_adj = round((home_win_pct - 0.5) * 20, 1)
        totals = gsched.home_score + gsched.away_score
        over_pct = round(100 * float((totals > league_avg_total).mean())) if len(totals) else 50
        out.append({"name": name, "gamesCalled": int(len(game_ids)), "flagsPerGameIdx": int(idx), "homeAdvAdj": home_adv_adj, "overPct": over_pct})
    return out


def main():
    print("Loading play-by-play (this is the slow one)...")
    pbp = nfl.import_pbp_data([SEASON], downcast=True)

    print("Loading schedules, weekly stats, injuries, NGS data...")
    schedules_all = nfl.import_schedules(H2H_SEASONS)
    schedules = schedules_all[schedules_all.season == SEASON]
    weekly = nfl.import_weekly_data([SEASON])
    try:
        injuries = nfl.import_injuries([SEASON])
    except Exception as e:
        print(f"  injuries unavailable ({e})")
        injuries = pd.DataFrame(columns=["team", "week", "position", "report_status"])
    ngs_pass = nfl.import_ngs_data("passing", [SEASON])
    ngs_rush = nfl.import_ngs_data("rushing", [SEASON])
    ngs_rec = nfl.import_ngs_data("receiving", [SEASON])

    latest_injury_week = injuries.week.max() if len(injuries) else WEEK

    team_stats, team_detail, team_injuries, team_recent, offense = {}, {}, {}, {}, []
    for team in TEAMS:
        print(f"Processing {team}...")
        team_stats[team] = build_team_stats(team, schedules, pbp)
        team_detail[team] = build_team_detail(team, pbp, ngs_pass, ngs_rush, ngs_rec)
        team_injuries[team] = build_injury_report(team, injuries, latest_injury_week)
        team_recent[team] = build_team_recent(team, schedules, pbp)
        offense.extend(build_player_props(team, weekly))

    print("Building schedule for the target week...")
    schedule = build_schedule(schedules, WEEK, TEAMS)

    print("Attempting referee tendencies...")
    referees = build_referees(SEASON, pbp, schedules)

    output = {
        "teamStats": team_stats, "teamDetail": team_detail, "teamInjuries": team_injuries,
        "teamRecent": team_recent, "schedule": schedule, "offense": offense, "referees": referees, "week": WEEK,
    }

    with open("data/gridiron_report_data.json", "w") as f:
        json.dump(output, f, indent=2, default=str)
    print("\nWrote data/gridiron_report_data.json")
    print("Committed automatically by the nightly GitHub Actions workflow.")


if __name__ == "__main__":
    main()
