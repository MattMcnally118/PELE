from __future__ import annotations

from typing import Dict, Iterable, List, Optional

import numpy as np
import pandas as pd


# Position-specific weights (1-5 scale)
# Positions: FW (Forwards), WG (Wingers/AMs), MF (Midfielders), FB (Fullbacks), CB (Center Backs)
POSITION_WEIGHTS: Dict[str, Dict[str, float]] = {
    "FW": {  # Forwards (ST, CF)
        "goals": 5, "assists": 3, "xg": 5, "xa": 3, "key_passes": 3,
        "prog_pass": 1, "prog_carry": 4, "dribbles": 4, "turnovers": 3,
        "pressures": 3, "tackles_int": 1, "blocks": 1, "aerials": 3,
    },
    "WG": {  # Wingers / Attacking Mids (LW, RW, AM, CAM)
        "goals": 4, "assists": 5, "xg": 4, "xa": 5, "key_passes": 5,
        "prog_pass": 3, "prog_carry": 5, "dribbles": 5, "turnovers": 5,
        "pressures": 3, "tackles_int": 1, "blocks": 1, "aerials": 1,
    },
    "MF": {  # Central/Defensive Midfielders (CM, DM, CDM)
        "goals": 3, "assists": 4, "xg": 3, "xa": 4, "key_passes": 4,
        "prog_pass": 5, "prog_carry": 3, "dribbles": 3, "turnovers": 5,
        "pressures": 4, "tackles_int": 4, "blocks": 3, "aerials": 3,
    },
    "FB": {  # Fullbacks / Wingbacks (LB, RB, LWB, RWB, WB)
        "goals": 1, "assists": 4, "xg": 1, "xa": 4, "key_passes": 4,
        "prog_pass": 5, "prog_carry": 4, "dribbles": 4, "turnovers": 5,
        "pressures": 4, "tackles_int": 5, "blocks": 3, "aerials": 3,
    },
    "CB": {  # Center Backs
        "goals": 1, "assists": 1, "xg": 1, "xa": 1, "key_passes": 1,
        "prog_pass": 3, "prog_carry": 1, "dribbles": 1, "turnovers": 3,
        "pressures": 5, "tackles_int": 5, "blocks": 5, "aerials": 5,
    },
}

# Base weights to scale the 1-5 position weights
BASE_WEIGHTS: Dict[str, float] = {
    "goals": 0.24,       # 5 * 0.24 = 1.20 (max)
    "assists": 0.20,     # 5 * 0.20 = 1.00 (max)
    "xg": 0.10,          # 5 * 0.10 = 0.50 (max)
    "xa": 0.08,          # 5 * 0.08 = 0.40 (max)
    "key_passes": 0.04,  # 5 * 0.04 = 0.20 (max)
    "prog_pass": 0.016,  # 5 * 0.016 = 0.08 (max)
    "prog_carry": 0.012, # 5 * 0.012 = 0.06 (max)
    "dribbles": 0.012,   # 5 * 0.012 = 0.06 (max)
    "turnovers": 0.02,   # 5 * 0.02 = 0.10 (max)
    "pressures": 0.012,  # 5 * 0.012 = 0.06 (max)
    "tackles_int": 0.024,# 5 * 0.024 = 0.12 (max)
    "blocks": 0.016,     # 5 * 0.016 = 0.08 (max)
    "aerials": 0.01,     # 5 * 0.01 = 0.05 (max)
}


def _safe(series: pd.Series) -> pd.Series:
    return series.fillna(0.0).astype(float)


def _per90(df: pd.DataFrame, col: str) -> pd.Series:
    minutes = df["minutes"].replace(0, np.nan)
    return _safe(df.get(col, 0)) / (minutes / 90.0)


def _position_bucket(position: pd.Series) -> pd.Series:
    """Map positions to one of 5 buckets: FW, WG, MF, FB, CB."""
    pos = position.fillna("").str.upper()

    def to_bucket(p: str) -> str:
        # Forwards
        if p.startswith("ST") or p.startswith("CF") or p == "FW":
            return "FW"
        # Wingers and Attacking Mids
        if p in ("LW", "RW") or p.startswith("AM") or p == "CAM":
            return "WG"
        # Central/Defensive Midfielders
        if p in ("CM", "DM", "CDM", "LCM", "RCM"):
            return "MF"
        # Fullbacks/Wingbacks
        if p in ("LB", "RB", "LWB", "RWB", "WB", "FB"):
            return "FB"
        # Center Backs
        if p in ("CB", "RCB", "LCB"):
            return "CB"
        # Default to MF for unknown positions
        return "MF"

    return pos.map(to_bucket)


def _zscore(values: pd.Series) -> pd.Series:
    mu = values.mean()
    sigma = values.std(ddof=0)
    if sigma == 0 or np.isnan(sigma):
        return pd.Series(np.zeros(len(values)), index=values.index)
    return (values - mu) / sigma


def _minutes_multiplier(minutes: pd.Series, reference: float, power: float = 2.0) -> pd.Series:
    """Logarithmic minutes multiplier centered on reference (sample average).

    Power parameter controls steepness:
    - power=1.0: gentle curve
    - power=2.0: steeper curve (more penalty for low minutes, more reward for high)
    """
    log_min = np.log1p(minutes)  # log(1 + minutes)
    log_ref = np.log1p(reference)
    ratio = log_min / log_ref
    return ratio ** power  # Apply power for steeper curve


def compute_pele(
    df: pd.DataFrame,
    group_by: Optional[Iterable[str]] = ("player_id",),
    standardize: bool = True,
) -> pd.DataFrame:
    """
    Compute PELE for players from match-level rows.

    Uses position-specific weights to evaluate players based on their role.

    Parameters
    ----------
    df : DataFrame
        Match-level player rows with required columns.
    group_by : iterable of str or None
        Columns to aggregate by (e.g., ["player_id"], ["player_id", "season"]).
        If None, returns row-level results.
    standardize : bool
        Whether to include 0–100 standardized `pele_100` scale in the output.

    Returns
    -------
    DataFrame with per-90 features, component breakdowns (oc, dc), `pele_raw`, and
    optionally `pele_100` if standardize=True.
    """
    df = df.copy()

    required = [
        "player_id",
        "match_id",
        "minutes",
        "position",
        "np_goals",
        "assists",
        "xg",
        "xa",
        "key_passes",
        "progressive_passes",
        "progressive_carries",
        "successful_dribbles",
        "turnovers",
        "pressures_success",
        "tackles",
        "interceptions",
        "blocks",
        "aerials_won",
    ]
    for col in required:
        if col not in df.columns:
            raise ValueError(f"Missing required column: {col}")

    # Per-90 rates
    rates = {
        "np_goals_p90": _per90(df, "np_goals"),
        "assists_p90": _per90(df, "assists"),
        "xg_p90": _per90(df, "xg"),
        "xa_p90": _per90(df, "xa"),
        "key_passes_p90": _per90(df, "key_passes"),
        "progressive_passes_p90": _per90(df, "progressive_passes"),
        "progressive_carries_p90": _per90(df, "progressive_carries"),
        "successful_dribbles_p90": _per90(df, "successful_dribbles"),
        "turnovers_p90": _per90(df, "turnovers"),
        "pressures_success_p90": _per90(df, "pressures_success"),
        "tackles_p90": _per90(df, "tackles"),
        "interceptions_p90": _per90(df, "interceptions"),
        "blocks_p90": _per90(df, "blocks"),
        "aerials_won_p90": _per90(df, "aerials_won"),
    }
    rates_df = pd.DataFrame(rates, index=df.index).fillna(0.0)

    # Get position buckets for each row
    pos_bucket = _position_bucket(df["position"])

    # Calculate position-specific weights for each row
    def get_weight(stat: str) -> pd.Series:
        """Get the weight for a stat based on position bucket."""
        base = BASE_WEIGHTS[stat]
        return pos_bucket.map(lambda p: POSITION_WEIGHTS[p][stat] * base)

    # Offensive Component (OC) with position-specific weights
    oc = (
        get_weight("goals") * rates_df["np_goals_p90"]
        + get_weight("assists") * rates_df["assists_p90"]
        + get_weight("xg") * (rates_df["xg_p90"] - rates_df["np_goals_p90"])  # process over outcomes
        + get_weight("xa") * (rates_df["xa_p90"] - rates_df["assists_p90"])  # process over outcomes
        + get_weight("key_passes") * rates_df["key_passes_p90"]
        + get_weight("prog_pass") * rates_df["progressive_passes_p90"]
        + get_weight("prog_carry") * rates_df["progressive_carries_p90"]
        + get_weight("dribbles") * rates_df["successful_dribbles_p90"]
        - get_weight("turnovers") * rates_df["turnovers_p90"]
    )

    # Defensive Component (DC) with position-specific weights
    dc = (
        get_weight("pressures") * rates_df["pressures_success_p90"]
        + get_weight("tackles_int") * (rates_df["tackles_p90"] + rates_df["interceptions_p90"])
        + get_weight("blocks") * rates_df["blocks_p90"]
        + get_weight("aerials") * rates_df["aerials_won_p90"]
    )

    # Minutes adjustment with power=2.0 for steeper curve
    avg_minutes = _safe(df["minutes"]).mean()
    min_mult = _minutes_multiplier(_safe(df["minutes"]), avg_minutes, power=2.0)

    base_score = oc + dc
    pele_raw = base_score * min_mult

    identity_cols = [c for c in ["player_id", "player_name", "season", "team_id"] if c in df.columns]
    if not identity_cols:
        identity_cols = ["player_id"]

    out = pd.concat(
        [
            df[identity_cols],
            rates_df,
            pd.DataFrame(
                {
                    "pos_bucket": pos_bucket,
                    "oc": oc,
                    "dc": dc,
                    "base_score": base_score,
                    "min_mult": min_mult,
                    "pele_raw": pele_raw,
                }
            ),
        ],
        axis=1,
    )

    if group_by:
        group_cols = list(group_by)
        agg_cols: List[str] = [
            # Sum numerators then recompute per90 at aggregate level where applicable
            "minutes",
            "np_goals",
            "assists",
            "xg",
            "xa",
            "key_passes",
            "progressive_passes",
            "progressive_carries",
            "successful_dribbles",
            "turnovers",
            "pressures_success",
            "tackles",
            "interceptions",
            "blocks",
            "aerials_won",
        ]
        present = [c for c in agg_cols if c in df.columns]
        extra_cols = ["position"]
        if "player_name" in df.columns:
            extra_cols.append("player_name")
        sum_df = df[group_cols + present + [c for c in extra_cols if c in df.columns]].copy()

        agg_dict = {c: "sum" for c in present}
        sum_grp = sum_df.groupby(group_cols, dropna=False).agg(agg_dict)

        # Rebuild a frame to re-run per-90 and components on aggregates
        rep = sum_grp.reset_index().copy()
        # Use most frequent position
        pos_agg = sum_df.groupby(group_cols, dropna=False)["position"].agg(
            lambda x: x.mode().iat[0] if len(x.mode()) else (x.iloc[0] if len(x) else "")
        ).reset_index(drop=True)
        rep["position"] = pos_agg.values
        if "player_name" in sum_df.columns and "player_name" not in group_cols:
            name_agg = sum_df.groupby(group_cols, dropna=False)["player_name"].agg(
                lambda x: x.mode().iat[0] if len(x.mode()) else x.iloc[0]
            ).reset_index(drop=True)
            rep["player_name"] = name_agg.values
        rep["match_id"] = "__aggregate__"

        # Run compute_pele recursively without grouping to compute components for aggregates
        tmp = compute_pele(rep, group_by=None, standardize=False)
        result = tmp[group_cols + [
            "pos_bucket", "oc", "dc", "base_score", "min_mult", "pele_raw"
        ] + [c for c in tmp.columns if c.endswith("_p90")]].copy()

        if "player_name" in df.columns and "player_name" not in group_cols:
            names = (
                df[list(group_cols) + ["player_name"]]
                .dropna(subset=["player_name"])
                .drop_duplicates(subset=group_cols)
            )
            result = result.merge(names, on=group_cols, how="left")

        if standardize:
            result["pele_100"] = 50.0 + 10.0 * _zscore(result["pele_raw"])  # within returned sample

        return result.sort_values(by=["pele_raw"], ascending=False, ignore_index=True)

    # Row-level return
    if standardize:
        out["pele_100"] = 50.0 + 10.0 * _zscore(out["pele_raw"])  # within returned sample
    return out



