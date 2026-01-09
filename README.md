# PELE: Player Effect Level Evaluation

PELE is a composite football analytics metric designed to estimate a player's total on-pitch contribution by combining offensive value, defensive value, and minutes-based reliability adjustments. It produces both a raw score and a standardized 0-100 scale for easy interpretation.

## Philosophy

- **Process over outcomes**: Uses xG/xA residuals to reward sustainable attacking play, not just goals scored
- **Two-way contribution**: Values defensive actions (tackles, interceptions, blocks, aerials)
- **Sample size aware**: Logarithmic minutes multiplier penalizes small samples and rewards durability
- **Transparent weights**: All component weights are configurable and interpretable

## Quick Start

```bash
pip install -r requirements.txt
python -m examples.example
```

```python
import pandas as pd
from pele.metric import compute_pele

df = pd.read_csv("data/sample_player_matches.csv")
result = compute_pele(df, group_by=["player_id", "season"], standardize=True)
print(result[["player_name", "season", "pele_100", "oc", "dc"]].head(10))
```

## Components

All rates are normalized per 90 minutes.

### Offensive Component (OC)

```
OC = w_g * np_goals_p90                           # Non-penalty goals (1.20)
   + w_pk * penalty_goals_p90                     # Penalty goals (0.30 - reduced)
   + w_a * assists_p90                            # Assists (0.80)
   + w_xg * (xg_p90 - np_goals_p90)              # xG over-performance (0.50)
   + w_xa * (xa_p90 - assists_p90)               # xA over-performance (0.40)
   + w_kp * key_passes_p90                        # Key passes (0.20)
   + w_prog * (prg_passes + 0.7*prg_carries)     # Progressive actions (0.08)
   + w_drib * successful_dribbles_p90            # Dribbles (0.06)
   - w_to * turnovers_p90                         # Turnovers penalty (0.10)
   + w_shot * shots_p90                           # Shot volume (0.03)
   + w_sot * shots_on_target_p90                 # Shot quality (0.05)
   + w_pass_pct * (pass_completion/100)          # Pass accuracy (0.02)
   + w_final_third * passes_final_third_p90     # Final third passes (0.04)
   + w_prog_rec * progressive_receives_p90       # Progressive receives (0.05)
```

### Defensive Component (DC)

```
DC = w_ti * (tackles_p90 + interceptions_p90)    # Tackles + interceptions (0.12)
   + w_blk * blocks_p90                           # Blocks (0.08)
   + w_air * aerials_won_p90                      # Aerial duels (0.05)
   + w_tkl_def * tackles_def_third_p90           # Defensive third tackles (0.04)
   + w_tkl_mid * tackles_mid_third_p90           # Middle third tackles (0.02)
   + w_tkl_att * tackles_att_third_p90           # Attacking third tackles (0.01)
```

### Minutes Multiplier

```python
avg_minutes = sample_mean(minutes)
ratio = log(1 + minutes) / log(1 + avg_minutes)
min_mult = ratio ** 2.0  # Power of 2 for steeper curve
```

Players with above-average minutes get a bonus (>1.0), below-average get a penalty (<1.0).

### Final Score

```
base_score = OC + DC
pele_raw = base_score * min_mult
pele_100 = 50 + 10 * zscore(pele_raw)  # Standardized scale
```

## Data Format

Required columns in input CSV:

| Column | Description |
|--------|-------------|
| `player_id` | Unique player identifier |
| `player_name` | Player name (optional) |
| `match_id` | Match/season identifier |
| `minutes` | Minutes played |
| `np_goals` | Non-penalty goals |
| `penalty_goals` | Penalty goals scored |
| `assists` | Assists |
| `xg`, `xa` | Expected goals/assists |
| `key_passes` | Key passes |
| `progressive_passes`, `progressive_carries` | Progressive actions |
| `successful_dribbles`, `turnovers` | Dribble stats |
| `shots`, `shots_on_target` | Shooting stats |
| `pass_completion_pct` | Pass completion % |
| `passes_into_final_third` | Passes into final third |
| `progressive_receives` | Progressive receives |
| `tackles`, `interceptions`, `blocks` | Defensive actions |
| `tackles_def_third`, `tackles_mid_third`, `tackles_att_third` | Tackle locations |
| `aerials_won` | Aerial duels won |
| `season`, `team_id` | Grouping columns (optional) |

## Importing FBref Data

Convert FBref season aggregate exports to PELE format:

```bash
python scripts/import_fbref_season_agg.py /path/to/fbref_export.csv
python -m examples.example
```

The importer handles FBref's two-row header format and maps columns like `G-PK`, `PK`, `Ast`, `xG`, `xAG`, `KP`, `PrgP`, `PrgC`, etc.

## Example Output

```
          player_name     season   pele_100     oc     dc
0        Lionel Messi  2020-2021      97.9   3.65   0.14
1     Ousmane Dembélé  2024-2025      93.7   3.99   0.16
2       Michael Olise  2024-2025      90.9   3.36   0.33
3        Lionel Messi  2022-2023      87.6   3.20   0.15
4         Luis Muriel  2020-2021      86.3   3.55   0.39
```

## Customizing Weights

```python
from pele.metric import compute_pele, PeleWeights

custom = PeleWeights(w_g=1.5, w_a=1.0, w_ti=0.15)
result = compute_pele(df, weights=custom)
```

## License

MIT
