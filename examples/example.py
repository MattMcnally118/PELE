import os
import sys
import pandas as pd

from pele.metric import compute_pele


def main():
    # Allow running with a custom input CSV path: python -m examples.example /path/to/csv
    if len(sys.argv) > 1:
        data_path = sys.argv[1]
    else:
        data_path = os.path.join(os.path.dirname(os.path.dirname(__file__)), "data", "sample_player_matches.csv")

    df = pd.read_csv(data_path)
    result = compute_pele(df, group_by=["player_id", "season"], standardize=True)
    cols = [c for c in ["player_id", "player_name", "season", "pele_raw", "pele_100", "oc", "dc"] if c in result.columns]
    print(result[cols].head(20))


if __name__ == "__main__":
    main()


