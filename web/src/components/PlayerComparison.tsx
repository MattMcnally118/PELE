import {
  Radar,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  ResponsiveContainer,
  Legend,
  Tooltip,
} from "recharts";
import type { Player } from "../types/player";

interface PlayerComparisonProps {
  players: Player[];
  onRemovePlayer: (player: Player) => void;
  onClearAll: () => void;
}

const COLORS = ["#2563eb", "#dc2626", "#16a34a"];

export function PlayerComparison({
  players,
  onRemovePlayer,
  onClearAll,
}: PlayerComparisonProps) {
  if (players.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow p-8 text-center">
        <div className="text-gray-400 text-6xl mb-4">⚖️</div>
        <h2 className="text-xl font-semibold text-gray-700 mb-2">
          Compare Players
        </h2>
        <p className="text-gray-500">
          Select up to 3 players from the Search tab to compare them side by
          side.
        </p>
      </div>
    );
  }

  // Create radar data with all players
  const radarData = [
    { stat: "Goals", ...getStatValues(players, "np_goals_p90", 100) },
    { stat: "Assists", ...getStatValues(players, "assists_p90", 150) },
    { stat: "xG", ...getStatValues(players, "xg_p90", 100) },
    { stat: "Key Passes", ...getStatValues(players, "key_passes_p90", 25) },
    {
      stat: "Prog. Actions",
      ...getProgValues(players),
    },
    { stat: "Tackles", ...getStatValues(players, "tackles_p90", 25) },
    { stat: "Interceptions", ...getStatValues(players, "interceptions_p90", 40) },
    { stat: "Aerials", ...getStatValues(players, "aerials_won_p90", 20) },
  ];

  return (
    <div className="space-y-6">
      {/* Selected Players Bar */}
      <div className="bg-white rounded-lg shadow p-4">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold">Comparing {players.length} Players</h2>
          <button
            onClick={onClearAll}
            className="text-sm text-red-600 hover:text-red-700"
          >
            Clear All
          </button>
        </div>
        <div className="flex flex-wrap gap-3">
          {players.map((player, idx) => (
            <div
              key={`${player.player_id}-${player.season}`}
              className="flex items-center gap-2 bg-gray-100 rounded-lg px-3 py-2"
              style={{ borderLeft: `4px solid ${COLORS[idx]}` }}
            >
              <div>
                <div className="font-medium">{player.player_name}</div>
                <div className="text-xs text-gray-500">
                  {player.team_id} | {player.season}
                </div>
              </div>
              <button
                onClick={() => onRemovePlayer(player)}
                className="text-gray-400 hover:text-red-500 ml-2"
              >
                ×
              </button>
            </div>
          ))}
          {players.length < 3 && (
            <div className="flex items-center text-gray-400 text-sm">
              + Add {3 - players.length} more from Search tab
            </div>
          )}
        </div>
      </div>

      {/* Comparison Content */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Radar Chart */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold mb-4">Performance Comparison</h3>
          <ResponsiveContainer width="100%" height={400}>
            <RadarChart data={radarData}>
              <PolarGrid />
              <PolarAngleAxis dataKey="stat" tick={{ fontSize: 11 }} />
              <PolarRadiusAxis angle={30} domain={[0, 100]} tick={false} />
              {players.map((player, idx) => (
                <Radar
                  key={`${player.player_id}-${player.season}`}
                  name={player.player_name}
                  dataKey={`player${idx}`}
                  stroke={COLORS[idx]}
                  fill={COLORS[idx]}
                  fillOpacity={0.2}
                />
              ))}
              <Legend />
              <Tooltip />
            </RadarChart>
          </ResponsiveContainer>
        </div>

        {/* Stats Table */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold mb-4">Stats Comparison</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-2 px-1">Stat</th>
                  {players.map((player, idx) => (
                    <th
                      key={`${player.player_id}-${player.season}`}
                      className="text-right py-2 px-2"
                      style={{ color: COLORS[idx] }}
                    >
                      {player.player_name.split(" ").pop()}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                <CompareRow label="PELE Score" players={players} stat="pele_100" highlight />
                <CompareRow label="Offensive (OC)" players={players} stat="oc" />
                <CompareRow label="Defensive (DC)" players={players} stat="dc" />
                <tr className="h-2" />
                <CompareRow label="Goals/90" players={players} stat="np_goals_p90" />
                <CompareRow label="Assists/90" players={players} stat="assists_p90" />
                <CompareRow label="xG/90" players={players} stat="xg_p90" />
                <CompareRow label="xA/90" players={players} stat="xa_p90" />
                <CompareRow label="Key Passes/90" players={players} stat="key_passes_p90" />
                <CompareRow label="Shots/90" players={players} stat="shots_p90" />
                <tr className="h-2" />
                <CompareRow label="Tackles/90" players={players} stat="tackles_p90" />
                <CompareRow label="Interceptions/90" players={players} stat="interceptions_p90" />
                <CompareRow label="Blocks/90" players={players} stat="blocks_p90" />
                <CompareRow label="Aerials Won/90" players={players} stat="aerials_won_p90" />
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* PELE Score Comparison */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold mb-4">PELE Score Breakdown</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {players.map((player, idx) => (
            <div
              key={`${player.player_id}-${player.season}`}
              className="border-2 rounded-lg p-4"
              style={{ borderColor: COLORS[idx] }}
            >
              <div className="text-center mb-4">
                <div className="text-3xl font-bold" style={{ color: COLORS[idx] }}>
                  {player.pele_100.toFixed(1)}
                </div>
                <div className="font-medium">{player.player_name}</div>
                <div className="text-sm text-gray-500">{player.season}</div>
              </div>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Offensive</span>
                  <span className="font-medium">{player.oc.toFixed(2)}</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="h-2 rounded-full"
                    style={{
                      width: `${Math.min(100, player.oc * 25)}%`,
                      backgroundColor: COLORS[idx],
                    }}
                  />
                </div>
                <div className="flex justify-between text-sm">
                  <span>Defensive</span>
                  <span className="font-medium">{player.dc.toFixed(2)}</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="h-2 rounded-full"
                    style={{
                      width: `${Math.min(100, player.dc * 80)}%`,
                      backgroundColor: COLORS[idx],
                    }}
                  />
                </div>
                <div className="flex justify-between text-sm">
                  <span>Minutes Mult.</span>
                  <span className="font-medium">{player.min_mult.toFixed(2)}x</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function getStatValues(
  players: Player[],
  stat: keyof Player,
  multiplier: number
): Record<string, number> {
  const result: Record<string, number> = {};
  players.forEach((player, idx) => {
    result[`player${idx}`] = Math.min(100, (player[stat] as number) * multiplier);
  });
  return result;
}

function getProgValues(players: Player[]): Record<string, number> {
  const result: Record<string, number> = {};
  players.forEach((player, idx) => {
    result[`player${idx}`] = Math.min(
      100,
      (player.progressive_passes_p90 + player.progressive_carries_p90) * 5
    );
  });
  return result;
}

function CompareRow({
  label,
  players,
  stat,
  highlight = false,
}: {
  label: string;
  players: Player[];
  stat: keyof Player;
  highlight?: boolean;
}) {
  const values = players.map((p) => p[stat] as number);
  const maxVal = Math.max(...values);

  return (
    <tr className={highlight ? "bg-blue-50 font-medium" : "hover:bg-gray-50"}>
      <td className="py-2 px-1">{label}</td>
      {players.map((player, idx) => {
        const val = player[stat] as number;
        const isMax = val === maxVal && players.length > 1;
        return (
          <td
            key={`${player.player_id}-${player.season}`}
            className={`text-right py-2 px-2 ${isMax ? "font-bold" : ""}`}
            style={isMax ? { color: COLORS[idx] } : {}}
          >
            {val.toFixed(2)}
          </td>
        );
      })}
    </tr>
  );
}
