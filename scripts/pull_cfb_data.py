#!/usr/bin/env python3
"""
Redzone Labs - College Football (FBS) data pull, Power-conference schools only.

Power set = every historical Power 5 school = all teams in ACC, Big Ten, Big 12,
SEC (the current Power 4) PLUS Notre Dame, Oregon State and Washington State
(the Power-5 holdovers that sit outside those four conferences).

Team-only (no player data). Output mirrors the NBA/NHL JSON shape so the
dashboard shares components: teamMeta, teamStats, teamRecent, schedule (with
box), conf map, season, updated.

Free + keyless via SportsDataverse GitHub data (works from a CI runner).
"""
import json
import datetime
import warnings
warnings.filterwarnings("ignore")

import pandas as pd
import numpy as np
from sportsdataverse import cfb

POWER_CONF = {"ACC", "Big Ten", "Big 12", "SEC"}
NAMED = {"Notre Dame", "Oregon State", "Washington State"}  # by school/location


def pdf(x):
    import polars as pl
    return x.to_pandas() if isinstance(x, pl.DataFrame) else x


def clean(o):
    import math
    if isinstance(o, float):
        return None if math.isnan(o) else o
    if isinstance(o, dict):
        return {k: clean(v) for k, v in o.items()}
    if isinstance(o, list):
        return [clean(v) for v in o]
    return o


def pick_season():
    now = datetime.date.today()
    # CFB season label = calendar year it starts (Aug). After Jan, last season
    # is (year-1) until the new one opens in late summer.
    guess = now.year if now.month >= 7 else now.year - 1
    for s in (guess, guess - 1):
        try:
            sch = pdf(cfb.load_cfb_schedule(seasons=[s]))
            if len(sch) and (sch.get("completed") is not None) and int(sch["completed"].sum()) > 0:
                return s, sch
        except Exception:
            continue
    s = guess
    return s, pdf(cfb.load_cfb_schedule(seasons=[s]))


def f1(v):
    return round(float(v), 1) if v is not None and not pd.isna(v) else None


def num(v):
    try:
        return float(v)
    except Exception:
        return np.nan


def third_pct(cell):
    # "5-12" -> 41.7
    try:
        m, a = str(cell).split("-")
        a = float(a)
        return round(100.0 * float(m) / a, 1) if a else None
    except Exception:
        return None


def main():
    season, sch = pick_season()
    print(f"CFB season {season}  schedule rows {len(sch)}  completed {int(sch['completed'].sum())}")

    teams = pdf(cfb.load_cfb_teams(seasons=[season]))
    print("conf short names:", sorted(set(str(c) for c in teams['conference_short_name'].dropna().unique()))[:30])

    # power team_ids
    def is_power(row):
        cs = str(row.get("conference_short_name"))
        loc = str(row.get("location"))
        sch_ = str(row.get("short_display_name"))
        return (cs in POWER_CONF) or (loc in NAMED) or (sch_ in NAMED)

    power_ids = set()
    meta = {}
    conf = {}
    id2abbr = {}
    for _, r in teams.iterrows():
        if not bool(r.get("is_fbs")):
            continue  # avoid abbreviation collisions with D2/D3 schools (e.g. ARK)
        tid = int(r["team_id"])
        ab = r.get("abbreviation") or str(tid)
        id2abbr[tid] = ab
        color = str(r.get("color") or "").lstrip("#")
        meta[ab] = {
            "name": r.get("short_display_name") or r.get("location"),
            "city": r.get("location"),
            "color": "#" + color if color and color != "nan" else "#555",
            "logo": r.get("team_logo"),
            "conf": r.get("conference_short_name"),
        }
        if is_power(r):
            power_ids.add(tid)
            conf[ab] = r.get("conference_short_name") if str(r.get("conference_short_name")) in POWER_CONF else (
                "Pac-12" if r.get("location") in ("Oregon State", "Washington State") else
                "Ind" if r.get("location") == "Notre Dame" else r.get("conference_short_name"))
    power_abbr = {id2abbr[t] for t in power_ids}
    print(f"power teams: {len(power_abbr)}")

    # ---- team box (offense + pair for defense) ----
    tb = pdf(cfb.load_cfb_team_box(seasons=[season]))
    numcols = ["totalYards", "rushingYards", "netPassingYards", "turnovers", "firstDowns"]
    for c in numcols:
        if c in tb.columns:
            tb[c + "_n"] = tb[c].map(num)
    tb["third_pct"] = tb["thirdDownEff"].map(third_pct) if "thirdDownEff" in tb.columns else None

    # game_id -> {home_away: row}
    boxmap = {}
    for gid, g in tb.groupby("game_id"):
        side = {}
        for _, r in g.iterrows():
            side[r["home_away"]] = r
        boxmap[gid] = side

    # ---- schedule-derived per-team records / points ----
    schd = sch.copy()
    schd = schd[schd["completed"] == True]
    # build per-team game list
    from collections import defaultdict
    games_by_team = defaultdict(list)  # abbr -> list of dicts
    for _, g in schd.iterrows():
        ha, aa = g.get("home_abbreviation"), g.get("away_abbreviation")
        hp, ap = g.get("home_points"), g.get("away_points")
        gid = g.get("game_id")
        if pd.isna(hp) or pd.isna(ap):
            continue
        dt = str(g.get("start_date"))[:10]
        for side, me, opp, pf, pa, home in (("home", ha, aa, hp, ap, True), ("away", aa, ha, ap, hp, False)):
            if me not in power_abbr:
                continue
            bx = boxmap.get(gid, {})
            myb = bx.get("home" if home else "away")
            games_by_team[me].append({
                "gid": gid, "date": dt, "opp": opp, "home": home,
                "pf": int(pf), "pa": int(pa), "res": "W" if pf > pa else ("L" if pf < pa else "T"),
                "box": myb, "oppbox": bx.get("away" if home else "home"),
            })

    team_stats = {}
    team_recent = {}
    for ab, gl in games_by_team.items():
        gl = sorted(gl, key=lambda x: x["date"])
        gp = len(gl)
        if not gp:
            continue
        w = sum(1 for x in gl if x["res"] == "W")
        l = sum(1 for x in gl if x["res"] == "L")
        pf = np.mean([x["pf"] for x in gl])
        pa = np.mean([x["pa"] for x in gl])

        def boxavg(key, side="box"):
            vals = [num(x[side][key]) for x in gl if x[side] is not None and key in (x[side].index if hasattr(x[side], 'index') else [])]
            vals = [v for v in vals if not pd.isna(v)]
            return float(np.mean(vals)) if vals else None

        tot = boxavg("totalYards")
        rush = boxavg("rushingYards")
        pyd = boxavg("netPassingYards")
        give = boxavg("turnovers")
        ydsA = boxavg("totalYards", "oppbox")
        take = boxavg("turnovers", "oppbox")
        third_vals = [x["box"]["third_pct"] for x in gl if x["box"] is not None and "third_pct" in (x["box"].index if hasattr(x["box"], 'index') else []) and x["box"]["third_pct"] is not None]
        third = float(np.mean(third_vals)) if third_vals else None
        team_stats[ab] = {
            "record": f"{w}-{l}", "gp": gp,
            "ppg": f1(pf), "papg": f1(pa), "diff": f1(pf - pa),
            "totYdsG": f1(tot), "rushYdsG": f1(rush), "passYdsG": f1(pyd),
            "ydsAllowedG": f1(ydsA),
            "toG": f1(give), "takeG": f1(take),
            "toMargin": f1((take or 0) - (give or 0)) if (take is not None and give is not None) else None,
            "thirdPct": f1(third),
        }
        team_recent[ab] = [{
            "opp": x["opp"], "home": x["home"], "ptsFor": x["pf"], "ptsAgainst": x["pa"], "result": x["res"],
        } for x in gl[-10:]][::-1]

    # ---- schedule for Scores (games involving >=1 power team) ----
    out_sched = []
    for _, g in sch.iterrows():
        ha, aa = g.get("home_abbreviation"), g.get("away_abbreviation")
        if ha not in power_abbr and aa not in power_abbr:
            continue
        completed = bool(g.get("completed"))
        gid = g.get("game_id")
        row = {
            "away": aa, "home": ha,
            "date": str(g.get("start_date"))[:10],
            "week": int(g["week"]) if not pd.isna(g.get("week")) else None,
            "venue": g.get("venue"),
            "final": completed,
            "awayRank": int(g["away_rank"]) if not pd.isna(g.get("away_rank")) else None,
            "homeRank": int(g["home_rank"]) if not pd.isna(g.get("home_rank")) else None,
        }
        if completed and not pd.isna(g.get("home_points")) and not pd.isna(g.get("away_points")):
            bx = boxmap.get(gid, {})
            hb, abx = bx.get("home"), bx.get("away")
            box = {"awayScore": int(g["away_points"]), "homeScore": int(g["home_points"])}

            def side_stats(rr):
                if rr is None:
                    return None
                return {
                    "totYds": int(num(rr.get("totalYards"))) if not pd.isna(num(rr.get("totalYards"))) else None,
                    "rushYds": int(num(rr.get("rushingYards"))) if not pd.isna(num(rr.get("rushingYards"))) else None,
                    "passYds": int(num(rr.get("netPassingYards"))) if not pd.isna(num(rr.get("netPassingYards"))) else None,
                    "to": int(num(rr.get("turnovers"))) if not pd.isna(num(rr.get("turnovers"))) else None,
                }
            if abx is not None:
                box["awayStats"] = side_stats(abx)
            if hb is not None:
                box["homeStats"] = side_stats(hb)
            row["box"] = box
        # keep meta for both teams so opponents render
        for ab in (ha, aa):
            if ab not in meta:
                meta[ab] = {"name": ab, "city": "", "color": "#555", "logo": None, "conf": None}
        out_sched.append(row)

    # trim meta to teams that actually appear (power + opponents in schedule)
    appear = set()
    for r in out_sched:
        appear.add(r["away"]); appear.add(r["home"])
    appear |= power_abbr
    meta = {k: v for k, v in meta.items() if k in appear}

    out = {
        "sport": "cfb",
        "season": season,
        "updated": datetime.datetime.utcnow().strftime("%Y-%m-%d"),
        "conf": conf,
        "teamMeta": meta,
        "teamStats": team_stats,
        "teamRecent": team_recent,
        "schedule": out_sched,
    }
    import os
    os.makedirs("data", exist_ok=True)
    with open("data/cfb_data.json", "w") as f:
        json.dump(clean(out), f, default=str)
    print(f"teams {len(team_stats)} | games {len(out_sched)} | meta {len(meta)} | confs {sorted(set(conf.values()))}")
    print("wrote data/cfb_data.json")


if __name__ == "__main__":
    main()
