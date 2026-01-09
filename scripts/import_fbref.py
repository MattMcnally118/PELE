import argparse
import os
from typing import Dict, List

import pandas as pd


# Minimal FBref -> canonical column mapping for match-level player logs.
# Adjust as needed based on the exact export you have.
FBREF_MAP: Dict[str, str] = {
    # Identity
    "player": "player_name",
    "player_id": "player_id",  # if present in your export
    "match_id": "match_id",     # if present or construct externally
    "team": "team_id",
    "season": "season",

    # Minutes
    "Min": "minutes",

    # Attacking
    "Gls": "np_goals",  # ensure non-penalty goals; if you have PK, subtract them
    "Ast": "assists",
    "xG": "xg",
    "xA": "xa",
    "KP": "key_passes",

    # Progression
    "PrgP": "progressive_passes",
    "PrgC": "progressive_carries",

    # Dribbling
    "Succ": "successful_dribbles",  # from Dribbles section (successful take-ons)

    # Possession loss
    "Dis": "turnovers",  # dispossessed
    "Mis": "turnovers_miscontrols",  # miscontrols (will be added to turnovers if present)

    # Defensive
    "Tkl": "tackles",
    "Int": "interceptions",
    "Blocks": "blocks",
    "AerWon": "aerials_won",

    # Pressures
    "Press": "pressures",           # total pressures
    "SuccPress": "pressures_success",  # successful pressures if available; else we derive rate
}


CANONICAL_COLUMNS: List[str] = [
    "player_id", "player_name", "match_id", "minutes", "position",
    "np_goals", "assists", "xg", "xa", "key_passes",
    "progressive_passes", "progressive_carries", "successful_dribbles", "turnovers",
    "pressures_success", "tackles", "interceptions", "blocks", "aerials_won",
    "team_goals_for_on", "team_goals_against_on", "team_goals_for_off", "team_goals_against_off",
    "opponent_elo", "game_state_time_weighted", "season", "team_id"
]


def normalize_fbref(input_csv: str, output_csv: str) -> None:
    df = pd.read_csv(input_csv)

    # Rename known columns
    rename_map = {src: dst for src, dst in FBREF_MAP.items() if src in df.columns}
    df = df.rename(columns=rename_map)

    # Turnovers: combine dispossessions and miscontrols if both exist
    if "turnovers" not in df and {"Dis", "Mis"}.issubset(set(FBREF_MAP.keys())):
        dis_col = "Dis" if "Dis" in df.columns else None
        mis_col = "Mis" if "Mis" in df.columns else None
        if dis_col or mis_col:
            df["turnovers"] = df.get(dis_col, 0).fillna(0) + df.get(mis_col, 0).fillna(0)

    # Successful pressures fallback: derive from total pressures if success not present
    if "pressures_success" not in df.columns:
        if "pressures" in df.columns:
            # Use a conservative success rate prior (e.g., 32%) if exact not present
            df["pressures_success"] = (df["pressures"].fillna(0) * 0.32).round(0)
        else:
            df["pressures_success"] = 0

    # Required canonical fields defaults
    defaults = {
        "player_id": df.get("player_id", pd.Series(range(1, len(df) + 1))).astype(str),
        "player_name": df.get("player_name", df.get("player", df.get("Player", ""))).astype(str),
        "match_id": df.get("match_id", pd.Series(range(1, len(df) + 1))).astype(str),
        "minutes": df.get("minutes", 0),
        "position": df.get("Pos", df.get("position", "")).astype(str),
        "np_goals": df.get("np_goals", df.get("Gls", 0)),
        "assists": df.get("assists", df.get("Ast", 0)),
        "xg": df.get("xg", df.get("xG", 0)),
        "xa": df.get("xa", df.get("xA", 0)),
        "key_passes": df.get("key_passes", df.get("KP", 0)),
        "progressive_passes": df.get("progressive_passes", df.get("PrgP", 0)),
        "progressive_carries": df.get("progressive_carries", df.get("PrgC", 0)),
        "successful_dribbles": df.get("successful_dribbles", df.get("Succ", 0)),
        "turnovers": df.get("turnovers", 0),
        "tackles": df.get("tackles", df.get("Tkl", 0)),
        "interceptions": df.get("interceptions", df.get("Int", 0)),
        "blocks": df.get("blocks", df.get("Blocks", 0)),
        "aerials_won": df.get("aerials_won", df.get("AerWon", 0)),
        "team_goals_for_on": df.get("team_goals_for_on", 0),
        "team_goals_against_on": df.get("team_goals_against_on", 0),
        "team_goals_for_off": df.get("team_goals_for_off", 0),
        "team_goals_against_off": df.get("team_goals_against_off", 0),
        "opponent_elo": df.get("opponent_elo", 1500),
        "game_state_time_weighted": df.get("game_state_time_weighted", 1.0),
        "season": df.get("season", "unknown"),
        "team_id": df.get("team_id", df.get("team", "").astype(str)),
    }

    out = pd.DataFrame({k: defaults[k] for k in defaults})

    # Ensure numeric types and fill NaNs
    numeric_cols = [
        "minutes", "np_goals", "assists", "xg", "xa", "key_passes",
        "progressive_passes", "progressive_carries", "successful_dribbles", "turnovers",
        "pressures_success", "tackles", "interceptions", "blocks", "aerials_won",
        "team_goals_for_on", "team_goals_against_on", "team_goals_for_off", "team_goals_against_off",
        "opponent_elo", "game_state_time_weighted",
    ]
    for c in numeric_cols:
        if c in out.columns:
            out[c] = pd.to_numeric(out[c], errors="coerce").fillna(0)

    # Reorder and add any missing canonical columns
    for c in CANONICAL_COLUMNS:
        if c not in out.columns:
            out[c] = 0 if c not in ("player_id", "match_id", "position", "season", "team_id") else ""
    out = out[CANONICAL_COLUMNS]

    os.makedirs(os.path.dirname(output_csv), exist_ok=True)
    out.to_csv(output_csv, index=False)


def main():
    parser = argparse.ArgumentParser(description="Convert FBref CSV to PELE canonical schema")
    parser.add_argument("input", help="Path to FBref CSV export")
    parser.add_argument(
        "--output",
        default=os.path.join(os.path.dirname(os.path.dirname(__file__)), "data", "sample_player_matches.csv"),
        help="Output CSV path (default: data/sample_player_matches.csv)",
    )
    args = parser.parse_args()
    normalize_fbref(args.input, args.output)
    print(f"Wrote canonical CSV to: {args.output}")


if __name__ == "__main__":
    main()



