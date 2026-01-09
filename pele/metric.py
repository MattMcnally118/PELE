from __future__ import annotations

from dataclasses import dataclass
from typing import Dict, Iterable, List, Optional

import numpy as np
import pandas as pd


@dataclass(frozen=True)
class PeleWeights:
    # Offensive weights
    w_g: float = 1.20      # Non-penalty goals
    w_pk: float = 0.30     # Penalty goals (reduced - less skill-based)
    w_a: float = 0.80      # Assists
    w_xg: float = 0.50     # xG residual (process over outcomes)
    w_xa: float = 0.40     # xA residual (process over outcomes)
    w_kp: float = 0.20     # Key passes
    w_prog: float = 0.08   # Progressive passes/carries
    w_drib: float = 0.06   # Successful dribbles
    w_to: float = 0.10     # Turnovers (penalty)
    w_shot: float = 0.03   # Shots (volume)
    w_sot: float = 0.05    # Shots on target (quality)
    w_pass_pct: float = 0.02  # Pass completion % (scaled by 100)
    w_final_third: float = 0.04  # Passes into final third
    w_prog_rec: float = 0.05  # Progressive receives
    # Defensive weights
    w_ti: float = 0.12     # Tackles + interceptions
    w_blk: float = 0.08    # Blocks
    w_air: float = 0.05    # Aerials won
    w_tkl_def: float = 0.04  # Tackles in defensive third
    w_tkl_mid: float = 0.02  # Tackles in middle third
    w_tkl_att: float = 0.01  # Tackles in attacking third


def _safe(series: pd.Series) -> pd.Series:
    return series.fillna(0.0).astype(float)


def _per90(df: pd.DataFrame, col: str) -> pd.Series:
    minutes = df["minutes"].replace(0, np.nan)
    return _safe(df.get(col, 0)) / (minutes / 90.0)


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
    weights: Optional[PeleWeights] = None,
) -> pd.DataFrame:
    """
    Compute PELE for players from match-level rows.

    Parameters
    ----------
    df : DataFrame
        Match-level player rows with required columns.
    group_by : iterable of str or None
        Columns to aggregate by (e.g., ["player_id"], ["player_id", "season"]).
        If None, returns row-level results.
    standardize : bool
        Whether to include 0–100 standardized `pele_100` scale in the output.
    weights : PeleWeights
        Optional override for default weights.

    Returns
    -------
    DataFrame with per-90 features, component breakdowns (oc, dc), `pele_raw`, and
    optionally `pele_100` if standardize=True.
    """
    if weights is None:
        weights = PeleWeights()

    df = df.copy()

    required = [
        "player_id",
        "match_id",
        "minutes",
        "np_goals",
        "penalty_goals",
        "assists",
        "xg",
        "xa",
        "key_passes",
        "progressive_passes",
        "progressive_carries",
        "successful_dribbles",
        "turnovers",
        "tackles",
        "interceptions",
        "blocks",
        "aerials_won",
        # New stats
        "shots",
        "shots_on_target",
        "pass_completion_pct",
        "passes_into_final_third",
        "progressive_receives",
        "tackles_def_third",
        "tackles_mid_third",
        "tackles_att_third",
        "dribble_success_pct",
    ]
    for col in required:
        if col not in df.columns:
            raise ValueError(f"Missing required column: {col}")

    # Per-90 rates
    rates = {
        "np_goals_p90": _per90(df, "np_goals"),
        "penalty_goals_p90": _per90(df, "penalty_goals"),
        "assists_p90": _per90(df, "assists"),
        "xg_p90": _per90(df, "xg"),
        "xa_p90": _per90(df, "xa"),
        "key_passes_p90": _per90(df, "key_passes"),
        "progressive_passes_p90": _per90(df, "progressive_passes"),
        "progressive_carries_p90": _per90(df, "progressive_carries"),
        "successful_dribbles_p90": _per90(df, "successful_dribbles"),
        "turnovers_p90": _per90(df, "turnovers"),
        "tackles_p90": _per90(df, "tackles"),
        "interceptions_p90": _per90(df, "interceptions"),
        "blocks_p90": _per90(df, "blocks"),
        "aerials_won_p90": _per90(df, "aerials_won"),
        # New stats
        "shots_p90": _per90(df, "shots"),
        "shots_on_target_p90": _per90(df, "shots_on_target"),
        "passes_into_final_third_p90": _per90(df, "passes_into_final_third"),
        "progressive_receives_p90": _per90(df, "progressive_receives"),
        "tackles_def_third_p90": _per90(df, "tackles_def_third"),
        "tackles_mid_third_p90": _per90(df, "tackles_mid_third"),
        "tackles_att_third_p90": _per90(df, "tackles_att_third"),
    }
    rates_df = pd.DataFrame(rates, index=df.index).fillna(0.0)

    # Pass completion % and dribble success % are already percentages, not per-90
    pass_cmp_pct = _safe(df["pass_completion_pct"])
    dribble_success_pct = _safe(df["dribble_success_pct"])

    # Offensive Component (OC)
    oc = (
        weights.w_g * rates_df["np_goals_p90"]
        + weights.w_pk * rates_df["penalty_goals_p90"]
        + weights.w_a * rates_df["assists_p90"]
        + weights.w_xg * (rates_df["xg_p90"] - rates_df["np_goals_p90"])  # process over outcomes
        + weights.w_xa * (rates_df["xa_p90"] - rates_df["assists_p90"])  # process over outcomes
        + weights.w_kp * rates_df["key_passes_p90"]
        + weights.w_prog * (
            rates_df["progressive_passes_p90"]
            + 0.7 * rates_df["progressive_carries_p90"]
        )
        + weights.w_drib * rates_df["successful_dribbles_p90"]
        - weights.w_to * rates_df["turnovers_p90"]
        # New offensive stats
        + weights.w_shot * rates_df["shots_p90"]
        + weights.w_sot * rates_df["shots_on_target_p90"]
        + weights.w_pass_pct * (pass_cmp_pct / 100.0)  # Scale to ~0-1 range
        + weights.w_final_third * rates_df["passes_into_final_third_p90"]
        + weights.w_prog_rec * rates_df["progressive_receives_p90"]
        + weights.w_drib * (dribble_success_pct / 100.0)  # Add dribble success %
    )

    # Defensive Component (DC)
    dc = (
        weights.w_ti * (rates_df["tackles_p90"] + rates_df["interceptions_p90"])
        + weights.w_blk * rates_df["blocks_p90"]
        + weights.w_air * rates_df["aerials_won_p90"]
        # Tackle location weighting (defensive third valued higher)
        + weights.w_tkl_def * rates_df["tackles_def_third_p90"]
        + weights.w_tkl_mid * rates_df["tackles_mid_third_p90"]
        + weights.w_tkl_att * rates_df["tackles_att_third_p90"]
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
            "minutes",
            "np_goals",
            "penalty_goals",
            "assists",
            "xg",
            "xa",
            "key_passes",
            "progressive_passes",
            "progressive_carries",
            "successful_dribbles",
            "turnovers",
            "tackles",
            "interceptions",
            "blocks",
            "aerials_won",
            # New stats (sum-able)
            "shots",
            "shots_on_target",
            "passes_into_final_third",
            "progressive_receives",
            "tackles_def_third",
            "tackles_mid_third",
            "tackles_att_third",
            "dribble_attempts",
        ]
        # Percentage stats need weighted average, not sum
        pct_cols = ["pass_completion_pct", "dribble_success_pct"]
        present = [c for c in agg_cols if c in df.columns]
        present_pct = [c for c in pct_cols if c in df.columns]
        extra_cols = []
        if "player_name" in df.columns:
            extra_cols.append("player_name")
        sum_df = df[group_cols + present + present_pct + [c for c in extra_cols if c in df.columns]].copy()

        agg_dict = {c: "sum" for c in present}
        # Use minutes-weighted mean for percentage stats
        for pct_col in present_pct:
            agg_dict[pct_col] = lambda x, col=pct_col: np.average(x, weights=sum_df.loc[x.index, "minutes"].replace(0, 1))
        sum_grp = sum_df.groupby(group_cols, dropna=False).agg(agg_dict)

        # Rebuild a frame to re-run per-90 and components on aggregates
        rep = sum_grp.reset_index().copy()
        if "player_name" in sum_df.columns and "player_name" not in group_cols:
            name_agg = sum_df.groupby(group_cols, dropna=False)["player_name"].agg(
                lambda x: x.mode().iat[0] if len(x.mode()) else x.iloc[0]
            ).reset_index(drop=True)
            rep["player_name"] = name_agg.values
        rep["match_id"] = "__aggregate__"

        # Run compute_pele recursively without grouping to compute components for aggregates
        tmp = compute_pele(rep, group_by=None, standardize=False, weights=weights)
        result = tmp[group_cols + [
            "oc", "dc", "base_score", "min_mult", "pele_raw"
        ] + [c for c in tmp.columns if c.endswith("_p90")]].copy()

        if "player_name" in df.columns and "player_name" not in group_cols:
            names = (
                df[list(group_cols) + ["player_name"]]
                .dropna(subset=["player_name"])
                .drop_duplicates(subset=group_cols)
            )
            result = result.merge(names, on=group_cols, how="left")

        if standardize:
            result["pele_100"] = 50.0 + 10.0 * _zscore(result["pele_raw"])

        return result.sort_values(by=["pele_raw"], ascending=False, ignore_index=True)

    # Row-level return
    if standardize:
        out["pele_100"] = 50.0 + 10.0 * _zscore(out["pele_raw"])
    return out
