#!/usr/bin/env python3
"""
Redzone Labs - Men's College Basketball data pull, Power-conference schools only.

Power set = the football Power-5 schools = all teams in the ACC (conf 2),
Big Ten (7), Big 12 (8) and SEC (23), PLUS Oregon State and Washington State
(the Pac-12 holdovers). Notre Dame is already in the ACC for basketball.

Team-only (no player data). Output mirrors the NBA JSON shape.
Free + keyless via SportsDataverse GitHub data.
"""
import json
import re
import datetime
import warnings
warnings.filterwarnings("ignore")

import pandas as pd
import numpy as np
from sportsdataverse import mbb

POWER_CONF_IDS = {2, 7, 8, 23}
CONF_NAME = {2: "ACC", 7: "Big Ten", 8: "Big 12", 23: "SEC"}
NAMED = {"Oregon State", "Washington State"}  # Pac-12 holdovers (by location)
_VAL_RE = re.compile(r"'value':\s*([0-9]+(?:\.[0-9]+)?)")


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
    # MBB season label = ending year. Season starting Nov of year Y -> label Y+1.
    guess = now.year + 1 if now.month >= 8 else now.year
    for s in (guess, guess - 1):
        try:
            sch = pdf(mbb.load_mbb_schedule(seasons=[s]))
            if len(sch):
                return s, sch
        except Exception:
            continue
    s = guess - 1
    return s, pdf(mbb.load_mbb_schedule(seasons=[s]))


def f1(v):
    return round(float(v), 1) if v is not None and not pd.isna(v) else None


def pct(made, att):
    m, a = float(made), float(att)
    return round(100.0 * m / a, 1) if a else None


def _linescore(cell):
    try:
        if cell is None or (isinstance(cell, float) and pd.isna(cell)):
            return None
        if isinstance(cell, str):
            vals = [float(v) for v in _VAL_RE.findall(cell)]
        else:
            vals = [x.get("value") for x in list(cell) if x.get("value") is not None]
        vals = [int(round(float(v))) for v in vals if v is not None]
        return vals or None
    except Exception:
        return None


def build_meta_conf(sch):
    """team_abbr -> meta; team_abbr -> conf; power set of abbrs."""
    meta, conf, power = {}, {}, set()
    for _, g in sch.iterrows():
        for side in ("home", "away"):
            ab = g.get(f"{side}_abbreviation")
            if not ab or pd.isna(ab):
                continue
            if ab not in meta:
                color = str(g.get(f"{side}_color") or "").lstrip("#")
                meta[ab] = {
                    "name": g.get(f"{side}_short_display_name") or g.get(f"{side}_name") or g.get(f"{side}_location"),
                    "city": g.get(f"{side}_location"),
                    "color": "#" + color if color and color != "nan" else "#555",
                    "logo": g.get(f"{side}_logo"),
                    "conf": None,
                }
            cid = g.get(f"{side}_conference_id")
            loc = g.get(f"{side}_location")
            if pd.notna(cid) and int(cid) in POWER_CONF_IDS:
                conf[ab] = CONF_NAME[int(cid)]
                meta[ab]["conf"] = conf[ab]
                power.add(ab)
            elif str(loc) in NAMED:
                conf[ab] = "Pac-12"
                meta[ab]["conf"] = "Pac-12"
                power.add(ab)
    return meta, conf, power


def build_from_box(tb, power):
    """teamStats + teamRecent + per-game box map, from team boxscore."""
    if "season_type" in tb.columns and (tb["season_type"] == 2).any():
        tb = tb[tb["season_type"] == 2]
    team_stats, team_recent, boxmap = {}, {}, {}
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
        boxmap[gid] = side

    for ab, g in tb.groupby("team_abbreviation"):
        if ab not in power:
            continue
        gp = len(g)
        if not gp:
            continue
        w = int((g["team_winner"] == True).sum())
        ppg = f1(g["team_score"].mean())
        papg = f1(g["opponent_team_score"].mean())
        team_stats[ab] = {
            "record": f"{w}-{gp - w}", "gp": gp, "ppg": ppg, "papg": papg,
            "diff": f1((ppg or 0) - (papg or 0)) if ppg is not None and papg is not None else None,
            "rpg": f1(g["total_rebounds"].mean()),
            "apg": f1(g["assists"].mean()),
            "spg": f1(g["steals"].mean()),
            "bpg": f1(g["blocks"].mean()),
            "topg": f1(g["total_turnovers"].mean()),
            "fgPct": pct(g["field_goals_made"].sum(), g["field_goals_attempted"].sum()),
            "fg3Pct": pct(g["three_point_field_goals_made"].sum(), g["three_point_field_goals_attempted"].sum()),
            "ftPct": pct(g["free_throws_made"].sum(), g["free_throws_attempted"].sum()),
        }
        gg = g.sort_values("game_date")
        rows = []
        for _, r in gg.tail(10).iloc[::-1].iterrows():
            pf, pa = int(r["team_score"]), int(r["opponent_team_score"])
            rows.append({
                "opp": r["opponent_team_abbreviation"], "home": bool(r["team_home_away"] == "home"),
                "ptsFor": pf, "ptsAgainst": pa, "result": "W" if pf > pa else ("L" if pf < pa else "T"),
            })
        team_recent[ab] = rows
    return team_stats, team_recent, boxmap


def _has_box(df):
    return df is not None and len(df) > 0 and "team_abbreviation" in getattr(df, "columns", [])


def main():
    season, sch = pick_season()
    print(f"MBB season {season}  schedule rows {len(sch)}  completed {int(sch['status_type_completed'].sum())}")
    meta, conf, power = build_meta_conf(sch)
    print(f"power teams: {len(power)}")

    def load_box(s):
        try:
            return pdf(mbb.load_mbb_team_boxscore(seasons=[s]))
        except Exception:
            return pd.DataFrame()

    tb = load_box(season)
    if _has_box(tb):
        team_stats, team_recent, boxmap = build_from_box(tb, power)
    else:
        team_stats, team_recent, boxmap = {}, {}, {}
        # borrow meta/conf from prior season so colors/logos exist if current is bare
        psch = pdf(mbb.load_mbb_schedule(seasons=[season - 1]))
        pmeta, pconf, ppower = build_meta_conf(psch)
        for ab, m in pmeta.items():
            meta.setdefault(ab, m)
        for ab, c in pconf.items():
            conf.setdefault(ab, c)
        power |= ppower

    # schedule for Scores (games involving >=1 power team)
    out_sched = []
    for _, g in sch.iterrows():
        ha, aa = g.get("home_abbreviation"), g.get("away_abbreviation")
        if ha not in power and aa not in power:
            continue
        completed = bool(g.get("status_type_completed"))
        gid = g.get("game_id")
        row = {
            "away": aa, "home": ha,
            "date": str(g.get("date"))[:10],
            "venue": g.get("venue_full_name"),
            "final": completed,
            "awayRank": int(g["away_current_rank"]) if not pd.isna(g.get("away_current_rank")) and g.get("away_current_rank") not in (0, 99) else None,
            "homeRank": int(g["home_current_rank"]) if not pd.isna(g.get("home_current_rank")) and g.get("home_current_rank") not in (0, 99) else None,
        }
        if completed and not pd.isna(g.get("home_score")) and not pd.isna(g.get("away_score")):
            box = {"awayScore": int(g["away_score"]), "homeScore": int(g["home_score"]),
                   "awayH": _linescore(g.get("away_linescores")), "homeH": _linescore(g.get("home_linescores"))}
            bx = boxmap.get(gid) or boxmap.get(str(gid)) or {}
            if bx.get("away"):
                box["awayStats"] = bx["away"]
            if bx.get("home"):
                box["homeStats"] = bx["home"]
            row["box"] = box
        for ab in (ha, aa):
            if ab not in meta and ab and not pd.isna(ab):
                meta[ab] = {"name": ab, "city": "", "color": "#555", "logo": None, "conf": None}
        out_sched.append(row)

    appear = set(power)
    for r in out_sched:
        appear.add(r["away"]); appear.add(r["home"])
    meta = {k: v for k, v in meta.items() if k in appear}

    out = {
        "sport": "ncaam",
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
    with open("data/ncaam_data.json", "w") as f:
        json.dump(clean(out), f, default=str)
    print(f"teams {len(team_stats)} | games {len(out_sched)} | meta {len(meta)} | confs {sorted(set(conf.values()))}")
    print("wrote data/ncaam_data.json")


if __name__ == "__main__":
    main()
