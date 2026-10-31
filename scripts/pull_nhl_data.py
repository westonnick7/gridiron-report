#!/usr/bin/env python3
"""
Redzone Labs - NHL data pull (sportsdataverse, free + keyless).
Outputs data/nhl_data.json mirroring the NBA shape so the dashboard reuses views.
"""
import json
import datetime
import warnings
warnings.filterwarnings("ignore")

import pandas as pd
import numpy as np
from sportsdataverse import nhl

# abbr -> [city, nickname, color], and division
TEAM = {
    "ANA": ["Anaheim", "Ducks", "#F47A38", "West", "Pacific"],
    "BOS": ["Boston", "Bruins", "#FFB81C", "East", "Atlantic"],
    "BUF": ["Buffalo", "Sabres", "#003087", "East", "Atlantic"],
    "CGY": ["Calgary", "Flames", "#C8102E", "West", "Pacific"],
    "CAR": ["Carolina", "Hurricanes", "#CC0000", "East", "Metropolitan"],
    "CHI": ["Chicago", "Blackhawks", "#CF0A2C", "West", "Central"],
    "COL": ["Colorado", "Avalanche", "#6F263D", "West", "Central"],
    "CBJ": ["Columbus", "Blue Jackets", "#002654", "East", "Metropolitan"],
    "DAL": ["Dallas", "Stars", "#006847", "West", "Central"],
    "DET": ["Detroit", "Red Wings", "#CE1126", "East", "Atlantic"],
    "EDM": ["Edmonton", "Oilers", "#FF4C00", "West", "Pacific"],
    "FLA": ["Florida", "Panthers", "#041E42", "East", "Atlantic"],
    "LAK": ["Los Angeles", "Kings", "#111111", "West", "Pacific"],
    "MIN": ["Minnesota", "Wild", "#154734", "West", "Central"],
    "MTL": ["Montreal", "Canadiens", "#AF1E2D", "East", "Atlantic"],
    "NSH": ["Nashville", "Predators", "#FFB81C", "West", "Central"],
    "NJD": ["New Jersey", "Devils", "#CE1126", "East", "Metropolitan"],
    "NYI": ["New York", "Islanders", "#00539B", "East", "Metropolitan"],
    "NYR": ["New York", "Rangers", "#0038A8", "East", "Metropolitan"],
    "OTT": ["Ottawa", "Senators", "#C52032", "East", "Atlantic"],
    "PHI": ["Philadelphia", "Flyers", "#F74902", "East", "Metropolitan"],
    "PIT": ["Pittsburgh", "Penguins", "#FCB514", "East", "Metropolitan"],
    "SJS": ["San Jose", "Sharks", "#006D75", "West", "Pacific"],
    "SEA": ["Seattle", "Kraken", "#001628", "West", "Pacific"],
    "STL": ["St. Louis", "Blues", "#002F87", "West", "Central"],
    "TBL": ["Tampa Bay", "Lightning", "#002868", "East", "Atlantic"],
    "TOR": ["Toronto", "Maple Leafs", "#00205B", "East", "Atlantic"],
    "UTA": ["Utah", "Mammoth", "#6CACE4", "West", "Central"],
    "VAN": ["Vancouver", "Canucks", "#00205B", "West", "Pacific"],
    "VGK": ["Vegas", "Golden Knights", "#B4975A", "West", "Pacific"],
    "WPG": ["Winnipeg", "Jets", "#041E42", "West", "Central"],
    "WSH": ["Washington", "Capitals", "#C8102E", "East", "Metropolitan"],
}
DIVISION = {k: [v[3], v[4]] for k, v in TEAM.items()}


def pdf(x):
    import polars as pl
    return x.to_pandas() if isinstance(x, pl.DataFrame) else x


def f1(x):
    return round(float(x), 1) if x is not None and not pd.isna(x) else None


def toi_min(s):
    try:
        m, sec = str(s).split(":")
        return int(m) + int(sec) / 60.0
    except Exception:
        return None


def pick_season():
    """Prefer the current season as soon as its schedule is published, so the
    Scores tab shows the current-season slate. Stats fill in as games are played."""
    now = datetime.date.today()
    guess = now.year + 1 if now.month >= 9 else now.year
    for s in (guess, guess - 1):
        try:
            sch = pdf(nhl.load_nhl_schedule(seasons=[s]))
            if len(sch):
                return s, sch
        except Exception:
            continue
    s = guess - 1
    return s, pdf(nhl.load_nhl_schedule(seasons=[s]))


def overtime_games(season):
    """game_ids that reached OT or SO."""
    try:
        sp = pdf(nhl.load_nhl_shots_by_period(seasons=[season]))
        ot = sp[sp["period_type"].isin(["OT", "SO"])]["game_id"].unique()
        return set(int(g) for g in ot)
    except Exception:
        return set()


# ---- Defense vs Position (cheat sheet): per-defense rank (1 = allows most) ----
NHL_DVP_POS = {"C": "C", "L": "W", "R": "W", "D": "D"}
NHL_DVP_SPEC = {
    "C": {"g": "goals", "pts": "points", "sog": "shots_on_goal"},
    "W": {"g": "goals", "pts": "points", "sog": "shots_on_goal"},
    "D": {"pts": "points", "sog": "shots_on_goal", "g": "goals"},
}
def build_dvp_nhl(sk):
    if sk is None or not len(sk) or "position" not in sk.columns:
        return {}
    s = sk.copy()
    gteams = {}
    for gid, g in s.groupby("game_id"):
        hs = g[g["home_away"] == "home"]["team_abbrev"].unique()
        aw = g[g["home_away"] == "away"]["team_abbrev"].unique()
        gteams[gid] = (hs[0] if len(hs) else None, aw[0] if len(aw) else None)
    s["opp"] = s.apply(lambda r: gteams.get(r["game_id"], (None, None))[1 if r["home_away"] == "home" else 0], axis=1)
    s["grp"] = s["position"].map(lambda p: NHL_DVP_POS.get(str(p)))
    gp = s.groupby("opp")["game_id"].nunique()
    dvp = {}
    for pos, sm in NHL_DVP_SPEC.items():
        sub = s[s["grp"] == pos]
        for key, col in sm.items():
            if col not in sub.columns:
                continue
            per = (sub.groupby("opp")[col].sum() / gp).dropna()
            per = per[per > 0]
            if not len(per):
                continue
            r = per.rank(ascending=False, method="min").astype(int)
            for t in per.index:
                if t:
                    dvp.setdefault(t, {}).setdefault(pos, {})[key] = int(r[t])
    return dvp


def _player_box_map(sk, go, top=5):
    """game_id -> {"away":[...], "home":[...]} top skaters + starting goalie per side.
    Skater: {name, tag(position), line('2 G · 1 A · 5 SOG')}; goalie: {name, 'G', '31 SV · 2 GA'}."""
    out = {}
    def addset(df, kind):
        if df is None or len(df) == 0 or "game_id" not in getattr(df, "columns", []) or "home_away" not in df.columns:
            return
        for gid, g in df.groupby("game_id"):
            for ha, gg in g.groupby("home_away"):
                key = "home" if str(ha).lower() == "home" else "away"
                slot = out.setdefault(int(gid), {}).setdefault(key, {"sk": [], "go": None})
                if kind == "sk":
                    gg = gg.sort_values(["points", "goals"], ascending=False).head(top)
                    for _, r in gg.iterrows():
                        if pd.isna(r.get("points")) and pd.isna(r.get("goals")):
                            continue
                        gl = int(r.get("goals") or 0) if not pd.isna(r.get("goals")) else 0
                        a = int(r.get("assists") or 0) if not pd.isna(r.get("assists")) else 0
                        sog = int(r.get("shots_on_goal") or 0) if not pd.isna(r.get("shots_on_goal")) else 0
                        slot["sk"].append({"name": r.get("player_name"), "tag": (r.get("position") or ""),
                                           "line": f"{gl} G · {a} A · {sog} SOG"})
                else:
                    gg = gg.sort_values("saves", ascending=False)
                    if len(gg):
                        r = gg.iloc[0]
                        sv = int(r.get("saves") or 0) if not pd.isna(r.get("saves")) else 0
                        ga = int(r.get("goals_against") or 0) if not pd.isna(r.get("goals_against")) else 0
                        slot["go"] = {"name": r.get("player_name"), "tag": "G", "line": f"{sv} SV · {ga} GA"}
    addset(sk, "sk")
    addset(go, "go")
    final = {}
    for gid, sides in out.items():
        fs = {}
        for key, slot in sides.items():
            rows = list(slot["sk"])
            if slot["go"]:
                rows.append(slot["go"])
            if rows:
                fs[key] = rows
        final[gid] = fs
        final[str(gid)] = fs
    return final


def build(season):
    sch = pdf(nhl.load_nhl_schedule(seasons=[season]))
    tb = pdf(nhl.load_nhl_team_box(seasons=[season]))
    sk = pdf(nhl.load_nhl_skater_box(seasons=[season]))
    go = pdf(nhl.load_nhl_goalie_box(seasons=[season]))
    pmap = _player_box_map(sk, go)
    # regular season only (game_type R)
    reg = sch[sch["game_type"] == "R"]
    reg_ids = set(int(x) for x in reg["game_id"].unique())
    otset = overtime_games(season)
    teams = set(TEAM.keys())

    # team box for regular season games only
    tbr = tb[tb["game_id"].isin(reg_ids) & tb["team_abbrev"].isin(teams)].copy()

    # pair opponents within a game for shots-against
    opp_shots, opp_abbr = {}, {}
    for gid, g in tbr.groupby("game_id"):
        rows = g.to_dict("records")
        if len(rows) == 2:
            a, b = rows
            opp_shots[(gid, a["team_abbrev"])] = b["shots_on_goal"]
            opp_shots[(gid, b["team_abbrev"])] = a["shots_on_goal"]
            opp_abbr[(gid, a["team_abbrev"])] = b["team_abbrev"]
            opp_abbr[(gid, b["team_abbrev"])] = a["team_abbrev"]

    team_stats, team_recent = {}, {}
    for team, g in tbr.groupby("team_abbrev"):
        g = g.sort_values("game_date")
        gp = len(g)
        w = ot_l = reg_l = 0
        recent = []
        for _, r in g.iterrows():
            gid = int(r["game_id"])
            gf, ga = int(r["goals"]), int(r["goals_against"])
            if gf > ga:
                w += 1; res = "W"
            elif gid in otset:
                ot_l += 1; res = "OTL"
            else:
                reg_l += 1; res = "L"
            recent.append({
                "opp": opp_abbr.get((gid, team), ""),
                "home": bool(r["home_away"] == "home"),
                "ptsFor": gf, "ptsAgainst": ga, "result": res,
            })
        losses = reg_l + ot_l
        pts = 2 * w + ot_l
        sa = [opp_shots.get((int(r["game_id"]), team)) for _, r in g.iterrows()]
        sa = [x for x in sa if x is not None]
        team_stats[team] = {
            "record": f"{w}-{reg_l}-{ot_l}", "pts": pts, "gp": gp,
            "gfpg": f1(g["goals"].mean()), "gapg": f1(g["goals_against"].mean()),
            "shotspg": f1(g["shots_on_goal"].mean()),
            "shotsApg": f1(np.mean(sa)) if sa else None,
            "pppg": f1(g["power_play_goals"].mean()),
            "faceoffPct": f1(g["faceoff_win_pctg"].mean() * (100 if g["faceoff_win_pctg"].mean() < 1.5 else 1)),
            "pimpg": f1(g["pim"].mean()), "hitspg": f1(g["hits"].mean()),
            "blockspg": f1(g["blocked_shots"].mean()),
            "savePct": f1(g["save_pctg"].mean() * (100 if g["save_pctg"].mean() < 1.5 else 1)),
        }
        team_recent[team] = recent[::-1][:10]

    team_meta = {k: {"name": v[1], "city": v[0], "color": v[2],
                     "logo": f"https://assets.nhle.com/logos/nhl/svg/{k}_light.svg"}
                 for k, v in TEAM.items()}

    # schedule with box (team stats per side; no per-period goals available)
    tbmap = {}
    for gid, g in tb.groupby("game_id"):
        side = {}
        for _, r in g.iterrows():
            ha = "home" if r["home_away"] == "home" else "away"
            fo = r["faceoff_win_pctg"]
            side[ha] = {
                "shots": int(r["shots_on_goal"]) if not pd.isna(r["shots_on_goal"]) else None,
                "hits": int(r["hits"]) if not pd.isna(r["hits"]) else None,
                "blocks": int(r["blocked_shots"]) if not pd.isna(r["blocked_shots"]) else None,
                "pp": int(r["power_play_goals"]) if not pd.isna(r["power_play_goals"]) else None,
                "pim": int(r["pim"]) if not pd.isna(r["pim"]) else None,
                "faceoff": f1(fo * (100 if (fo is not None and not pd.isna(fo) and fo < 1.5) else 1)) if not pd.isna(fo) else None,
            }
        tbmap[int(gid)] = side

    schedule = []
    for _, g in sch[sch["home_team_abbr"].isin(teams) & sch["away_team_abbr"].isin(teams)].iterrows():
        gid = int(g["game_id"])
        final = str(g.get("game_state")) == "OFF"
        row = {"away": g["away_team_abbr"], "home": g["home_team_abbr"],
               "date": str(g.get("game_date"))[:10], "time": str(g.get("game_date")) if g.get("game_date") is not None else None, "venue": g.get("venue"), "final": final}
        if final and not pd.isna(g.get("home_score")) and not pd.isna(g.get("away_score")):
            box = {"awayScore": int(g["away_score"]), "homeScore": int(g["home_score"]),
                   "ot": ("SO/OT" if gid in otset else None)}
            side = tbmap.get(gid, {})
            if side.get("away"): box["awayStats"] = side["away"]
            if side.get("home"): box["homeStats"] = side["home"]
            pm = pmap.get(gid) or pmap.get(str(gid)) or {}
            if pm.get("away"): box["awayPlayers"] = pm["away"]
            if pm.get("home"): box["homePlayers"] = pm["home"]
            row["box"] = box
        schedule.append(row)

    # Minimum games scale with how far into the season we are, so leaderboards
    # populate in the opening weeks but still filter out marginal players by
    # mid/late season (full 82-game behaviour: skaters >=10, goalies >=18).
    try:
        gp_max = int(tbr.groupby("team_abbrev")["game_id"].nunique().max()) if len(tbr) else 0
    except Exception:
        gp_max = 0
    sk_min = max(1, min(10, round(gp_max * 0.35)))
    go_min = max(1, min(18, round(gp_max * 0.25)))

    # skaters leaderboard (regular season)
    skr = sk[sk["game_id"].isin(reg_ids) & sk["team_abbrev"].isin(teams)].copy()
    skr["toi_m"] = skr["toi"].apply(toi_min)
    skaters = []
    for (pid, name), g in skr.groupby(["player_id", "player_name"]):
        gp = int(g["game_id"].nunique())
        if gp < sk_min:
            continue
        team = g.sort_values("game_date")["team_abbrev"].iloc[-1]
        pos = g["position"].dropna().iloc[-1] if g["position"].notna().any() else ""
        skaters.append({
            "name": name, "team": team, "pos": pos, "gp": gp,
            "g": int(g["goals"].sum()), "a": int(g["assists"].sum()), "pts": int(g["points"].sum()),
            "plusMinus": int(g["plus_minus"].sum()), "shots": int(g["shots_on_goal"].sum()),
            "pim": int(g["pim"].sum()), "ppg": int(g["power_play_goals"].sum()),
            "hits": int(g["hits"].sum()), "blocks": int(g["blocked_shots"].sum()),
            "toi": f1(g["toi_m"].mean()),
        })
    skaters.sort(key=lambda p: -p["pts"])

    # goalies leaderboard (regular season, >=5 GP)
    gor = go[go["game_id"].isin(reg_ids) & go["team_abbrev"].isin(teams)].copy()
    gor["toi_m"] = gor["toi"].apply(toi_min)
    goalies = []
    for (pid, name), g in gor.groupby(["player_id", "player_name"]):
        gp = int(g["game_id"].nunique())
        if gp < go_min:
            continue
        team = g.sort_values("game_date")["team_abbrev"].iloc[-1]
        mins = g["toi_m"].sum()
        ga = g["goals_against"].sum()
        sa = g["shots_against"].sum()
        sv = g["saves"].sum()
        dec = g["decision"]
        so = int(((g["goals_against"] == 0) & (g["toi_m"] >= 55)).sum())
        goalies.append({
            "name": name, "team": team, "gp": gp,
            "w": int((dec == "W").sum()), "l": int((dec == "L").sum()), "o": int((dec == "O").sum()),
            "gaa": round(ga / (mins / 60.0), 2) if mins else None,
            "svPct": round(sv / sa, 3) if sa else None,
            "so": so, "saves": int(sv),
        })
    goalies.sort(key=lambda p: -(p["svPct"] or 0))

    return {
        "sport": "nhl", "season": season,
        "updated": datetime.datetime.utcnow().strftime("%Y-%m-%d"),
        "teamStats": team_stats, "teamMeta": team_meta, "teamRecent": team_recent,
        "schedule": schedule, "skaters": skaters, "goalies": goalies,
        "dvp": build_dvp_nhl(sk),
    }


def main():
    season, _ = pick_season()
    print("NHL season:", season)
    out = build(season)
    print("teams", len(out["teamStats"]), "games", len(out["schedule"]),
          "skaters", len(out["skaters"]), "goalies", len(out["goalies"]))
    with open("data/nhl_data.json", "w") as f:
        json.dump(out, f, default=str)
    print("wrote data/nhl_data.json")


if __name__ == "__main__":
    main()
