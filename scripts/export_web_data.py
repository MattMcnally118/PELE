"""Export PELE results to JSON for the web app."""
import json
import os
import sys

import pandas as pd

# Add parent directory to path for imports
sys.path.insert(0, os.path.dirname(os.path.dirname(__file__)))

from pele.metric import compute_pele


def main():
    # Load the data
    data_path = os.path.join(os.path.dirname(os.path.dirname(__file__)), "data", "sample_player_matches.csv")
    df = pd.read_csv(data_path)

    # Compute PELE scores grouped by player and season
    result = compute_pele(df, group_by=["player_id", "season"], standardize=True)

    # Add team info from original data (take first team for each player-season)
    team_map = df.groupby(["player_id", "season"])["team_id"].first().reset_index()
    result = result.merge(team_map, on=["player_id", "season"], how="left")

    # Round numeric columns for smaller JSON
    numeric_cols = result.select_dtypes(include=["float64"]).columns
    result[numeric_cols] = result[numeric_cols].round(3)

    # Select and rename columns for the web app
    output_cols = [
        "player_id", "player_name", "season", "team_id",
        "pele_100", "pele_raw", "oc", "dc", "min_mult",
        "np_goals_p90", "penalty_goals_p90", "assists_p90",
        "xg_p90", "xa_p90", "key_passes_p90",
        "progressive_passes_p90", "progressive_carries_p90", "progressive_receives_p90",
        "successful_dribbles_p90", "turnovers_p90",
        "shots_p90", "shots_on_target_p90", "passes_into_final_third_p90",
        "tackles_p90", "interceptions_p90", "blocks_p90", "aerials_won_p90",
        "tackles_def_third_p90", "tackles_mid_third_p90", "tackles_att_third_p90",
    ]

    # Only include columns that exist
    output_cols = [c for c in output_cols if c in result.columns]
    output = result[output_cols].copy()

    # Convert to list of dicts
    records = output.to_dict(orient="records")

    # Write to JSON
    output_path = os.path.join(os.path.dirname(os.path.dirname(__file__)), "web", "src", "data", "players.json")
    with open(output_path, "w") as f:
        json.dump(records, f)

    print(f"Exported {len(records)} player-season records to {output_path}")

    # Also export unique values for filters
    filters = {
        "seasons": sorted(df["season"].dropna().unique().tolist()),
        "teams": sorted(df["team_id"].dropna().unique().tolist()),
    }

    filters_path = os.path.join(os.path.dirname(os.path.dirname(__file__)), "web", "src", "data", "filters.json")
    with open(filters_path, "w") as f:
        json.dump(filters, f)

    print(f"Exported filter options to {filters_path}")


if __name__ == "__main__":
    main()
