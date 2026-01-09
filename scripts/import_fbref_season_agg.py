import argparse
import csv
import os
from itertools import zip_longest
from typing import Dict, Iterable, List, Sequence


CANONICAL_COLUMNS: List[str] = [
    "player_id", "player_name", "match_id", "minutes",
    "np_goals", "penalty_goals", "assists", "xg", "xa", "key_passes",
    "progressive_passes", "progressive_carries", "successful_dribbles", "turnovers",
    "tackles", "interceptions", "blocks", "aerials_won",
    # New stats
    "shots", "shots_on_target", "pass_completion_pct", "passes_into_final_third",
    "progressive_receives", "tackles_def_third", "tackles_mid_third", "tackles_att_third",
    "dribble_success_pct", "dribble_attempts",
    "season", "team_id"
]


def _next_nonempty_row(reader: csv.reader) -> List[str]:
    for row in reader:
        if any(cell.strip() for cell in row):
            return row
    raise ValueError("Unexpected end of file when looking for header rows")


def normalize_fbref_season_agg(input_csv: str, output_csv: str) -> None:
    with open(input_csv, newline="", encoding="utf-8") as src, open(output_csv, "w", newline="", encoding="utf-8") as dst:
        reader = csv.reader(src)
        writer = csv.DictWriter(dst, fieldnames=CANONICAL_COLUMNS)
        writer.writeheader()

        header1 = _next_nonempty_row(reader)
        header2 = _next_nonempty_row(reader)

        columns: List[str] = []
        for h1, h2 in zip_longest(header1, header2, fillvalue=""):
            h1 = h1.strip()
            h2 = h2.strip()
            if h1 and h2:
                columns.append(f"{h1}|{h2}")
            elif h1:
                columns.append(h1)
            else:
                columns.append(h2)
        col_idx: Dict[str, int] = {name: idx for idx, name in enumerate(columns)}

        def pick(row: Sequence[str], names: Iterable[str]) -> str:
            for name in names:
                idx = col_idx.get(name)
                if idx is not None:
                    val = row[idx].strip()
                    if val != "":
                        return val
            return ""

        def to_float(value: str) -> float:
            try:
                return float(value)
            except (TypeError, ValueError):
                return 0.0

        def combined_turnovers(row: Sequence[str]) -> float:
            dis = to_float(pick(row, ["Carries|Dis"]))
            mis = to_float(pick(row, ["Carries|Mis"]))
            return dis + mis

        for idx, row in enumerate(reader):
            if not any(cell.strip() for cell in row):
                continue
            if len(row) < len(columns):
                row = row + [""] * (len(columns) - len(row))
            elif len(row) > len(columns):
                row = row[: len(columns)]

            player_name = pick(row, ["Player"])
            player_id = pick(row, ["-additional|-9999", "-additional"]) or player_name

            # Basic stats
            minutes = to_float(pick(row, ["Playing Time|Min", "Min"]))
            np_goals = to_float(pick(row, ["Performance|G-PK", "G-PK"]))
            penalty_goals = to_float(pick(row, ["Performance|PK", "PK"]))
            assists = to_float(pick(row, ["Performance|Ast", "Ast"]))
            xg = to_float(pick(row, ["Expected|xG", "xG"]))
            xa = to_float(pick(row, ["Expected|xAG", "xAG"]))
            key_passes = to_float(pick(row, ["KP"]))
            prg_p = to_float(pick(row, ["PrgP"]))
            prg_c = to_float(pick(row, ["PrgC"]))
            drib_succ = to_float(pick(row, ["Take-Ons|Succ"]))
            turnovers = combined_turnovers(row)
            tackles = to_float(pick(row, ["Tackles|Tkl"]))
            interceptions = to_float(pick(row, ["Int"]))
            blocks = to_float(pick(row, ["Blocks|Blocks"]))
            aerials_won = to_float(pick(row, ["Aerial Duels|Won"]))

            # New stats
            shots = to_float(pick(row, ["Standard|Sh", "Sh"]))
            shots_on_target = to_float(pick(row, ["Standard|SoT", "SoT"]))
            pass_cmp_pct = to_float(pick(row, ["Total|Cmp%", "Cmp%"]))
            passes_final_third = to_float(pick(row, ["1/3"]))
            prg_r = to_float(pick(row, ["PrgR"]))
            tkl_def = to_float(pick(row, ["Tackles|Def 3rd"]))
            tkl_mid = to_float(pick(row, ["Tackles|Mid 3rd"]))
            tkl_att = to_float(pick(row, ["Tackles|Att 3rd"]))
            drib_att = to_float(pick(row, ["Take-Ons|Att"]))
            drib_succ_pct = to_float(pick(row, ["Take-Ons|Succ%"]))

            record = {
                "player_id": player_id,
                "player_name": player_name,
                "match_id": f"season_agg_{idx}",
                "minutes": minutes,
                "np_goals": np_goals,
                "penalty_goals": penalty_goals,
                "assists": assists,
                "xg": xg,
                "xa": xa,
                "key_passes": key_passes,
                "progressive_passes": prg_p,
                "progressive_carries": prg_c,
                "successful_dribbles": drib_succ,
                "turnovers": turnovers,
                "tackles": tackles,
                "interceptions": interceptions,
                "blocks": blocks,
                "aerials_won": aerials_won,
                # New stats
                "shots": shots,
                "shots_on_target": shots_on_target,
                "pass_completion_pct": pass_cmp_pct,
                "passes_into_final_third": passes_final_third,
                "progressive_receives": prg_r,
                "tackles_def_third": tkl_def,
                "tackles_mid_third": tkl_mid,
                "tackles_att_third": tkl_att,
                "dribble_success_pct": drib_succ_pct,
                "dribble_attempts": drib_att,
                "season": pick(row, ["Season"]),
                "team_id": pick(row, ["Team"]),
            }
            writer.writerow(record)


def main():
    parser = argparse.ArgumentParser(description="Convert FBref season-aggregate CSV (2-row headers) to PELE canonical schema")
    parser.add_argument("input", help="Path to FBref season-aggregate CSV export")
    parser.add_argument(
        "--output",
        default=os.path.join(os.path.dirname(os.path.dirname(__file__)), "data", "sample_player_matches.csv"),
        help="Output CSV path (default: data/sample_player_matches.csv)",
    )
    args = parser.parse_args()
    normalize_fbref_season_agg(args.input, args.output)
    print(f"Wrote canonical CSV to: {args.output}")


if __name__ == "__main__":
    main()


