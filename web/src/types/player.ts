export interface Player {
  player_id: string;
  player_name: string;
  season: string;
  team_id: string;
  pele_100: number;
  pele_raw: number;
  oc: number;
  dc: number;
  min_mult: number;
  np_goals_p90: number;
  penalty_goals_p90: number;
  assists_p90: number;
  xg_p90: number;
  xa_p90: number;
  key_passes_p90: number;
  progressive_passes_p90: number;
  progressive_carries_p90: number;
  progressive_receives_p90: number;
  successful_dribbles_p90: number;
  turnovers_p90: number;
  shots_p90: number;
  shots_on_target_p90: number;
  passes_into_final_third_p90: number;
  tackles_p90: number;
  interceptions_p90: number;
  blocks_p90: number;
  aerials_won_p90: number;
  tackles_def_third_p90: number;
  tackles_mid_third_p90: number;
  tackles_att_third_p90: number;
}

export interface Filters {
  seasons: string[];
  teams: string[];
}

export type SortField =
  | "pele_100"
  | "oc"
  | "dc"
  | "np_goals_p90"
  | "assists_p90"
  | "xg_p90"
  | "tackles_p90"
  | "player_name";

export type SortDirection = "asc" | "desc";
